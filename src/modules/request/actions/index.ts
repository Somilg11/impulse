"use server";

import db from "@/lib/db";
import { BODY_TYPE, MEMBER_ROLE, REST_METHOD } from "@prisma/client";

import {
  assertCollectionAccess,
  assertRequestAccess,
  assertWorkspaceMember,
} from "@/lib/authz";
import { buildExecRequest, type ExecResult } from "@/lib/http";
import { executeOnServer } from "@/lib/server-fetch";

export type Request = {
  name: string;
  method: REST_METHOD;
  url: string;
  body?: string;
  headers?: string;
  parameters?: string;
  bodyType?: BODY_TYPE;
  /** Serialized AuthConfig - see src/lib/auth-schemes.ts */
  auth?: string;
  /** Serialized Assertion[] - see src/lib/assertions.ts */
  tests?: string;
};

export type RunResponse = {
  success: boolean;
  result: ExecResult;
  runId?: string;
};

export const addRequestToCollection = async (
  collectionId: string,
  value: Request
) => {
  await assertCollectionAccess(collectionId, MEMBER_ROLE.EDITOR);

  return await db.request.create({
    data: {
      collectionId,
      name: value.name,
      method: value.method,
      url: value.url,
      body: value.body,
      headers: value.headers,
      parameters: value.parameters,
      bodyType: value.bodyType ?? BODY_TYPE.JSON,
      auth: value.auth,
      tests: value.tests,
    },
  });
};

export const saveRequest = async (id: string, value: Request) => {
  await assertRequestAccess(id, MEMBER_ROLE.EDITOR);

  return await db.request.update({
    where: { id },
    data: {
      name: value.name,
      method: value.method,
      url: value.url,
      body: value.body,
      headers: value.headers,
      parameters: value.parameters,
      ...(value.bodyType ? { bodyType: value.bodyType } : {}),
      ...(value.auth !== undefined ? { auth: value.auth } : {}),
      ...(value.tests !== undefined ? { tests: value.tests } : {}),
    },
  });
};

export const getAllRequestFromCollection = async (collectionId: string) => {
  await assertCollectionAccess(collectionId);

  return await db.request.findMany({
    where: { collectionId },
    orderBy: { createdAt: "asc" },
  });
};

export const deleteRequest = async (id: string) => {
  await assertRequestAccess(id, MEMBER_ROLE.EDITOR);
  await db.request.delete({ where: { id } });
};

/**
 * Persist an execution result against a saved request. Used by browser mode,
 * where the request is sent from the user's machine and only the outcome is
 * recorded here.
 */
export const recordRun = async (
  requestId: string,
  result: ExecResult,
  testResults?: unknown
): Promise<{ runId: string }> => {
  await assertRequestAccess(requestId);

  const run = await db.requestRun.create({
    data: {
      requestId,
      status: result.status ?? 0,
      statusText: result.statusText || (result.error ? "Error" : null),
      headers: result.headers ?? {},
      body: result.body ?? "",
      durationMs: Math.round(result.durationMs ?? 0),
      size: result.size ?? 0,
      via: result.via,
      ...(testResults !== undefined ? { testResults: testResults as object } : {}),
    },
    select: { id: true },
  });

  if (!result.error && result.status > 0) {
    await db.request.update({
      where: { id: requestId },
      data: { response: result.body ?? "" },
    });
  }

  return { runId: run.id };
};

/**
 * Execute a saved request from the server (proxy mode) and record the run.
 * The URL is validated by the SSRF guard inside `executeOnServer`.
 */
export const run = async (requestId: string): Promise<RunResponse> => {
  await assertRequestAccess(requestId);

  const request = await db.request.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Request not found");

  const result = await executeOnServer(
    buildExecRequest({
      method: request.method,
      url: request.url,
      headers: request.headers,
      parameters: request.parameters,
      body: request.body,
    })
  );

  const { runId } = await recordRun(requestId, result);

  return { success: !result.error, result, runId };
};

/** Recent runs for a saved request, newest first. */
export const getRequestRuns = async (requestId: string, take = 20) => {
  await assertRequestAccess(requestId);

  return await db.requestRun.findMany({
    where: { requestId },
    orderBy: { createdAt: "desc" },
    take,
  });
};

/**
 * Every request in a collection and its subfolders, in run order.
 *
 * Used by the collection runner. Requests carry their auth, body type, and
 * assertions so the runner composes them exactly as a manual send would.
 */
export const getRunnableRequests = async (collectionId: string) => {
  await assertCollectionAccess(collectionId);

  const collect = async (
    id: string,
    prefix: string
  ): Promise<
    {
      id: string;
      label: string;
      name: string;
      method: string;
      url: string;
      headers: unknown;
      parameters: unknown;
      body: unknown;
      bodyType: string;
      auth: unknown;
      tests: unknown;
    }[]
  > => {
    const [requests, folders] = await Promise.all([
      db.request.findMany({
        where: { collectionId: id },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      }),
      db.collection.findMany({
        where: { parentId: id },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: { id: true, name: true },
      }),
    ]);

    const own = requests.map((request) => ({
      id: request.id,
      label: prefix ? `${prefix} / ${request.name}` : request.name,
      name: request.name,
      method: request.method as string,
      url: request.url,
      headers: request.headers,
      parameters: request.parameters,
      body: request.body,
      bodyType: request.bodyType as string,
      auth: request.auth,
      tests: request.tests,
    }));

    const nested = await Promise.all(
      folders.map((folder) =>
        collect(folder.id, prefix ? `${prefix} / ${folder.name}` : folder.name)
      )
    );

    return [...own, ...nested.flat()];
  };

  return await collect(collectionId, "");
};

/** Renames a request without touching the rest of it. */
export const renameRequest = async (id: string, name: string) => {
  await assertRequestAccess(id, MEMBER_ROLE.EDITOR);

  const trimmed = name.trim();
  if (!trimmed) throw new Error("A name is required");

  return await db.request.update({
    where: { id },
    data: { name: trimmed },
    select: { id: true, name: true },
  });
};

/**
 * Copies a request into the same collection.
 *
 * Everything that defines the request travels with it - headers, params, body
 * and its type, auth, and assertions - because a duplicate that silently drops
 * the auth scheme is worse than no duplicate at all.
 */
export const duplicateRequest = async (id: string) => {
  const { collectionId } = await assertRequestAccess(id, MEMBER_ROLE.EDITOR);

  const source = await db.request.findUnique({ where: { id } });
  if (!source) throw new Error("Request not found");

  return await db.request.create({
    data: {
      collectionId,
      name: `${source.name} copy`,
      method: source.method,
      url: source.url,
      headers: source.headers ?? undefined,
      parameters: source.parameters ?? undefined,
      body: source.body ?? undefined,
      bodyType: source.bodyType,
      auth: source.auth ?? undefined,
      tests: source.tests ?? undefined,
      position: source.position + 1,
    },
  });
};

/**
 * Every request in a workspace, with the collection path that locates it.
 *
 * Backs the command palette, which needs to search across collections rather
 * than within one - the per-collection query would mean one round trip per
 * folder just to populate a search box.
 */
export const getWorkspaceRequests = async (workspaceId: string) => {
  await assertWorkspaceMember(workspaceId);

  const [collections, requests] = await Promise.all([
    db.collection.findMany({
      where: { workspaceId },
      select: { id: true, name: true, parentId: true },
    }),
    db.request.findMany({
      where: { collection: { workspaceId } },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        method: true,
        url: true,
        headers: true,
        parameters: true,
        body: true,
        bodyType: true,
        auth: true,
        tests: true,
        collectionId: true,
      },
    }),
  ]);

  const byId = new Map(collections.map((c) => [c.id, c]));

  // Build "Payments / Refunds" style paths, guarding against a cycle so a
  // malformed tree cannot hang the request.
  const pathOf = (collectionId: string): string => {
    const parts: string[] = [];
    const seen = new Set<string>();
    let cursor: string | null = collectionId;
    while (cursor && !seen.has(cursor)) {
      seen.add(cursor);
      const node = byId.get(cursor);
      if (!node) break;
      parts.unshift(node.name);
      cursor = node.parentId;
    }
    return parts.join(" / ");
  };

  return requests.map((request) => ({
    ...request,
    collectionPath: pathOf(request.collectionId),
  }));
};

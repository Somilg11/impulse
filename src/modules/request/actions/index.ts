"use server";

import db from "@/lib/db";
import { MEMBER_ROLE, REST_METHOD } from "@prisma/client";

import {
  assertCollectionAccess,
  assertRequestAccess,
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
  result: ExecResult
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

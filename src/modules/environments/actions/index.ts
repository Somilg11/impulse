"use server";

import db from "@/lib/db";
import { assertEnvironmentAccess, assertWorkspaceMember } from "@/lib/authz";
import { MEMBER_ROLE } from "@prisma/client";
import type { Variable } from "@/lib/variables";

export const getEnvironments = async (workspaceId: string) => {
  await assertWorkspaceMember(workspaceId);

  return await db.environment.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  });
};

export const createEnvironment = async (workspaceId: string, name: string) => {
  await assertWorkspaceMember(workspaceId, MEMBER_ROLE.EDITOR);

  return await db.environment.create({
    data: { workspaceId, name, variables: [] },
  });
};

export const updateEnvironment = async (
  environmentId: string,
  data: { name?: string; variables?: Variable[] }
) => {
  await assertEnvironmentAccess(environmentId, MEMBER_ROLE.EDITOR);

  return await db.environment.update({
    where: { id: environmentId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.variables !== undefined ? { variables: data.variables } : {}),
    },
  });
};

export const deleteEnvironment = async (environmentId: string) => {
  await assertEnvironmentAccess(environmentId, MEMBER_ROLE.EDITOR);
  await db.environment.delete({ where: { id: environmentId } });
};

/** Duplicating an environment is the usual way to make a staging copy of prod. */
export const duplicateEnvironment = async (environmentId: string) => {
  const { workspaceId } = await assertEnvironmentAccess(
    environmentId,
    MEMBER_ROLE.EDITOR
  );

  const source = await db.environment.findUnique({ where: { id: environmentId } });
  if (!source) throw new Error("Environment not found");

  // Postgres will reject a duplicate name, so find a free suffix first.
  const existing = await db.environment.findMany({
    where: { workspaceId },
    select: { name: true },
  });
  const taken = new Set(existing.map((e) => e.name));
  let name = `${source.name} copy`;
  let n = 2;
  while (taken.has(name)) name = `${source.name} copy ${n++}`;

  return await db.environment.create({
    data: {
      workspaceId,
      name,
      variables: source.variables ?? [],
    },
  });
};

import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { MEMBER_ROLE } from "@prisma/client";
import { headers } from "next/headers";

/**
 * Authorization helpers.
 *
 * Every `"use server"` export is a publicly reachable HTTP endpoint, so any
 * action that accepts an id must prove the caller belongs to the workspace that
 * owns it. These helpers throw on failure and return the resolved context on
 * success.
 */

const ROLE_RANK: Record<MEMBER_ROLE, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
};

export class AuthzError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthzError";
  }
}

export async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new AuthzError("Unauthorized");
  return session.user;
}

/**
 * Assert the current user is a member of `workspaceId` with at least `min` role.
 * The workspace owner is always treated as ADMIN, even if the membership row is
 * missing (workspaces created before members were introduced).
 */
export async function assertWorkspaceMember(
  workspaceId: string,
  min: MEMBER_ROLE = MEMBER_ROLE.VIEWER
) {
  const user = await requireUser();
  if (!workspaceId) throw new AuthzError("Workspace not found");

  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      ownerId: true,
      members: { where: { userId: user.id }, select: { role: true } },
    },
  });

  if (!workspace) throw new AuthzError("Workspace not found");

  const role =
    workspace.ownerId === user.id
      ? MEMBER_ROLE.ADMIN
      : workspace.members[0]?.role;

  if (!role) throw new AuthzError("Forbidden");
  if (ROLE_RANK[role] < ROLE_RANK[min]) throw new AuthzError("Forbidden");

  return { user, workspaceId: workspace.id, role };
}

export async function assertCollectionAccess(
  collectionId: string,
  min: MEMBER_ROLE = MEMBER_ROLE.VIEWER
) {
  if (!collectionId) throw new AuthzError("Collection not found");

  const collection = await db.collection.findUnique({
    where: { id: collectionId },
    select: { id: true, workspaceId: true },
  });
  if (!collection) throw new AuthzError("Collection not found");

  const ctx = await assertWorkspaceMember(collection.workspaceId, min);
  return { ...ctx, collectionId: collection.id };
}

export async function assertRequestAccess(
  requestId: string,
  min: MEMBER_ROLE = MEMBER_ROLE.VIEWER
) {
  if (!requestId) throw new AuthzError("Request not found");

  const request = await db.request.findUnique({
    where: { id: requestId },
    select: { id: true, collection: { select: { id: true, workspaceId: true } } },
  });
  if (!request) throw new AuthzError("Request not found");

  const ctx = await assertWorkspaceMember(request.collection.workspaceId, min);
  return { ...ctx, requestId: request.id, collectionId: request.collection.id };
}

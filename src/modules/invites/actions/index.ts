"use server"

import db from "@/lib/db"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { absoluteUrl } from "@/lib/app-url"
import { assertWorkspaceMember } from "@/lib/authz"
import { MEMBER_ROLE } from "@prisma/client"
import { randomBytes } from "crypto"

export const generateWorkspaceInvite = async (workspaceId: string) => {
  // Only workspace admins may hand out membership.
  const { user } = await assertWorkspaceMember(workspaceId, MEMBER_ROLE.ADMIN)

  const token = randomBytes(32).toString("hex")

  const invite = await db.workspaceInvite.create({
    data: {
      workspaceId,
      token,
      createdById: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    }
  })

  // absoluteUrl, not a template literal: the configured origin may carry a
  // trailing slash, and an unset variable would otherwise render the string
  // "undefined" into a link handed to a teammate.
  return absoluteUrl(`/invite/${invite.token}`)
}

/**
 * Why `acceptWorkspaceInvite` returns a result instead of throwing.
 *
 * A `"use server"` function that throws reaches the browser as React error
 * #441 with the message stripped - production deliberately redacts it to avoid
 * leaking internals. That made every outcome here look identical: an expired
 * link, a bad token, and simply not being signed in all rendered as "the invite
 * may be invalid or expired". These are expected outcomes of a user action, not
 * exceptions, so they are returned as data and the caller can say which
 * happened. Genuine faults (a database being down) still throw.
 */
export type AcceptInviteResult =
  | { ok: true; workspaceId: string; workspaceName: string; alreadyMember: boolean }
  | { ok: false; reason: "UNAUTHENTICATED" | "INVALID" | "EXPIRED" }

export const acceptWorkspaceInvite = async (
  token: string
): Promise<AcceptInviteResult> => {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  // Not an error: an invited teammate following the link before signing in is
  // the ordinary first-time path. The caller sends them to sign in and back.
  if (!userId) return { ok: false, reason: "UNAUTHENTICATED" };

  if (!token) return { ok: false, reason: "INVALID" };

  const invite = await db.workspaceInvite.findUnique({
    where: { token },
    select: {
      id: true,
      workspaceId: true,
      expiresAt: true,
      workspace: { select: { name: true } },
    },
  });

  if (!invite) return { ok: false, reason: "INVALID" };
  if (!invite.expiresAt || invite.expiresAt < new Date()) {
    return { ok: false, reason: "EXPIRED" };
  }

  const existing = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId: invite.workspaceId },
    },
    select: { id: true },
  });

  if (!existing) {
    await db.workspaceMember.create({
      data: {
        userId,
        workspaceId: invite.workspaceId,
        role: MEMBER_ROLE.VIEWER,
      },
    });
  }

  /**
   * The invite is deliberately NOT deleted here.
   *
   * It used to be consumed on first use, which made the link single-use - so a
   * refresh, a browser prefetch, or a second teammate opening the same link got
   * "invalid or expired" even when the join had already succeeded. An invite
   * link is a shared credential with an expiry, the way Slack and Notion treat
   * them; `expiresAt` (7 days) is what bounds it, and revoking early means
   * deleting the invite, not spending it.
   */
  return {
    ok: true,
    workspaceId: invite.workspaceId,
    workspaceName: invite.workspace.name,
    alreadyMember: Boolean(existing),
  };
};

export const getAllWorkspaceMembers = async (workspaceId: string) => {
  await assertWorkspaceMember(workspaceId);

  return await db.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });
};

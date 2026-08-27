"use server"

import db from "@/lib/db"
import { assertWorkspaceMember, requireUser } from "@/lib/authz"
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

  return `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.token}`
}

export const acceptWorkspaceInvite = async (token: string) => {
  const user = await requireUser();

  const invite = await db.workspaceInvite.findUnique({
    where: { token },
  });

  if (!invite) throw new Error("Invalid invite");

  if (!invite.expiresAt || invite.expiresAt < new Date()) throw new Error("Invite expired");

  // Re-opening an invite link must not blow up on the unique membership index,
  // and must not demote an existing member back to VIEWER.
  await db.workspaceMember.upsert({
    where: {
      userId_workspaceId: { userId: user.id, workspaceId: invite.workspaceId },
    },
    update: {},
    create: {
      userId: user.id,
      workspaceId: invite.workspaceId,
      role: MEMBER_ROLE.VIEWER,
    },
  });

  await db.workspaceInvite.delete({
    where: { id: invite.id },
  });

  return { success: true, workspaceId: invite.workspaceId };
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

"use server";

import db from "@/lib/db";
import { assertWorkspaceMember } from "@/lib/authz";
import { currentUser } from "@/modules/authentication/actions";
import { MEMBER_ROLE, Prisma } from "@prisma/client";

/** Workspaces are named after their owner, so two people's defaults differ. */
function defaultWorkspaceName(userName: string | null | undefined) {
    const first = (userName ?? "").trim().split(/\s+/)[0];
    return first ? `${first}'s Workspace` : "My Workspace";
}

export const initializeWorkspace = async () => {
    const user = await currentUser();
    if (!user) {
        return {
            success: false,
            error: "User not authenticated"
        }
    }
    try {
        /**
         * "Does this user own a workspace yet?" - not "does a workspace named
         * 'Personal Workspace' exist for them?".
         *
         * The previous version upserted on the (name, ownerId) unique with the
         * literal default name. Once a workspace can be renamed that key stops
         * matching, so the next page load would quietly create a second
         * workspace for the same person.
         */
        const existing = await db.workspace.findFirst({
            where: { ownerId: user.id },
            orderBy: { createdAt: "asc" },
            include: { members: true },
        });

        if (existing) {
            // Older rows predate the members table; make sure the owner has one.
            await db.workspaceMember.upsert({
                where: {
                    userId_workspaceId: { userId: user.id, workspaceId: existing.id },
                },
                update: {},
                create: {
                    userId: user.id,
                    workspaceId: existing.id,
                    role: MEMBER_ROLE.ADMIN,
                },
            });
            return { success: true, workspace: existing };
        }

        const workspace = await db.workspace.create({
            data: {
                name: defaultWorkspaceName(user.name),
                description: "This is your personal workspace",
                ownerId: user.id,
                members: {
                    create: {
                        userId: user.id,
                        role: MEMBER_ROLE.ADMIN
                    }
                }
            },
            include: {
                members: true
            }
        })
        return {
            success: true,
            workspace
        }
    } catch (error) {
        console.log("Error initializing workspace:", error);
        return {
            success: false,
            error: "Failed to initialize workspace"
        };
    }
}

export type WorkspaceSummary = {
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
    /** Display name of the owner, so a shared workspace can be attributed. */
    ownerName: string;
    isOwner: boolean;
    /** The caller's role. Owners are ADMIN whether or not a member row exists. */
    role: MEMBER_ROLE;
};

export async function getWorkspaces(): Promise<WorkspaceSummary[]> {
    const user = await currentUser();
    if (!user) throw new Error("User not authenticated");

    const workspaces = await db.workspace.findMany({
        where: {
            OR: [
                { ownerId: user.id },
                { members: { some: { userId: user.id } } }
            ]
        },
        orderBy: { createdAt: 'asc' },
        select: {
            id: true,
            name: true,
            description: true,
            ownerId: true,
            owner: { select: { name: true } },
            // Scoped to the caller, so this cannot reveal anybody else's role.
            members: { where: { userId: user.id }, select: { role: true } },
        },
    });

    return workspaces.map((workspace) => {
        const isOwner = workspace.ownerId === user.id;
        return {
            id: workspace.id,
            name: workspace.name,
            description: workspace.description,
            ownerId: workspace.ownerId,
            ownerName: workspace.owner?.name ?? "Unknown",
            isOwner,
            role: isOwner
                ? MEMBER_ROLE.ADMIN
                : workspace.members[0]?.role ?? MEMBER_ROLE.VIEWER,
        };
    });
}

export async function createWorkspace(name: string) {
    const user = await currentUser();
    if (!user) throw new Error("User not authenticated");

    const workspace = await db.workspace.create({
        data: {
            name,
            ownerId: user.id,
            members: {
                create: {
                    userId: user.id,
                    role: MEMBER_ROLE.ADMIN
                }
            }
        }
    })
    return workspace;
}

export type RenameWorkspaceResult =
    | { ok: true; id: string; name: string }
    | { ok: false; reason: "EMPTY" | "TOO_LONG" | "DUPLICATE" };

/**
 * Rename a workspace. Admins only - a VIEWER seeing a shared workspace must not
 * be able to relabel it for everybody else.
 */
export async function renameWorkspace(
    workspaceId: string,
    name: string
): Promise<RenameWorkspaceResult> {
    await assertWorkspaceMember(workspaceId, MEMBER_ROLE.ADMIN);

    const trimmed = name.trim();
    if (!trimmed) return { ok: false, reason: "EMPTY" };
    if (trimmed.length > 60) return { ok: false, reason: "TOO_LONG" };

    try {
        const updated = await db.workspace.update({
            where: { id: workspaceId },
            data: { name: trimmed },
            select: { id: true, name: true },
        });
        return { ok: true, ...updated };
    } catch (error) {
        // (name, ownerId) is unique: the owner already has a workspace by this
        // name. That is a message for the user, not a crash.
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            return { ok: false, reason: "DUPLICATE" };
        }
        throw error;
    }
}

export type LeaveWorkspaceResult =
    | { ok: true }
    | { ok: false; reason: "OWNER" | "NOT_A_MEMBER" };

/**
 * Leave a workspace you were invited to.
 *
 * The owner cannot leave: their membership row is not what grants them access
 * (authz treats the owner as ADMIN regardless), so removing it would strand a
 * workspace nobody can administer. Deleting the workspace is the owner's exit.
 */
export async function leaveWorkspace(
    workspaceId: string
): Promise<LeaveWorkspaceResult> {
    const { user } = await assertWorkspaceMember(workspaceId);

    const workspace = await db.workspace.findUnique({
        where: { id: workspaceId },
        select: { ownerId: true },
    });

    if (workspace?.ownerId === user.id) return { ok: false, reason: "OWNER" };

    const membership = await db.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: user.id, workspaceId } },
        select: { id: true },
    });
    if (!membership) return { ok: false, reason: "NOT_A_MEMBER" };

    await db.workspaceMember.delete({ where: { id: membership.id } });
    return { ok: true };
}

export const getWorkspaceById = async (id: string) => {
    await assertWorkspaceMember(id);

    const workspace = await db.workspace.findUnique({
        where: { id },
        include: {
            members: true
        }
    })
    return workspace;
}

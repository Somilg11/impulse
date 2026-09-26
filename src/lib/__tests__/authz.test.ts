import { beforeEach, describe, expect, it, vi } from "vitest";
import { MEMBER_ROLE } from "@prisma/client";

/**
 * Authorization tests.
 *
 * Every `"use server"` export is a publicly reachable HTTP endpoint, so these
 * assertions are the only thing standing between an id in a request body and
 * another team's data. The rest of the suite covers pure functions; this file
 * is the exception, and it earns the mocking it needs.
 *
 * Prisma and Better Auth are mocked rather than run against a test database:
 * what is under test is the decision - which role may do what, and whether the
 * resource is reached through a workspace the caller belongs to - not whether
 * Postgres returns rows.
 */

vi.mock("@/lib/db", () => ({
  default: {
    workspace: { findUnique: vi.fn() },
    collection: { findUnique: vi.fn() },
    environment: { findUnique: vi.fn() },
    request: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

import db from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  AuthzError,
  assertCollectionAccess,
  assertEnvironmentAccess,
  assertRequestAccess,
  assertWorkspaceMember,
  requireUser,
} from "@/lib/authz";

const OWNER = "user-owner";
const MEMBER = "user-member";
const OUTSIDER = "user-outsider";
const WS = "ws-1";
const OTHER_WS = "ws-2";

const mockDb = db as unknown as {
  workspace: { findUnique: ReturnType<typeof vi.fn> };
  collection: { findUnique: ReturnType<typeof vi.fn> };
  environment: { findUnique: ReturnType<typeof vi.fn> };
  request: { findUnique: ReturnType<typeof vi.fn> };
};
const getSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;

/** Sign in as `userId`, or as nobody when passed null. */
function signedInAs(userId: string | null) {
  getSession.mockResolvedValue(userId ? { user: { id: userId } } : null);
}

/**
 * A workspace owned by OWNER, with `members` standing in for the membership
 * row Prisma would return for the *current* user only (the real query filters
 * by userId, so it is either empty or a single row).
 */
function workspaceRow(members: { role: MEMBER_ROLE }[] = []) {
  return { id: WS, ownerId: OWNER, members };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireUser", () => {
  it("throws when there is no session", async () => {
    signedInAs(null);
    await expect(requireUser()).rejects.toThrow(AuthzError);
  });

  it("throws when the session carries no user id", async () => {
    getSession.mockResolvedValue({ user: {} });
    await expect(requireUser()).rejects.toThrow("Unauthorized");
  });

  it("returns the user when signed in", async () => {
    signedInAs(MEMBER);
    await expect(requireUser()).resolves.toMatchObject({ id: MEMBER });
  });
});

describe("assertWorkspaceMember", () => {
  it("rejects an anonymous caller before touching the database", async () => {
    signedInAs(null);
    await expect(assertWorkspaceMember(WS)).rejects.toThrow("Unauthorized");
    expect(mockDb.workspace.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an empty workspace id", async () => {
    signedInAs(MEMBER);
    await expect(assertWorkspaceMember("")).rejects.toThrow("Workspace not found");
  });

  it("rejects a workspace that does not exist", async () => {
    signedInAs(MEMBER);
    mockDb.workspace.findUnique.mockResolvedValue(null);
    await expect(assertWorkspaceMember(WS)).rejects.toThrow("Workspace not found");
  });

  it("rejects a signed-in user who is not a member", async () => {
    signedInAs(OUTSIDER);
    mockDb.workspace.findUnique.mockResolvedValue(workspaceRow([]));
    await expect(assertWorkspaceMember(WS)).rejects.toThrow("Forbidden");
  });

  it("treats the owner as ADMIN even with no membership row", async () => {
    signedInAs(OWNER);
    mockDb.workspace.findUnique.mockResolvedValue(workspaceRow([]));

    await expect(assertWorkspaceMember(WS, MEMBER_ROLE.ADMIN)).resolves.toMatchObject({
      workspaceId: WS,
      role: MEMBER_ROLE.ADMIN,
    });
  });

  it("returns the membership role for a member", async () => {
    signedInAs(MEMBER);
    mockDb.workspace.findUnique.mockResolvedValue(
      workspaceRow([{ role: MEMBER_ROLE.EDITOR }])
    );

    const ctx = await assertWorkspaceMember(WS);
    expect(ctx.role).toBe(MEMBER_ROLE.EDITOR);
    expect(ctx.user.id).toBe(MEMBER);
  });

  it("scopes the membership lookup to the calling user", async () => {
    signedInAs(MEMBER);
    mockDb.workspace.findUnique.mockResolvedValue(
      workspaceRow([{ role: MEMBER_ROLE.VIEWER }])
    );
    await assertWorkspaceMember(WS);

    // A lookup that forgot this filter would hand back somebody else's role.
    expect(mockDb.workspace.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: WS },
        select: expect.objectContaining({
          members: expect.objectContaining({ where: { userId: MEMBER } }),
        }),
      })
    );
  });

  describe("role ranking", () => {
    const cases: {
      role: MEMBER_ROLE;
      min: MEMBER_ROLE;
      allowed: boolean;
    }[] = [
      { role: MEMBER_ROLE.VIEWER, min: MEMBER_ROLE.VIEWER, allowed: true },
      { role: MEMBER_ROLE.VIEWER, min: MEMBER_ROLE.EDITOR, allowed: false },
      { role: MEMBER_ROLE.VIEWER, min: MEMBER_ROLE.ADMIN, allowed: false },
      { role: MEMBER_ROLE.EDITOR, min: MEMBER_ROLE.VIEWER, allowed: true },
      { role: MEMBER_ROLE.EDITOR, min: MEMBER_ROLE.EDITOR, allowed: true },
      { role: MEMBER_ROLE.EDITOR, min: MEMBER_ROLE.ADMIN, allowed: false },
      { role: MEMBER_ROLE.ADMIN, min: MEMBER_ROLE.VIEWER, allowed: true },
      { role: MEMBER_ROLE.ADMIN, min: MEMBER_ROLE.EDITOR, allowed: true },
      { role: MEMBER_ROLE.ADMIN, min: MEMBER_ROLE.ADMIN, allowed: true },
    ];

    it.each(cases)("$role against a minimum of $min -> $allowed", async ({ role, min, allowed }) => {
      signedInAs(MEMBER);
      mockDb.workspace.findUnique.mockResolvedValue(workspaceRow([{ role }]));

      const call = assertWorkspaceMember(WS, min);
      if (allowed) {
        await expect(call).resolves.toMatchObject({ role });
      } else {
        await expect(call).rejects.toThrow("Forbidden");
      }
    });
  });

  it("defaults to the lowest role when no minimum is given", async () => {
    signedInAs(MEMBER);
    mockDb.workspace.findUnique.mockResolvedValue(
      workspaceRow([{ role: MEMBER_ROLE.VIEWER }])
    );
    await expect(assertWorkspaceMember(WS)).resolves.toBeTruthy();
  });
});

describe("assertCollectionAccess", () => {
  it("rejects an empty id", async () => {
    signedInAs(MEMBER);
    await expect(assertCollectionAccess("")).rejects.toThrow("Collection not found");
    expect(mockDb.collection.findUnique).not.toHaveBeenCalled();
  });

  it("rejects a collection that does not exist", async () => {
    signedInAs(MEMBER);
    mockDb.collection.findUnique.mockResolvedValue(null);
    await expect(assertCollectionAccess("c-1")).rejects.toThrow("Collection not found");
  });

  it("refuses a collection owned by a workspace the caller is not in", async () => {
    // The IDOR case: a real collection id, guessed or leaked, belonging to
    // somebody else's workspace.
    signedInAs(OUTSIDER);
    mockDb.collection.findUnique.mockResolvedValue({ id: "c-1", workspaceId: OTHER_WS });
    mockDb.workspace.findUnique.mockResolvedValue(null);

    await expect(assertCollectionAccess("c-1")).rejects.toThrow(AuthzError);
    expect(mockDb.workspace.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: OTHER_WS } })
    );
  });

  it("carries the minimum role through to the workspace check", async () => {
    signedInAs(MEMBER);
    mockDb.collection.findUnique.mockResolvedValue({ id: "c-1", workspaceId: WS });
    mockDb.workspace.findUnique.mockResolvedValue(
      workspaceRow([{ role: MEMBER_ROLE.VIEWER }])
    );

    // A VIEWER must not be able to edit a collection they can read.
    await expect(
      assertCollectionAccess("c-1", MEMBER_ROLE.EDITOR)
    ).rejects.toThrow("Forbidden");
  });

  it("returns the collection context for a permitted caller", async () => {
    signedInAs(MEMBER);
    mockDb.collection.findUnique.mockResolvedValue({ id: "c-1", workspaceId: WS });
    mockDb.workspace.findUnique.mockResolvedValue(
      workspaceRow([{ role: MEMBER_ROLE.EDITOR }])
    );

    await expect(
      assertCollectionAccess("c-1", MEMBER_ROLE.EDITOR)
    ).resolves.toMatchObject({ collectionId: "c-1", workspaceId: WS });
  });
});

describe("assertEnvironmentAccess", () => {
  it("rejects an empty id", async () => {
    signedInAs(MEMBER);
    await expect(assertEnvironmentAccess("")).rejects.toThrow("Environment not found");
  });

  it("rejects an environment that does not exist", async () => {
    signedInAs(MEMBER);
    mockDb.environment.findUnique.mockResolvedValue(null);
    await expect(assertEnvironmentAccess("e-1")).rejects.toThrow("Environment not found");
  });

  it("refuses an environment in another workspace", async () => {
    // Environments hold secrets, so this is the worst id to get wrong.
    signedInAs(OUTSIDER);
    mockDb.environment.findUnique.mockResolvedValue({ id: "e-1", workspaceId: OTHER_WS });
    mockDb.workspace.findUnique.mockResolvedValue({
      id: OTHER_WS,
      ownerId: OWNER,
      members: [],
    });

    await expect(assertEnvironmentAccess("e-1")).rejects.toThrow("Forbidden");
  });

  it("returns the environment context for a member", async () => {
    signedInAs(MEMBER);
    mockDb.environment.findUnique.mockResolvedValue({ id: "e-1", workspaceId: WS });
    mockDb.workspace.findUnique.mockResolvedValue(
      workspaceRow([{ role: MEMBER_ROLE.EDITOR }])
    );

    await expect(assertEnvironmentAccess("e-1")).resolves.toMatchObject({
      environmentId: "e-1",
      workspaceId: WS,
    });
  });
});

describe("assertRequestAccess", () => {
  it("rejects an empty id", async () => {
    signedInAs(MEMBER);
    await expect(assertRequestAccess("")).rejects.toThrow("Request not found");
  });

  it("rejects a request that does not exist", async () => {
    signedInAs(MEMBER);
    mockDb.request.findUnique.mockResolvedValue(null);
    await expect(assertRequestAccess("r-1")).rejects.toThrow("Request not found");
  });

  it("resolves the workspace through the parent collection", async () => {
    // A request has no workspaceId of its own; reaching it through the
    // collection is what keeps the check honest.
    signedInAs(MEMBER);
    mockDb.request.findUnique.mockResolvedValue({
      id: "r-1",
      collection: { id: "c-1", workspaceId: WS },
    });
    mockDb.workspace.findUnique.mockResolvedValue(
      workspaceRow([{ role: MEMBER_ROLE.EDITOR }])
    );

    await expect(assertRequestAccess("r-1", MEMBER_ROLE.EDITOR)).resolves.toMatchObject({
      requestId: "r-1",
      collectionId: "c-1",
      workspaceId: WS,
    });
  });

  it("refuses a request whose collection lives in another workspace", async () => {
    signedInAs(OUTSIDER);
    mockDb.request.findUnique.mockResolvedValue({
      id: "r-1",
      collection: { id: "c-1", workspaceId: OTHER_WS },
    });
    mockDb.workspace.findUnique.mockResolvedValue({
      id: OTHER_WS,
      ownerId: OWNER,
      members: [],
    });

    await expect(assertRequestAccess("r-1")).rejects.toThrow("Forbidden");
  });

  it("refuses a VIEWER asked to satisfy an EDITOR minimum", async () => {
    signedInAs(MEMBER);
    mockDb.request.findUnique.mockResolvedValue({
      id: "r-1",
      collection: { id: "c-1", workspaceId: WS },
    });
    mockDb.workspace.findUnique.mockResolvedValue(
      workspaceRow([{ role: MEMBER_ROLE.VIEWER }])
    );

    await expect(assertRequestAccess("r-1", MEMBER_ROLE.EDITOR)).rejects.toThrow("Forbidden");
  });
});

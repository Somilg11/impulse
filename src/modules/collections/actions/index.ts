"use server";

import db from "@/lib/db";
import { assertCollectionAccess, assertWorkspaceMember } from "@/lib/authz";
import { MEMBER_ROLE, REST_METHOD } from "@prisma/client";
import {
    exportFilename,
    serializeCollection,
    type ExportFormat,
    type ExportableCollection,
} from "@/lib/postman";

export const createCollection = async (
    workspaceId: string,
    name: string,
    parentId?: string | null
) => {
    await assertWorkspaceMember(workspaceId, MEMBER_ROLE.EDITOR);

    // A folder must live in the same workspace as its parent, otherwise a
    // caller could graft a folder onto another team's tree.
    if (parentId) {
        const parent = await assertCollectionAccess(parentId, MEMBER_ROLE.EDITOR);
        if (parent.workspaceId !== workspaceId) {
            throw new Error("Parent collection belongs to a different workspace");
        }
    }

    return await db.collection.create({
        data: {
            name,
            workspaceId,
            parentId: parentId ?? null,
        },
    });
};

export const getCollections = async (workspaceId: string) => {
    await assertWorkspaceMember(workspaceId);

    // Flat list; the client assembles the tree from parentId. One query beats a
    // recursive include of unknown depth.
    return await db.collection.findMany({
        where: { workspaceId },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });
};

/**
 * Re-parent a folder.
 *
 * Refuses to move a collection into its own subtree - that would detach the
 * whole branch from the workspace and leave rows only reachable by id.
 */
export const moveCollection = async (
    collectionId: string,
    parentId: string | null
) => {
    const { workspaceId } = await assertCollectionAccess(collectionId, MEMBER_ROLE.EDITOR);

    if (parentId) {
        if (parentId === collectionId) throw new Error("A folder cannot contain itself");

        const target = await assertCollectionAccess(parentId, MEMBER_ROLE.EDITOR);
        if (target.workspaceId !== workspaceId) {
            throw new Error("Cannot move a collection between workspaces");
        }

        // Walk up from the destination; if we meet the moving node, it is a cycle.
        let cursor: string | null = parentId;
        const seen = new Set<string>();
        while (cursor) {
            if (cursor === collectionId) {
                throw new Error("Cannot move a folder into its own subtree");
            }
            if (seen.has(cursor)) break; // defensive: pre-existing cycle
            seen.add(cursor);

            const node: { parentId: string | null } | null = await db.collection.findUnique({
                where: { id: cursor },
                select: { parentId: true },
            });
            cursor = node?.parentId ?? null;
        }
    }

    return await db.collection.update({
        where: { id: collectionId },
        data: { parentId },
    });
};

export const deleteCollection = async (collectionId: string) => {
    await assertCollectionAccess(collectionId, MEMBER_ROLE.EDITOR);
    await db.collection.delete({ where: { id: collectionId } });
};

export const editCollection = async (collectionId: string, name: string) => {
    await assertCollectionAccess(collectionId, MEMBER_ROLE.EDITOR);
    await db.collection.update({ where: { id: collectionId }, data: { name } });
};

const SUPPORTED_METHODS = new Set<string>(Object.values(REST_METHOD));

/** Postman stores headers as [{key, value, disabled}]; the editor uses the same
 * shape, so imports keep that shape rather than converting to an object map. */
type ImportedKeyValue = { key: string; value: string; enabled: boolean };

/** Loose shapes for imported JSON, which is untrusted and only partly known. */
type RawObject = Record<string, unknown>;

type RawRequest = {
    method?: string;
    url?: unknown;
    header?: unknown;
    body?: { raw?: string } | null;
};

type RawItem = {
    name?: string;
    request?: RawRequest;
    item?: unknown;
    url?: unknown;
    method?: string;
    headers?: unknown;
    parameters?: unknown;
    body?: string | null;
};

type RawCollection = {
    name?: string;
    info?: { name?: string };
    item?: unknown;
    requests?: unknown;
};

function normalizeKeyValues(input: unknown): ImportedKeyValue[] {
    if (Array.isArray(input)) {
        return (input as unknown[])
            .filter((entry): entry is RawObject => typeof entry === "object" && entry !== null)
            .map((entry) => ({
                key: String(entry.key ?? ""),
                value: String(entry.value ?? ""),
                enabled: entry.disabled === true ? false : entry.enabled !== false,
            }))
            .filter((entry) => entry.key.trim().length > 0);
    }

    if (input && typeof input === "object") {
        return Object.entries(input as Record<string, unknown>).map(([key, value]) => ({
            key,
            value: value === null || value === undefined ? "" : String(value),
            enabled: true,
        }));
    }

    return [];
}

function extractUrl(url: unknown): string {
    if (typeof url === "string") return url;
    if (url && typeof url === "object") {
        const raw = (url as { raw?: unknown }).raw;
        if (typeof raw === "string") return raw;
    }
    return "";
}

/** Postman v2.1 puts query params on url.query; the editor keeps them separate. */
function extractQuery(url: unknown): ImportedKeyValue[] {
    if (url && typeof url === "object") {
        const query = (url as { query?: unknown }).query;
        if (Array.isArray(query)) return normalizeKeyValues(query);
    }
    return [];
}

export const importCollections = async (workspaceId: string, data: unknown) => {
    try {
        await assertWorkspaceMember(workspaceId, MEMBER_ROLE.EDITOR);

        const payload = (data ?? {}) as RawCollection & { collections?: unknown };
        const collections: unknown =
            payload.collections ?? (payload.info && payload.item ? [payload] : []);

        if (!Array.isArray(collections) || collections.length === 0) {
            throw new Error("No collections found in the provided data.");
        }

        for (const raw of collections) {
            const colData = raw as RawCollection;
            const collection = await db.collection.create({
                data: {
                    name: await uniqueSiblingName(
                        workspaceId,
                        null,
                        colData.name || colData.info?.name || "Imported Collection"
                    ),
                    workspaceId,
                },
            });

            const items = colData.item ?? colData.requests ?? [];
            await processItems(collection.id, items, workspaceId);
        }

        return { success: true };
    } catch (error) {
        console.error("Import error:", error);
        return { success: false, error: (error as Error).message };
    }
};

/**
 * Postman items are either requests or folders. Folders now become real child
 * collections rather than being flattened with a name prefix, which is what the
 * schema's self-relation was added for.
 */
async function processItems(
    collectionId: string,
    items: unknown,
    workspaceId: string,
    depth = 0
) {
    if (!Array.isArray(items)) return;

    // Guard against a malicious or malformed export nesting without end.
    const MAX_DEPTH = 12;

    let position = 0;

    for (const raw of items) {
        const item = raw as RawItem;

        if (item?.request) {
            const req = item.request;
            const rawMethod = String(req.method ?? "GET").toUpperCase();
            const method = SUPPORTED_METHODS.has(rawMethod)
                ? (rawMethod as REST_METHOD)
                : REST_METHOD.GET;

            await db.request.create({
                data: {
                    collectionId,
                    name: item.name || "Untitled Request",
                    method,
                    url: extractUrl(req.url),
                    headers: JSON.stringify(normalizeKeyValues(req.header)),
                    parameters: JSON.stringify(extractQuery(req.url)),
                    body: req.body?.raw ?? undefined,
                    position: position++,
                },
            });
        } else if (Array.isArray(item?.item)) {
            if (depth >= MAX_DEPTH) {
                // Too deep to keep nesting - fall back to flattening the rest
                // into the current folder rather than dropping it.
                await processItems(collectionId, item.item, workspaceId, depth);
                continue;
            }

            const folder = await db.collection.create({
                data: {
                    name: await uniqueSiblingName(
                        workspaceId,
                        collectionId,
                        item.name || "Folder"
                    ),
                    workspaceId,
                    parentId: collectionId,
                    position: position++,
                },
            });
            await processItems(folder.id, item.item, workspaceId, depth + 1);
        } else if (item?.url && item?.method) {
            const rawMethod = String(item.method).toUpperCase();
            const method = SUPPORTED_METHODS.has(rawMethod)
                ? (rawMethod as REST_METHOD)
                : REST_METHOD.GET;

            await db.request.create({
                data: {
                    collectionId,
                    name: item.name || "Untitled Request",
                    method,
                    url: extractUrl(item.url),
                    headers: JSON.stringify(normalizeKeyValues(item.headers)),
                    parameters: JSON.stringify(normalizeKeyValues(item.parameters)),
                    body: item.body ?? undefined,
                    position: position++,
                },
            });
        }
    }
}

/** Sibling names carry a unique index, so collisions get a numeric suffix. */
async function uniqueSiblingName(
    workspaceId: string,
    parentId: string | null,
    desired: string
): Promise<string> {
    const siblings = await db.collection.findMany({
        where: { workspaceId, parentId },
        select: { name: true },
    });
    const taken = new Set(siblings.map((s) => s.name));

    if (!taken.has(desired)) return desired;
    let n = 2;
    while (taken.has(`${desired} ${n}`)) n++;
    return `${desired} ${n}`;
}

/**
 * Serialize a collection and everything under it for download.
 *
 * The tree is walked level by level rather than with a fixed Prisma `include`
 * depth, so a folder hierarchy of any depth exports completely.
 */
export const exportCollection = async (
    collectionId: string,
    format: ExportFormat = "postman"
): Promise<{ filename: string; content: string }> => {
    await assertCollectionAccess(collectionId);

    const root = await db.collection.findUnique({
        where: { id: collectionId },
        select: { id: true, name: true },
    });
    if (!root) throw new Error("Collection not found");

    const build = async (id: string, name: string): Promise<ExportableCollection> => {
        const [requests, children] = await Promise.all([
            db.request.findMany({
                where: { collectionId: id },
                orderBy: [{ position: "asc" }, { createdAt: "asc" }],
                select: {
                    name: true,
                    method: true,
                    url: true,
                    headers: true,
                    parameters: true,
                    body: true,
                    bodyType: true,
                    auth: true,
                },
            }),
            db.collection.findMany({
                where: { parentId: id },
                orderBy: [{ position: "asc" }, { createdAt: "asc" }],
                select: { id: true, name: true },
            }),
        ]);

        return {
            name,
            requests,
            children: await Promise.all(children.map((c) => build(c.id, c.name))),
        };
    };

    const tree = await build(root.id, root.name);

    return {
        filename: exportFilename(root.name, format),
        content: serializeCollection(tree, format),
    };
};

/** Export every root collection in a workspace, one document each. */
export const exportWorkspace = async (
    workspaceId: string,
    format: ExportFormat = "postman"
): Promise<{ filename: string; content: string }[]> => {
    await assertWorkspaceMember(workspaceId);

    const roots = await db.collection.findMany({
        where: { workspaceId, parentId: null },
        select: { id: true },
        orderBy: { createdAt: "asc" },
    });

    return await Promise.all(roots.map((c) => exportCollection(c.id, format)));
};

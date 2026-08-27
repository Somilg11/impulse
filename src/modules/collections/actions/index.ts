"use server";

import db from "@/lib/db";
import { assertCollectionAccess, assertWorkspaceMember } from "@/lib/authz";
import { MEMBER_ROLE, REST_METHOD } from "@prisma/client";

export const createCollection = async (workspaceId: string, name: string) => {
    await assertWorkspaceMember(workspaceId, MEMBER_ROLE.EDITOR);

    return await db.collection.create({
        data: {
            name,
            workspace: { connect: { id: workspaceId } },
        },
    });
};

export const getCollections = async (workspaceId: string) => {
    await assertWorkspaceMember(workspaceId);

    return await db.collection.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "asc" },
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
                    name: colData.name || colData.info?.name || "Imported Collection",
                    workspaceId,
                },
            });

            const items = colData.item ?? colData.requests ?? [];
            await processItems(collection.id, items);
        }

        return { success: true };
    } catch (error) {
        console.error("Import error:", error);
        return { success: false, error: (error as Error).message };
    }
};

/**
 * Postman items are either requests or folders. The schema has no nested folder
 * model, so folders are flattened into the parent collection and their name is
 * prefixed onto each request so the grouping is not lost entirely.
 */
async function processItems(collectionId: string, items: unknown, prefix = "") {
    if (!Array.isArray(items)) return;

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
                    name: prefix + (item.name || "Untitled Request"),
                    method,
                    url: extractUrl(req.url),
                    headers: JSON.stringify(normalizeKeyValues(req.header)),
                    parameters: JSON.stringify(extractQuery(req.url)),
                    body: req.body?.raw ?? undefined,
                },
            });
        } else if (Array.isArray(item?.item)) {
            const folderName = item.name ? `${prefix}${item.name} / ` : prefix;
            await processItems(collectionId, item.item, folderName);
        } else if (item?.url && item?.method) {
            const rawMethod = String(item.method).toUpperCase();
            const method = SUPPORTED_METHODS.has(rawMethod)
                ? (rawMethod as REST_METHOD)
                : REST_METHOD.GET;

            await db.request.create({
                data: {
                    collectionId,
                    name: prefix + (item.name || "Untitled Request"),
                    method,
                    url: extractUrl(item.url),
                    headers: JSON.stringify(normalizeKeyValues(item.headers)),
                    parameters: JSON.stringify(normalizeKeyValues(item.parameters)),
                    body: item.body ?? undefined,
                },
            });
        }
    }
}

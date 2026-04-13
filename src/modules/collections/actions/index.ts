"use server";

import db from "@/lib/db";

export const createCollection = async (workspaceId: string, name: string) => {
    const collection = await db.collection.create({
        data: {
            name,
            workspace: {
                connect: {
                    id: workspaceId,
                },
            },
        },
    });

    return collection;
};

export const getCollections = async (workspaceId: string) => {
    const collections = await db.collection.findMany({
        where: {
            workspaceId,
        },
    });

    return collections;
};


export const deleteCollection = async (collectionId: string) => {
    await db.collection.delete({
        where: {
            id: collectionId,
        },
    });
};

export const editCollection = async (collectionId: string, name: string) => {
    await db.collection.update({
        where: {
            id: collectionId,
        },
        data: {
            name,
        },
    });
};

export const importCollections = async (workspaceId: string, data: any) => {
    try {
        // Detect format
        const collections = data.collections || (data.info && data.item ? [data] : []);

        if (collections.length === 0) {
            throw new Error("No collections found in the provided data.");
        }

        for (const colData of collections) {
            // Create collection
            const collection = await db.collection.create({
                data: {
                    name: colData.name || colData.info?.name || "Imported Collection",
                    workspaceId,
                },
            });

            // Parse items (Postman uses .item, Impulse might use .requests)
            const items = colData.item || colData.requests || [];
            await processItems(collection.id, items);
        }

        return { success: true };
    } catch (error) {
        console.error("Import error:", error);
        return { success: false, error: (error as Error).message };
    }
};

// Helper to recursively process items (Postman items can be folders or requests)
async function processItems(collectionId: string, items: any[]) {
    for (const item of items) {
        if (item.request) {
            // It's a request
            const req = item.request;
            const method = (req.method || 'GET').toUpperCase();
            
            // Map Postman headers to JSON string
            const headers = Array.isArray(req.header) 
                ? JSON.stringify(req.header.reduce((acc: any, h: any) => ({ ...acc, [h.key]: h.value }), {}))
                : typeof req.header === 'object' ? JSON.stringify(req.header) : "{}";

            await db.request.create({
                data: {
                    collectionId,
                    name: item.name || "Untitled Request",
                    method: method as any,
                    url: typeof req.url === 'string' ? req.url : (req.url?.raw || ""),
                    headers: headers,
                    body: req.body?.raw || null,
                    parameters: "{}", // Default
                }
            });
        } else if (item.item && Array.isArray(item.item)) {
            // It's a folder in Postman, for now we flatten or just process its contents into the same collection
            // since Impulse currently doesn't have a nested folder model in DB (only Collections -> Requests)
            await processItems(collectionId, item.item);
        } else if (item.url && item.method) {
            // Simple Impulse format
            await db.request.create({
                data: {
                    collectionId,
                    name: item.name || "Untitled Request",
                    method: item.method as any,
                    url: item.url,
                    headers: typeof item.headers === 'string' ? item.headers : JSON.stringify(item.headers || {}),
                    body: item.body || null,
                    parameters: typeof item.parameters === 'string' ? item.parameters : JSON.stringify(item.parameters || {}),
                }
            });
        }
    }
}
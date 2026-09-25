import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createCollection, getCollections, deleteCollection, editCollection, exportCollection, exportWorkspace, moveCollection } from "../actions";
import type { ExportFormat } from "@/lib/postman";

export function useCollections(workspaceId?: string) {
    return useQuery({
        queryKey: ['collections', workspaceId],
        queryFn: async () => await getCollections(workspaceId!),
        enabled: !!workspaceId,
    });
}

export function useCreateCollection(
    workspaceId: string,
    name: string,
    parentId?: string | null
) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => createCollection(workspaceId, name, parentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collections', workspaceId] });
        },
    });
}

export function useDeleteCollection(collectionId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => deleteCollection(collectionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collections'] });
        },
    });
}

export function useEditCollection(collectionId: string, name: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => editCollection(collectionId, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collections'] });
        },
    });
}

/**
 * Downloads a collection as a file.
 *
 * Serialization happens on the server (it needs the whole folder tree), and the
 * browser only turns the returned string into a download.
 */
export function useExportCollection(collectionId: string, collectionName: string) {
    return useCallback(
        async (format: ExportFormat) => {
            try {
                const { filename, content } = await exportCollection(collectionId, format);

                const blob = new Blob([content], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = filename;
                document.body.appendChild(anchor);
                anchor.click();
                anchor.remove();
                URL.revokeObjectURL(url);

                toast.success(`Exported "${collectionName}"`);
            } catch (error) {
                toast.error(
                    error instanceof Error ? error.message : "Could not export collection"
                );
            }
        },
        [collectionId, collectionName]
    );
}

/** Re-parents a folder. Refused server-side if the move would create a cycle. */
export function useMoveCollection(workspaceId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: { collectionId: string; parentId: string | null }) =>
            moveCollection(input.collectionId, input.parentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["collections", workspaceId] });
        },
    });
}

/**
 * Downloads every root collection in the workspace, one file each.
 *
 * Browsers throttle rapid successive downloads, so they are spaced out; without
 * the gap only the first two or three files actually save.
 */
export function useExportWorkspace(workspaceId?: string) {
    return useCallback(
        async (format: ExportFormat) => {
            if (!workspaceId) return;
            try {
                const files = await exportWorkspace(workspaceId, format);
                if (!files.length) {
                    toast.info("No collections to export");
                    return;
                }

                for (const [index, file] of files.entries()) {
                    await new Promise((resolve) => setTimeout(resolve, index === 0 ? 0 : 300));
                    const blob = new Blob([file.content], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const anchor = document.createElement("a");
                    anchor.href = url;
                    anchor.download = file.filename;
                    document.body.appendChild(anchor);
                    anchor.click();
                    anchor.remove();
                    URL.revokeObjectURL(url);
                }

                toast.success(
                    `Exported ${files.length} collection${files.length === 1 ? "" : "s"}`
                );
            } catch (error) {
                toast.error(
                    error instanceof Error ? error.message : "Could not export the workspace"
                );
            }
        },
        [workspaceId]
    );
}

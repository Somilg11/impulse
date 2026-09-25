import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createCollection, getCollections, deleteCollection, editCollection, exportCollection } from "../actions";
import type { ExportFormat } from "@/lib/postman";

export function useCollections(workspaceId?: string) {
    return useQuery({
        queryKey: ['collections', workspaceId],
        queryFn: async () => await getCollections(workspaceId!),
        enabled: !!workspaceId,
    });
}

export function useCreateCollection(workspaceId: string, name: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => createCollection(workspaceId, name),
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

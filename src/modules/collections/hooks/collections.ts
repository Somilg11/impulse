import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCollection, getCollections, deleteCollection, editCollection } from "../actions";

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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createWorkspace,
    getWorkspaces,
    getWorkspaceById,
    leaveWorkspace,
    renameWorkspace,
} from "../actions";

export function useWorkspaces() {
    return useQuery({
        queryKey: ['workspaces'],
        queryFn: async () => getWorkspaces(),
    });
}

export function useCreateWorkspace() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (name: string) => createWorkspace(name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        },
    });
}

export function useRenameWorkspace() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, name }: { id: string; name: string }) =>
            renameWorkspace(id, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        },
    });
}

export function useLeaveWorkspace() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => leaveWorkspace(id),
        onSuccess: () => {
            // The workspace is gone from this user's list, and everything
            // scoped to it - collections, environments - goes with it.
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
            queryClient.invalidateQueries({ queryKey: ['collections'] });
            queryClient.invalidateQueries({ queryKey: ['environments'] });
        },
    });
}

export function useGetWorkspace(id: string) {
    return useQuery({
        queryKey: ['workspace', id],
        queryFn: async () => getWorkspaceById(id),
    });
}

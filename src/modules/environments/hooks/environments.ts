"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createEnvironment,
  deleteEnvironment,
  duplicateEnvironment,
  getEnvironments,
  updateEnvironment,
} from "../actions";
import type { Variable } from "@/lib/variables";

const key = (workspaceId?: string) => ["environments", workspaceId];

export function useEnvironments(workspaceId?: string) {
  return useQuery({
    queryKey: key(workspaceId),
    queryFn: async () => getEnvironments(workspaceId!),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateEnvironment(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => createEnvironment(workspaceId, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(workspaceId) }),
  });
}

export function useUpdateEnvironment(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      variables?: Variable[];
    }) => updateEnvironment(input.id, { name: input.name, variables: input.variables }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(workspaceId) }),
  });
}

export function useDeleteEnvironment(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => deleteEnvironment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(workspaceId) }),
  });
}

export function useDuplicateEnvironment(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => duplicateEnvironment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(workspaceId) }),
  });
}

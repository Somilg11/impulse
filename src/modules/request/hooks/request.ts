"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addRequestToCollection,
  getAllRequestFromCollection,
  getRequestRuns,
  recordRun,
  Request,
  saveRequest,
} from "../actions";
import { sendRequest } from "../lib/send-request";
import { useActiveVariables } from "@/modules/environments/hooks/use-active-variables";
import {
  useRequestPlaygroundStore,
  type RequestTab,
} from "../store/useRequestStore";

export function useAddRequestToCollection(collectionId: string) {
  const queryClient = useQueryClient();
  const updateTabFromSavedRequest = useRequestPlaygroundStore(
    (s) => s.updateTabFromSavedRequest
  );

  return useMutation({
    mutationFn: async (value: Request) =>
      addRequestToCollection(collectionId, value),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["requests", collectionId] });
      const { activeTabId } = useRequestPlaygroundStore.getState();
      if (activeTabId) updateTabFromSavedRequest(activeTabId, data);
    },
  });
}

export function useGetAllRequestFromCollection(collectionId: string) {
  return useQuery({
    queryKey: ["requests", collectionId],
    queryFn: async () => getAllRequestFromCollection(collectionId),
    enabled: Boolean(collectionId),
  });
}

export function useSaveRequest(id: string) {
  const queryClient = useQueryClient();
  const updateTabFromSavedRequest = useRequestPlaygroundStore(
    (s) => s.updateTabFromSavedRequest
  );

  return useMutation({
    mutationFn: async (value: Request) => saveRequest(id, value),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      const { activeTabId } = useRequestPlaygroundStore.getState();
      if (activeTabId) updateTabFromSavedRequest(activeTabId, data);
    },
  });
}

/**
 * Sends the request currently in a tab.
 *
 * Execution happens on the client (browser mode) or through /api/proxy, never
 * through a server action, so unsaved tabs work too. The run is only persisted
 * when the tab is backed by a saved request, and a failure to persist never
 * fails the send.
 */
export function useSendRequest() {
  const queryClient = useQueryClient();
  const setResponseViewerData = useRequestPlaygroundStore(
    (s) => s.setResponseViewerData
  );
  const { variables } = useActiveVariables();

  return useMutation({
    mutationFn: async (tab: RequestTab) => {
      const { sendMode } = useRequestPlaygroundStore.getState();

      const { result, missingVariables } = await sendRequest(
        {
          method: tab.method,
          url: tab.url,
          headers: tab.headers,
          parameters: tab.parameters,
          body: tab.body,
          bodyType: tab.bodyType,
          auth: tab.auth,
        },
        variables,
        sendMode
      );

      if (tab.requestId) {
        try {
          await recordRun(tab.requestId, result);
        } catch (error) {
          console.error("Failed to record run history:", error);
        }
      }

      return { tab, result, missingVariables };
    },
    onSuccess: ({ tab, result }) => {
      setResponseViewerData(result, tab.id);
      if (tab.requestId) {
        queryClient.invalidateQueries({
          queryKey: ["request-runs", tab.requestId],
        });
      }
    },
  });
}

export function useRequestRuns(requestId?: string) {
  return useQuery({
    queryKey: ["request-runs", requestId],
    queryFn: async () => getRequestRuns(requestId!),
    enabled: Boolean(requestId),
  });
}

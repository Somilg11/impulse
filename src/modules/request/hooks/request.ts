"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  addRequestToCollection,
  deleteRequest,
  getAllRequestFromCollection,
  getRequestRuns,
  recordRun,
  Request,
  saveRequest,
} from "../actions";
import { sendRequest } from "../lib/send-request";
import { parseAssertions, runAssertions } from "@/lib/assertions";
import { useActiveVariables } from "@/modules/environments/hooks/use-active-variables";
import {
  useRequestPlaygroundStore,
  type RequestTab,
} from "../store/useRequestStore";

/**
 * Saves a request into a collection.
 *
 * `linkTabId` is the tab this save came from, and it must be passed explicitly.
 * Previously the hook linked whatever tab happened to be active, so using
 * "Add request" from a collection's own menu silently re-pointed the tab you
 * were working in at the new, empty request - the tab kept your URL and body on
 * screen while its `requestId` now addressed a different row.
 */
export function useAddRequestToCollection(
  collectionId: string,
  linkTabId?: string | null
) {
  const queryClient = useQueryClient();
  const updateTabFromSavedRequest = useRequestPlaygroundStore(
    (s) => s.updateTabFromSavedRequest
  );

  return useMutation({
    mutationFn: async (value: Request) =>
      addRequestToCollection(collectionId, value),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["requests", collectionId] });
      if (linkTabId) updateTabFromSavedRequest(linkTabId, data);
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
  const setTestResults = useRequestPlaygroundStore((s) => s.setTestResults);

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

      // Assertions run against the real response, so they are evaluated here
      // rather than in the component - one send, one evaluation.
      const assertions = parseAssertions(tab.tests);
      const testResults = assertions.length ? runAssertions(assertions, result) : [];

      if (tab.requestId) {
        try {
          await recordRun(tab.requestId, result, testResults.length ? testResults : undefined);
        } catch (error) {
          // The send itself succeeded, so this must not throw - but it must be
          // visible, or History silently stays empty forever.
          console.error("Failed to record run history:", error);
          toast.warning("Could not save this run to history", {
            description:
              error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return { tab, result, missingVariables, testResults };
    },
    onSuccess: ({ tab, result, testResults }) => {
      setResponseViewerData(result, tab.id);
      setTestResults(tab.id, testResults);
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

/**
 * Removes a saved request, and closes its tab if one is open - leaving a tab
 * pointed at a row that no longer exists would fail on the next send with a
 * confusing "not found".
 */
export function useDeleteRequest(collectionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => deleteRequest(requestId),
    onSuccess: (_data, requestId) => {
      const { tabs, closeTab } = useRequestPlaygroundStore.getState();
      const open = tabs.find((t) => t.requestId === requestId);
      if (open) closeTab(open.id);

      queryClient.invalidateQueries({ queryKey: ["requests", collectionId] });
    },
  });
}

"use client";

import { useRequestPlaygroundStore } from "../store/useRequestStore";
import RequestBar from "./request-bar";
import RequestEditorArea from "./request-editor-area";
import ResponseViewer from "./response-viewer";
import type { HistoryRun } from "./run-history";
import type { ExecResult } from "@/lib/http";
import type { AssertionResult } from "@/lib/assertions";

/** Turns a stored run back into the shape the response pane renders. */
function runToResult(run: HistoryRun): ExecResult {
  const headers =
    run.headers && typeof run.headers === "object"
      ? (run.headers as Record<string, string>)
      : {};

  const body = typeof run.body === "string" ? run.body : run.body ? String(run.body) : "";

  return {
    ok: run.status >= 200 && run.status < 300,
    status: run.status,
    statusText: run.statusText ?? "",
    headers,
    body,
    contentType: headers["content-type"] ?? "",
    durationMs: run.durationMs,
    size: run.size ?? 0,
    via: run.via === "proxy" ? "proxy" : "browser",
  };
}

export default function RequestEditor() {
  const { tabs, activeTabId, updateTab, responseViewerData, testResultsByTabId } =
    useRequestPlaygroundStore();
  const setResponseViewerData = useRequestPlaygroundStore(
    (s) => s.setResponseViewerData
  );
  const setTestResults = useRequestPlaygroundStore((s) => s.setTestResults);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  if (!activeTab) return null;

  const handleReplayRun = (run: HistoryRun) => {
    setResponseViewerData(runToResult(run), activeTab.id);
    setTestResults(
      activeTab.id,
      Array.isArray(run.testResults) ? (run.testResults as unknown as AssertionResult[]) : []
    );
  };

  return (
    <div className="flex flex-col items-stretch py-3 px-3 md:py-4 md:px-4 gap-3 md:gap-4">
      <RequestBar tab={activeTab} updateTab={updateTab} />

      <RequestEditorArea tab={activeTab} updateTab={updateTab} />

      {/* Rendered even before a send so History stays reachable. */}
      {(responseViewerData || activeTab.requestId) && (
        <ResponseViewer
          responseData={
            responseViewerData ?? {
              ok: false,
              status: 0,
              statusText: "",
              headers: {},
              body: "",
              contentType: "",
              durationMs: 0,
              size: 0,
              via: "browser",
            }
          }
          requestId={activeTab.requestId}
          testResults={testResultsByTabId[activeTab.id] ?? []}
          onReplayRun={handleReplayRun}
        />
      )}
    </div>
  );
}

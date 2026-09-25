"use client";

import { Send } from "lucide-react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
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

/** Shown in the response pane before anything has been sent. */
const AwaitingResponse = () => (
  <div className="flex h-full flex-col items-center justify-center gap-3 bg-canvas px-6 text-center">
    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface-raised">
      <Send className="h-4 w-4 text-zinc-600" strokeWidth={1.75} />
    </div>
    <div>
      <p className="text-sm text-zinc-400">No response yet</p>
      <p className="mt-1 text-xs text-zinc-600">
        Press{" "}
        <kbd className="rounded border border-line bg-surface-raised px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
          Enter
        </kbd>{" "}
        in the URL bar, or click Send.
      </p>
    </div>
  </div>
);

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

  // The response pane stays available for saved requests even before a send, so
  // History is reachable without re-running the request first.
  const showResponse = Boolean(responseViewerData || activeTab.requestId);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* URL bar stays fixed: it is the control you reach for most. */}
      <div className="shrink-0 border-b border-line bg-surface px-3 py-2.5">
        <RequestBar tab={activeTab} updateTab={updateTab} />
      </div>

      {/* Request configuration above, response below, with a draggable divider -
          the layout every API client converges on, because you read the response
          while editing the request. */}
      <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
        <ResizablePanel defaultSize={45} minSize={15} className="flex">
          <div className="min-h-0 flex-1 overflow-auto">
            <RequestEditorArea tab={activeTab} updateTab={updateTab} />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={55} minSize={15} className="flex">
          <div className="min-h-0 flex-1 overflow-auto">
            {showResponse ? (
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
            ) : (
              <AwaitingResponse />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

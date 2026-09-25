"use client";

import React, { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Editor from "@/components/monaco-editor";
import {
  Clock,
  HardDrive,
  AlertTriangle,
  Copy,
  Download,
  Code,
  FileText,
  Settings,
  Globe,
  Server,
  History,
  TestTube,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { ExecResult } from "@/lib/http";
import { summarize, type AssertionResult } from "@/lib/assertions";
import {
  formatBytes,
  formatDuration,
  statusLabel,
  statusText as statusColorClass,
} from "@/lib/http-display";
import RunHistory, { type HistoryRun } from "./run-history";

interface Props {
  responseData: ExecResult;
  /** Saved-request id, if any - drives the History tab. */
  requestId?: string;
  testResults?: AssertionResult[];
  onReplayRun?: (run: HistoryRun) => void;
}

const MONACO_OPTIONS = {
  readOnly: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  fontSize: 14,
  wordWrap: "on" as const,
  fontFamily:
    'ui-monospace, SFMono-Regular, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  lineNumbers: "on" as const,
  glyphMargin: false,
  folding: true,
  lineDecorationsWidth: 0,
  lineNumbersMinChars: 3,
  renderLineHighlight: "none" as const,
  scrollbar: {
    vertical: "auto" as const,
    horizontal: "auto" as const,
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8,
  },
};

/** Guess a sensible filename extension from the response content type. */
function extensionFor(contentType: string): string {
  if (contentType.includes("json")) return "json";
  if (contentType.includes("html")) return "html";
  if (contentType.includes("xml")) return "xml";
  if (contentType.includes("csv")) return "csv";
  return "txt";
}

const ResponseViewer = ({
  responseData,
  requestId,
  testResults = [],
  onReplayRun,
}: Props) => {
  const [activeTab, setActiveTab] = useState("json");
  const testSummary = summarize(testResults);

  const { status, statusText, durationMs, size, headers, body, contentType, via, error } =
    responseData;

  // The body is always raw text; pretty-print it only when it parses as JSON.
  const { prettyBody, isJson } = useMemo(() => {
    const raw = body ?? "";
    if (!raw.trim()) return { prettyBody: "", isJson: false };
    try {
      return { prettyBody: JSON.stringify(JSON.parse(raw), null, 2), isJson: true };
    } catch {
      return { prettyBody: raw, isJson: false };
    }
  }, [body]);

  const copyToClipboard = (text: string) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Copied"))
      .catch(() => toast.error("Could not copy"));
  };

  const downloadBody = () => {
    if (!body) {
      toast.error("No response body to save");
      return;
    }
    const blob = new Blob([body], { type: contentType || "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `response.${extensionFor(contentType)}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const headerEntries = Object.entries(headers ?? {});

  return (
    <div className="w-full bg-canvas text-white">
      <div className="w-full mx-auto">
        {/* Status bar - the summary a developer reads first, so it leads with the
            status code at display size rather than as one label among many. */}
        <div className="flex flex-col gap-2 border-b border-line bg-surface px-3 py-2 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-mono text-lg font-bold leading-none ${statusColorClass(status)}`}
                  >
                    {status || "—"}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {statusText || statusLabel(status)}
                  </span>
                </div>

                <span className="h-4 w-px bg-line" aria-hidden />

                <div className="flex items-center gap-1.5" title="Elapsed time">
                  <Clock className="h-3.5 w-3.5 text-zinc-600" />
                  <span className="font-mono text-xs text-zinc-300">
                    {formatDuration(durationMs)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5" title="Response size">
                  <HardDrive className="h-3.5 w-3.5 text-zinc-600" />
                  <span className="font-mono text-xs text-zinc-300">
                    {formatBytes(size)}
                  </span>
                </div>

                <div
                  className="flex items-center gap-1.5"
                  title={
                    via === "browser"
                      ? "Sent from your browser - can reach localhost"
                      : "Sent through the server proxy - ignores CORS"
                  }
                >
                  {via === "browser" ? (
                    <Globe className="h-3.5 w-3.5 text-zinc-600" />
                  ) : (
                    <Server className="h-3.5 w-3.5 text-zinc-600" />
                  )}
                  <span className="text-xs capitalize text-zinc-500">{via}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                  onClick={downloadBody}
                  disabled={!body}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                  onClick={() => copyToClipboard(prettyBody)}
                  disabled={!body}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 border-b border-status-server-error/20 bg-status-server-error/5 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-server-error" />
            <p className="text-xs leading-relaxed text-red-300">{error}</p>
          </div>
        )}

        {/* Body */}
        <Card className="bg-surface-raised border-line">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-3 md:px-4 border-b border-line">
                <TabsList className="bg-transparent p-0 h-auto">
                  <TabsTrigger
                    value="json"
                    className="bg-transparent data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-gray-400 rounded-t-md rounded-b-none border-b-2 border-transparent data-[state=active]:border-blue-500 px-4 py-2"
                  >
                    <Code className="w-4 h-4 mr-2" />
                    {isJson ? "JSON" : "Pretty"}
                  </TabsTrigger>
                  <TabsTrigger
                    value="raw"
                    className="bg-transparent data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-gray-400 rounded-t-md rounded-b-none border-b-2 border-transparent data-[state=active]:border-blue-500 px-4 py-2"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Raw
                  </TabsTrigger>
                  <TabsTrigger
                    value="headers"
                    className="bg-transparent data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-gray-400 rounded-t-md rounded-b-none border-b-2 border-transparent data-[state=active]:border-blue-500 px-4 py-2"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Headers
                    <Badge variant="secondary" className="ml-2 text-xs bg-zinc-700">
                      {headerEntries.length}
                    </Badge>
                  </TabsTrigger>
                  {testResults.length > 0 && (
                    <TabsTrigger
                      value="tests"
                      className="bg-transparent data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-gray-400 rounded-t-md rounded-b-none border-b-2 border-transparent data-[state=active]:border-blue-500 px-4 py-2"
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      Tests
                      <Badge
                        variant="secondary"
                        className={`ml-2 text-xs border-0 ${
                          testSummary.failed
                            ? "bg-red-500/15 text-red-400"
                            : "bg-green-500/15 text-green-400"
                        }`}
                      >
                        {testSummary.passed}/{testSummary.total}
                      </Badge>
                    </TabsTrigger>
                  )}
                  <TabsTrigger
                    value="history"
                    className="bg-transparent data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-gray-400 rounded-t-md rounded-b-none border-b-2 border-transparent data-[state=active]:border-blue-500 px-4 py-2"
                  >
                    <History className="w-4 h-4 mr-2" />
                    History
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="json" className="mt-0">
                <div className="h-96">
                  <Editor
                    height="100%"
                    language={isJson ? "json" : "plaintext"}
                    value={prettyBody}
                    options={MONACO_OPTIONS}
                    theme="vs-dark"
                  />
                </div>
              </TabsContent>

              <TabsContent value="raw" className="mt-0">
                <div className="h-96">
                  <Editor
                    height="100%"
                    language="plaintext"
                    value={body ?? ""}
                    options={MONACO_OPTIONS}
                    theme="vs-dark"
                  />
                </div>
              </TabsContent>

              <TabsContent value="tests" className="mt-0">
                <ScrollArea className="h-96">
                  <div className="p-4 space-y-2">
                    {testResults.map((result) => (
                      <div
                        key={result.id}
                        className={`flex items-start gap-3 rounded-lg border p-3 ${
                          result.passed
                            ? "border-green-500/20 bg-green-500/5"
                            : "border-red-500/20 bg-red-500/5"
                        }`}
                      >
                        {result.passed ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                        ) : (
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-zinc-200">{result.label}</p>
                          <p className="mt-0.5 text-xs text-zinc-500 break-all">
                            actual: <span className="font-mono">{result.actual}</span>
                          </p>
                          {result.error && (
                            <p className="mt-0.5 text-xs text-amber-400/90">{result.error}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <RunHistory requestId={requestId} onSelect={onReplayRun} />
              </TabsContent>

              <TabsContent value="headers" className="mt-0">
                <ScrollArea className="h-96">
                  <div className="p-6">
                    {headerEntries.length === 0 ? (
                      <p className="text-sm text-zinc-500">
                        No headers exposed.{" "}
                        {via === "browser" &&
                          "Cross-origin responses only expose safelisted headers unless the API sets Access-Control-Expose-Headers. Proxy mode shows all of them."}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {headerEntries.map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-start justify-between py-2 border-b border-zinc-800 last:border-b-0"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-blue-300 text-sm">{key}</div>
                              <div className="text-gray-300 text-sm break-all">
                                {String(value)}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-gray-400 hover:text-white ml-2"
                              onClick={() => copyToClipboard(`${key}: ${value}`)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResponseViewer;

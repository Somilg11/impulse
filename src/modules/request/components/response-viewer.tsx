"use client";

import React, { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Editor from "@monaco-editor/react";
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
} from "lucide-react";
import { toast } from "sonner";
import type { ExecResult } from "@/lib/http";

interface Props {
  responseData: ExecResult;
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

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return "text-green-400";
  if (status >= 300 && status < 400) return "text-yellow-400";
  if (status >= 400 && status < 500) return "text-orange-400";
  if (status >= 500) return "text-red-400";
  return "text-gray-400";
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/** Guess a sensible filename extension from the response content type. */
function extensionFor(contentType: string): string {
  if (contentType.includes("json")) return "json";
  if (contentType.includes("html")) return "html";
  if (contentType.includes("xml")) return "xml";
  if (contentType.includes("csv")) return "csv";
  return "txt";
}

const ResponseViewer = ({ responseData }: Props) => {
  const [activeTab, setActiveTab] = useState("json");

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
    <div className="w-full bg-[#0e1117] text-white p-3 md:p-4">
      <div className="w-full mx-auto">
        {/* Status header */}
        <Card className="bg-[#161b26] border-[#1e2330] mb-4">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Status:</span>
                  <Badge className={`${getStatusColor(status)} bg-transparent border-current`}>
                    {status || "—"} {statusText ? `• ${statusText}` : ""}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Time:</span>
                  <span className="text-blue-300">{durationMs} ms</span>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Size:</span>
                  <span className="text-green-300">{formatBytes(size)}</span>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-[#1e2330] text-zinc-400 border-0 gap-1.5"
                  title={
                    via === "browser"
                      ? "Sent from your browser"
                      : "Sent from the server proxy"
                  }
                >
                  {via === "browser" ? (
                    <Globe className="w-3 h-3" />
                  ) : (
                    <Server className="w-3 h-3" />
                  )}
                  {via}
                </Badge>
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
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <p className="text-xs leading-relaxed text-red-300">{error}</p>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Body */}
        <Card className="bg-[#161b26] border-[#1e2330]">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-3 md:px-4 border-b border-[#1e2330]">
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

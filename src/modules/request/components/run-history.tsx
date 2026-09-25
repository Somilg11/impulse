"use client";

import { formatDistanceToNow } from "date-fns";
import { Globe, Server, Clock, HardDrive, CheckCircle2, XCircle } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { AssertionResult } from "@/lib/assertions";
import { useRequestRuns } from "../hooks/request";

interface Props {
  requestId?: string;
  /** Replays a past run into the response pane. */
  onSelect?: (run: HistoryRun) => void;
}

export type HistoryRun = {
  id: string;
  status: number;
  statusText: string | null;
  headers: unknown;
  body: unknown;
  durationMs: number;
  size: number | null;
  via: string | null;
  testResults: unknown;
  createdAt: Date | string;
};

function statusColor(status: number): string {
  if (status >= 200 && status < 300) return "text-green-400";
  if (status >= 300 && status < 400) return "text-yellow-400";
  if (status >= 400 && status < 500) return "text-orange-400";
  if (status >= 500) return "text-red-400";
  return "text-zinc-500";
}

function formatBytes(bytes?: number | null): string {
  if (!bytes) return "—";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Past runs of a saved request.
 *
 * These rows were already being written on every send; until now nothing
 * rendered them. Unsaved tabs have no history because there is no row to attach
 * runs to.
 */
const RunHistory = ({ requestId, onSelect }: Props) => {
  const { data: runs, isLoading } = useRequestRuns(requestId);

  if (!requestId) {
    return (
      <div className="p-6 text-center">
        <p className="text-xs text-zinc-500">
          Save this request to a collection to start recording history.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-6 text-center text-xs text-zinc-500">Loading history…</div>;
  }

  if (!runs?.length) {
    return (
      <div className="p-6 text-center">
        <p className="text-xs text-zinc-500">No runs recorded yet.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-96">
      <div className="divide-y divide-[#1e2330]">
        {runs.map((run) => {
          const results = Array.isArray(run.testResults)
            ? (run.testResults as unknown as AssertionResult[])
            : [];
          const failed = results.filter((r) => !r.passed).length;

          return (
            <button
              key={run.id}
              onClick={() => onSelect?.(run as HistoryRun)}
              className="w-full text-left px-4 py-3 hover:bg-[#1e2330]/40 transition-colors flex items-center gap-3"
            >
              <span className={`text-sm font-bold w-10 shrink-0 ${statusColor(run.status)}`}>
                {run.status || "—"}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {run.durationMs} ms
                  </span>
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    {formatBytes(run.size)}
                  </span>
                  {run.via && (
                    <span className="flex items-center gap-1">
                      {run.via === "browser" ? (
                        <Globe className="w-3 h-3" />
                      ) : (
                        <Server className="w-3 h-3" />
                      )}
                      {run.via}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-zinc-600 mt-0.5">
                  {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
                </div>
              </div>

              {results.length > 0 && (
                <Badge
                  variant="secondary"
                  className={`shrink-0 gap-1 border-0 text-[10px] ${
                    failed
                      ? "bg-red-500/10 text-red-400"
                      : "bg-green-500/10 text-green-400"
                  }`}
                >
                  {failed ? (
                    <XCircle className="w-3 h-3" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                  {results.length - failed}/{results.length}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default RunHistory;

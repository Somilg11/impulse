"use client";

import { useCallback, useRef, useState } from "react";
import { CheckCircle2, XCircle, Loader2, Play, Square, Clock } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { parseAssertions, runAssertions, summarize } from "@/lib/assertions";
import type { AssertionResult } from "@/lib/assertions";
import type { BodyType } from "@/lib/body-types";
import { getRunnableRequests, recordRun } from "../actions";
import { sendRequest } from "../lib/send-request";
import { useRequestPlaygroundStore } from "../store/useRequestStore";
import { useActiveVariables } from "@/modules/environments/hooks/use-active-variables";

interface Props {
  collectionId: string;
  collectionName: string;
  isOpen: boolean;
  onClose: () => void;
}

type RunRow = {
  id: string;
  label: string;
  method: string;
  status?: number;
  durationMs?: number;
  error?: string;
  results?: AssertionResult[];
  state: "pending" | "running" | "done";
};

/**
 * Runs every request in a collection in sequence.
 *
 * Sequential rather than parallel on purpose: requests in a collection often
 * depend on each other's side effects (create, then fetch, then delete), and
 * firing them at once would make results non-deterministic. It also keeps the
 * target API from being hit with a burst.
 */
const CollectionRunner = ({ collectionId, collectionName, isOpen, onClose }: Props) => {
  const [rows, setRows] = useState<RunRow[]>([]);
  const [running, setRunning] = useState(false);
  // A ref, not state: the loop needs to observe a Stop press between iterations,
  // and reading state inside a setter would be a side effect React may run twice.
  const cancelRef = useRef(false);
  const { variables, activeEnvironmentName } = useActiveVariables();

  const run = useCallback(async () => {
    setRunning(true);
    cancelRef.current = false;

    let requests: Awaited<ReturnType<typeof getRunnableRequests>>;
    try {
      requests = await getRunnableRequests(collectionId);
    } catch {
      setRunning(false);
      return;
    }

    if (!requests.length) {
      setRows([]);
      setRunning(false);
      return;
    }

    setRows(
      requests.map((r) => ({
        id: r.id,
        label: r.label,
        method: r.method,
        state: "pending" as const,
      }))
    );

    const { sendMode } = useRequestPlaygroundStore.getState();

    for (const request of requests) {
      if (cancelRef.current) break;

      setRows((current) =>
        current.map((row) =>
          row.id === request.id ? { ...row, state: "running" } : row
        )
      );

      const { result } = await sendRequest(
        {
          method: request.method,
          url: request.url,
          headers: request.headers,
          parameters: request.parameters,
          body: request.body,
          bodyType: request.bodyType as BodyType,
          auth: request.auth,
        },
        variables,
        sendMode
      );

      const assertions = parseAssertions(request.tests);
      const results = assertions.length ? runAssertions(assertions, result) : [];

      try {
        await recordRun(request.id, result, results.length ? results : undefined);
      } catch {
        // History is best-effort; a failed write must not stop the run.
      }

      setRows((current) =>
        current.map((row) =>
          row.id === request.id
            ? {
                ...row,
                state: "done",
                status: result.status,
                durationMs: result.durationMs,
                error: result.error,
                results,
              }
            : row
        )
      );
    }

    setRunning(false);
  }, [collectionId, variables]);

  const completed = rows.filter((r) => r.state === "done");
  const allResults = completed.flatMap((r) => r.results ?? []);
  const totals = summarize(allResults);
  const failedRequests = completed.filter(
    (r) => r.error || (r.status ?? 0) >= 400 || (r.results ?? []).some((x) => !x.passed)
  ).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !running && onClose()}>
      <DialogContent className="bg-canvas border-line text-zinc-200 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Run &ldquo;{collectionName}&rdquo;</DialogTitle>
          <DialogDescription className="text-zinc-500 text-xs">
            Requests run one after another, in collection order.{" "}
            {activeEnvironmentName
              ? `Using the "${activeEnvironmentName}" environment.`
              : "No environment selected."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={run}
            disabled={running}
            className="h-8 bg-brand hover:bg-brand-hover text-xs"
          >
            {running ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 mr-1.5" />
            )}
            {running ? "Running…" : rows.length ? "Run again" : "Run collection"}
          </Button>

          {running && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                cancelRef.current = true;
              }}
              className="h-8 text-xs text-zinc-400 hover:text-zinc-200"
            >
              <Square className="h-3 w-3 mr-1.5" /> Stop
            </Button>
          )}

          {completed.length > 0 && (
            <div className="ml-auto flex items-center gap-2 text-xs">
              <Badge
                variant="secondary"
                className={`border-0 ${
                  failedRequests
                    ? "bg-red-500/10 text-red-400"
                    : "bg-green-500/10 text-green-400"
                }`}
              >
                {completed.length - failedRequests}/{completed.length} requests
              </Badge>
              {totals.total > 0 && (
                <Badge
                  variant="secondary"
                  className={`border-0 ${
                    totals.failed
                      ? "bg-red-500/10 text-red-400"
                      : "bg-green-500/10 text-green-400"
                  }`}
                >
                  {totals.passed}/{totals.total} assertions
                </Badge>
              )}
            </div>
          )}
        </div>

        <ScrollArea className="h-[340px] border border-line rounded-lg">
          {rows.length === 0 ? (
            <div className="h-[330px] flex items-center justify-center">
              <p className="text-xs text-zinc-600">
                Press Run to execute every request in this collection.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {rows.map((row) => {
                const failed =
                  row.error ||
                  (row.status ?? 0) >= 400 ||
                  (row.results ?? []).some((r) => !r.passed);

                return (
                  <div key={row.id} className="px-3 py-2.5 flex items-center gap-3">
                    <span className="w-5 shrink-0">
                      {row.state === "running" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
                      ) : row.state === "pending" ? (
                        <Clock className="h-3.5 w-3.5 text-zinc-700" />
                      ) : failed ? (
                        <XCircle className="h-3.5 w-3.5 text-red-400" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                      )}
                    </span>

                    <span className="text-[10px] font-bold text-zinc-500 w-12 shrink-0">
                      {row.method}
                    </span>

                    <span className="flex-1 min-w-0 truncate text-xs text-zinc-300">
                      {row.label}
                    </span>

                    {row.state === "done" && (
                      <span className="shrink-0 flex items-center gap-2 text-[11px] text-zinc-500">
                        {row.results && row.results.length > 0 && (
                          <span
                            className={
                              row.results.some((r) => !r.passed)
                                ? "text-red-400"
                                : "text-green-400"
                            }
                          >
                            {row.results.filter((r) => r.passed).length}/
                            {row.results.length}
                          </span>
                        )}
                        <span>{row.durationMs} ms</span>
                        <span className={failed ? "text-red-400" : "text-green-400"}>
                          {row.error ? "ERR" : row.status}
                        </span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CollectionRunner;

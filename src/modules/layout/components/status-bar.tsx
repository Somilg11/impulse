"use client";

import { Clock, Globe, HardDrive, Layers, Server, Zap } from "lucide-react";

import { formatBytes, formatDuration, statusText } from "@/lib/http-display";
import { useActiveVariables } from "@/modules/environments/hooks/use-active-variables";
import { useRequestPlaygroundStore } from "@/modules/request/store/useRequestStore";

/**
 * Persistent footer showing the state that silently changes what a request does.
 *
 * The execution mode and the active environment both alter the request that goes
 * out, and both were previously only visible if you went looking - the mode
 * under the URL bar, the environment in a header dropdown. A request failing
 * because the wrong environment is selected is a confusing failure, so the
 * answer stays on screen.
 */
const StatusBar = () => {
  const sendMode = useRequestPlaygroundStore((s) => s.sendMode);
  const response = useRequestPlaygroundStore((s) => s.responseViewerData);
  const { activeEnvironmentName, variables } = useActiveVariables();

  const variableCount = Object.keys(variables).length;

  return (
    <footer className="flex h-6 shrink-0 items-center gap-3 border-t border-line bg-surface px-3 text-[11px] text-zinc-500 select-none">
      {/* Active environment */}
      <span
        className="flex items-center gap-1.5"
        title={
          activeEnvironmentName
            ? `${variableCount} variable${variableCount === 1 ? "" : "s"} available`
            : "No environment selected - {{variables}} will not resolve"
        }
      >
        <Layers className="h-3 w-3" />
        {activeEnvironmentName ? (
          <>
            <span className="text-zinc-300">{activeEnvironmentName}</span>
            <span className="text-zinc-600">({variableCount})</span>
          </>
        ) : (
          <span>No environment</span>
        )}
      </span>

      <span className="h-3 w-px bg-line" aria-hidden />

      {/* Execution mode */}
      <span
        className="flex items-center gap-1.5"
        title={
          sendMode === "browser"
            ? "Requests are sent from your browser"
            : sendMode === "proxy"
              ? "Requests are sent through the server proxy"
              : "Browser first, falling back to the proxy"
        }
      >
        {sendMode === "proxy" ? (
          <Server className="h-3 w-3" />
        ) : sendMode === "browser" ? (
          <Globe className="h-3 w-3" />
        ) : (
          <Zap className="h-3 w-3" />
        )}
        <span className="capitalize text-zinc-300">{sendMode}</span>
      </span>

      {/* Last response, once there is one */}
      {response && (
        <>
          <span className="ml-auto flex items-center gap-3">
            <span className={`font-mono font-semibold ${statusText(response.status)}`}>
              {response.status || "ERR"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="font-mono">{formatDuration(response.durationMs)}</span>
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              <span className="font-mono">{formatBytes(response.size)}</span>
            </span>
          </span>
        </>
      )}
    </footer>
  );
};

export default StatusBar;

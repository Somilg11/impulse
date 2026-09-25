"use client";

import { useState } from "react";
import { Check, Layers, Plus, Settings2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspaceStore } from "@/modules/layout/store";
import { useEnvironments } from "../hooks/environments";
import { useEnvironmentStore } from "../store";
import EnvironmentManager from "./environment-manager";

/**
 * Picks which environment supplies `{{variables}}` for outgoing requests.
 * "No environment" is a valid choice - placeholders are then left verbatim.
 */
const EnvironmentSelector = () => {
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspace?.id);
  const { data: environments, isLoading } = useEnvironments(workspaceId);
  const activeByWorkspace = useEnvironmentStore((s) => s.activeByWorkspace);
  const setActiveEnvironment = useEnvironmentStore((s) => s.setActiveEnvironment);

  const [managerOpen, setManagerOpen] = useState(false);

  const activeId = workspaceId ? activeByWorkspace[workspaceId] ?? null : null;
  const active = environments?.find((e) => e.id === activeId) ?? null;

  if (!workspaceId) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 h-8 px-2.5 rounded-lg border border-line bg-surface-raised text-[12px] text-zinc-300 hover:bg-line transition-colors duration-[--duration-fast] ease-[--ease-ios] max-w-[190px]"
            title="Active environment"
          >
            <Layers className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            <span className="truncate">
              {isLoading ? "Loading…" : active?.name ?? "No environment"}
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-60 rounded-xl border-line bg-surface-raised text-zinc-300"
        >
          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-zinc-500">
            Environment
          </DropdownMenuLabel>

          <DropdownMenuItem
            onClick={() => setActiveEnvironment(workspaceId, null)}
            className="text-[12px] focus:bg-line cursor-pointer"
          >
            <span className="flex-1">No environment</span>
            {!activeId && <Check className="h-3.5 w-3.5 text-brand" />}
          </DropdownMenuItem>

          {environments?.length ? <DropdownMenuSeparator className="bg-line" /> : null}

          {environments?.map((environment) => (
            <DropdownMenuItem
              key={environment.id}
              onClick={() => setActiveEnvironment(workspaceId, environment.id)}
              className="text-[12px] focus:bg-line cursor-pointer"
            >
              <span className="flex-1 truncate">{environment.name}</span>
              {activeId === environment.id && (
                <Check className="h-3.5 w-3.5 text-brand" />
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator className="bg-line" />

          <DropdownMenuItem
            onClick={() => setManagerOpen(true)}
            className="text-[12px] focus:bg-line cursor-pointer"
          >
            {environments?.length ? (
              <>
                <Settings2 className="h-3.5 w-3.5 mr-2 text-zinc-500" />
                Manage environments
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5 mr-2 text-zinc-500" />
                Create an environment
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EnvironmentManager
        workspaceId={workspaceId}
        isOpen={managerOpen}
        onClose={() => setManagerOpen(false)}
      />
    </>
  );
};

export default EnvironmentSelector;

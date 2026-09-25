"use client";

import { useMemo } from "react";

import { useWorkspaceStore } from "@/modules/layout/store";
import { toVariableMap, type VariableMap } from "@/lib/variables";
import { useEnvironments } from "./environments";
import { useEnvironmentStore } from "../store";

/**
 * The variable map for the workspace's currently selected environment.
 *
 * Returns an empty map when no environment is selected, which means `{{name}}`
 * placeholders are left in the request verbatim rather than silently blanked.
 */
export function useActiveVariables(): {
  variables: VariableMap;
  activeEnvironmentId: string | null;
  activeEnvironmentName: string | null;
} {
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspace?.id);
  const activeByWorkspace = useEnvironmentStore((s) => s.activeByWorkspace);
  const { data: environments } = useEnvironments(workspaceId);

  const activeEnvironmentId = workspaceId
    ? activeByWorkspace[workspaceId] ?? null
    : null;

  return useMemo(() => {
    const active = environments?.find((e) => e.id === activeEnvironmentId);
    return {
      variables: active ? toVariableMap(active.variables) : {},
      activeEnvironmentId: active?.id ?? null,
      activeEnvironmentName: active?.name ?? null,
    };
  }, [environments, activeEnvironmentId]);
}

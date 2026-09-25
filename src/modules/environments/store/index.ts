"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Which environment is active, per workspace.
 *
 * This is a per-user UI preference, not shared state, so it lives in the browser
 * rather than the database - two teammates can work against different
 * environments on the same workspace at the same time.
 */

type EnvironmentState = {
  /** workspaceId -> environmentId */
  activeByWorkspace: Record<string, string | null>;
  setActiveEnvironment: (workspaceId: string, environmentId: string | null) => void;
  getActiveEnvironment: (workspaceId?: string) => string | null;
};

/**
 * localStorage throws in private windows and when site data is blocked, so every
 * access is guarded. Losing the selection is acceptable; crashing is not.
 */
const safeStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      /* ignore */
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
}));

export const useEnvironmentStore = create<EnvironmentState>()(
  persist(
    (set, get) => ({
      activeByWorkspace: {},

      setActiveEnvironment: (workspaceId, environmentId) =>
        set((state) => ({
          activeByWorkspace: {
            ...state.activeByWorkspace,
            [workspaceId]: environmentId,
          },
        })),

      getActiveEnvironment: (workspaceId) =>
        workspaceId ? get().activeByWorkspace[workspaceId] ?? null : null,
    }),
    {
      name: "impulse.active-environment",
      storage: safeStorage,
    }
  )
);

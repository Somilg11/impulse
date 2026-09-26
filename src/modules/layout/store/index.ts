import { create } from "zustand";
import type { MEMBER_ROLE } from "@prisma/client";

/**
 * Mirrors `WorkspaceSummary` from the workspace actions. The owner fields are
 * carried so the UI can attribute a shared workspace without a second query -
 * two people's default workspaces can easily share a name.
 */
export type Workspace = {
  id: string;
  name: string;
  ownerId?: string;
  ownerName?: string;
  isOwner?: boolean;
  role?: MEMBER_ROLE;
};

interface WorkspaceState {
  selectedWorkspace: Workspace | null;
  setSelectedWorkspace: (workspace: Workspace | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  selectedWorkspace: null,
  setSelectedWorkspace: (workspace) =>
    set(() => ({ selectedWorkspace: workspace })),
}));

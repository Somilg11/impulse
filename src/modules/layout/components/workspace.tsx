"use client";

import { Button } from "@/components/ui/button";
import { Check, Loader, LogOut, MoreHorizontal, Pencil, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import CreateWorkspace from "./create-workspace";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  useLeaveWorkspace,
  useRenameWorkspace,
  useWorkspaces,
} from "@/modules/workspace/hooks/workspace";
import { useWorkspaceStore } from "../store";
import type { WorkspaceSummary } from "@/modules/workspace/actions";

/**
 * Workspace switcher.
 *
 * Attribution is the point of most of this: every account starts with a
 * workspace named after its owner, but names are only unique per owner, so two
 * of them can collide in one person's list. A workspace you did not create is
 * labelled with whose it is, and the trigger disambiguates only when it has to
 * - adding "owned by X" to every row would be noise in the common case where
 * you have one workspace.
 */
const WorkSpace = () => {
  const { data: workspaces, isLoading } = useWorkspaces();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  const { selectedWorkspace, setSelectedWorkspace } = useWorkspaceStore();
  const rename = useRenameWorkspace();
  const leave = useLeaveWorkspace();

  useEffect(() => {
    if (!workspaces || workspaces.length === 0) return;

    const stillExists =
      selectedWorkspace &&
      workspaces.some((w) => w.id === selectedWorkspace.id);

    // Also re-seats the selection after a rename or a leave, so the trigger
    // never shows a stale name or a workspace this user is no longer in.
    if (!stillExists) {
      setSelectedWorkspace(workspaces[0]);
      return;
    }

    const fresh = workspaces.find((w) => w.id === selectedWorkspace!.id);
    if (fresh && fresh.name !== selectedWorkspace!.name) {
      setSelectedWorkspace(fresh);
    }
  }, [workspaces, selectedWorkspace, setSelectedWorkspace]);

  /** Names that appear more than once, which the trigger must disambiguate. */
  const duplicateNames = useMemo(() => {
    const counts = new Map<string, number>();
    for (const w of workspaces ?? []) {
      counts.set(w.name, (counts.get(w.name) ?? 0) + 1);
    }
    return new Set(
      [...counts.entries()].filter(([, n]) => n > 1).map(([name]) => name)
    );
  }, [workspaces]);

  const startRename = (workspace: WorkspaceSummary) => {
    setRenamingId(workspace.id);
    setDraftName(workspace.name);
    // Focus after the row swaps to an input.
    setTimeout(() => renameInputRef.current?.select(), 0);
  };

  const commitRename = async (workspace: WorkspaceSummary) => {
    const name = draftName.trim();
    setRenamingId(null);
    if (!name || name === workspace.name) return;

    const result = await rename.mutateAsync({ id: workspace.id, name });
    if (result.ok) {
      toast.success(`Renamed to "${result.name}"`);
      return;
    }
    toast.error(
      result.reason === "DUPLICATE"
        ? "You already have a workspace with that name"
        : result.reason === "TOO_LONG"
          ? "That name is too long"
          : "A workspace needs a name"
    );
  };

  const onLeave = async (workspace: WorkspaceSummary) => {
    const result = await leave.mutateAsync(workspace.id);
    if (result.ok) {
      toast.success(`Left "${workspace.name}"`);
      return;
    }
    toast.error(
      result.reason === "OWNER"
        ? "You own this workspace, so you cannot leave it"
        : "You are not a member of that workspace"
    );
  };

  if (isLoading) {
    return <Loader className="animate-spin size-3.5 text-zinc-400" />;
  }

  if (!workspaces || workspaces.length === 0) {
    return <div className="text-[12px] text-zinc-500">No workspace</div>;
  }

  const active =
    workspaces.find((w) => w.id === selectedWorkspace?.id) ?? workspaces[0];

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button className="flex h-7 w-auto min-w-0 flex-row items-center gap-1.5 rounded-lg border border-line bg-surface-raised px-3 text-zinc-300 transition-colors duration-[--duration-fast] ease-[--ease-ios] hover:bg-surface-hover">
            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-brand text-[9px] font-bold text-white">
              {active.name.charAt(0).toUpperCase()}
            </div>
            <span className="max-w-[160px] truncate text-[12px] font-medium">
              {active.name}
            </span>
            {/* Only when the bare name would be ambiguous. */}
            {!active.isOwner && duplicateNames.has(active.name) && (
              <span className="max-w-[90px] truncate text-[11px] text-zinc-500">
                · {active.ownerName}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="center" className="w-[280px]">
          {workspaces.map((workspace) => {
            const isRenaming = renamingId === workspace.id;

            if (isRenaming) {
              return (
                <div key={workspace.id} className="px-1.5 py-1">
                  <Input
                    ref={renameInputRef}
                    value={draftName}
                    autoFocus
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitRename(workspace);
                      }
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    onBlur={() => commitRename(workspace)}
                    className="h-7 text-[12px]"
                  />
                </div>
              );
            }

            return (
              <div
                key={workspace.id}
                className="group flex items-center gap-1 rounded-[6px] px-1 hover:bg-surface-hover"
              >
                <button
                  onClick={() => {
                    setSelectedWorkspace(workspace);
                    setMenuOpen(false);
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2 px-1.5 py-1.5 text-left"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[12.5px] text-zinc-200">
                      {workspace.name}
                    </span>
                    {/* Whose workspace this is, when it is not yours. */}
                    {!workspace.isOwner && (
                      <span className="truncate text-[10.5px] text-zinc-500">
                        owned by {workspace.ownerName}
                      </span>
                    )}
                  </div>
                  {workspace.id === active.id && (
                    <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-brand" />
                  )}
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label={`Actions for ${workspace.name}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-500 opacity-0 transition-opacity hover:bg-white/[0.06] hover:text-zinc-200 focus:opacity-100 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[180px]">
                    <DropdownMenuItem
                      className="gap-2"
                      // Only an admin may relabel a workspace others share.
                      disabled={workspace.role !== "ADMIN"}
                      onSelect={(e) => {
                        e.preventDefault();
                        startRename(workspace);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      className="gap-2"
                      // The owner's exit is deleting the workspace, not leaving
                      // it: authz grants them access regardless of the row.
                      disabled={workspace.isOwner}
                      onSelect={() => onLeave(workspace)}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Leave workspace
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}

          <DropdownMenuSeparator />
          <div className="flex flex-row items-center justify-between px-2 py-1">
            <span className="text-[10px] uppercase tracking-[0.08em] text-zinc-500">
              Workspaces
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 rounded hover:bg-line"
              onClick={() => {
                setMenuOpen(false);
                setIsModalOpen(true);
              }}
            >
              <Plus size={12} className="text-zinc-400" />
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspace isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
    </>
  );
};

export default WorkSpace;

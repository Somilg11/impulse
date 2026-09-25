"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useHotkeys } from "react-hotkeys-hook";
import { BookOpen, FilePlus, FolderPlus, Layers, Search, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { methodBadge } from "@/lib/http-display";
import { useWorkspaceStore } from "@/modules/layout/store";
import { useWorkspaceRequests } from "@/modules/request/hooks/request";
import { useRequestPlaygroundStore } from "@/modules/request/store/useRequestStore";
import { useEnvironments } from "@/modules/environments/hooks/environments";
import { useEnvironmentStore } from "@/modules/environments/store";
import { useUiStore } from "@/modules/layout/store/ui";

/**
 * Command palette.
 *
 * Previously this listed four hardcoded rows whose only behaviour was closing
 * the dialog - it searched nothing and navigated nowhere. It now searches every
 * request in the workspace across collections, switches environments, and runs
 * the handful of actions that are otherwise several clicks deep.
 */
const SearchBar = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspace?.id);
  const { data: requests } = useWorkspaceRequests(open ? workspaceId : undefined);
  const { data: environments } = useEnvironments(open ? workspaceId : undefined);

  const openRequestTab = useRequestPlaygroundStore((s) => s.openRequestTab);
  const addTab = useRequestPlaygroundStore((s) => s.addTab);
  const setActiveEnvironment = useEnvironmentStore((s) => s.setActiveEnvironment);
  const setImportOpen = useUiStore((s) => s.setImportOpen);
  const setCreateCollectionOpen = useUiStore((s) => s.setCreateCollectionOpen);
  const setEnvironmentsOpen = useUiStore((s) => s.setEnvironmentsOpen);
  const activeByWorkspace = useEnvironmentStore((s) => s.activeByWorkspace);

  const activeEnvironmentId = workspaceId ? activeByWorkspace[workspaceId] ?? null : null;

  useHotkeys(
    "meta+k, ctrl+k",
    (e) => {
      e.preventDefault();
      setOpen((prev) => !prev);
    },
    { enableOnFormTags: true }
  );

  /** Every item closes the palette; doing it here keeps each handler to its job. */
  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex flex-1 cursor-text items-center justify-between self-stretch overflow-hidden rounded-lg border border-line bg-surface-raised px-3 py-1.5 text-zinc-400 transition-colors duration-[--duration-fast] ease-[--ease-ios] hover:bg-surface-hover hover:text-zinc-200"
      >
        <span className="inline-flex flex-1 items-center">
          <Search size={13} className="mr-2 text-zinc-600" />
          <span className="pr-2 text-left text-[12px]">Search requests</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded border border-line bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-zinc-500">
            ⌘
          </kbd>
          <kbd className="rounded border border-line bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-zinc-500">
            K
          </kbd>
        </span>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Find a request, switch environment, or run an action"
      >
        <CommandInput placeholder="Search requests, environments, actions…" />

        <CommandList className="max-h-[360px]">
          <CommandEmpty className="py-8 text-center text-[13px] text-zinc-500">
            Nothing matches.
          </CommandEmpty>

          {requests && requests.length > 0 && (
            <CommandGroup heading="Requests">
              {requests.map((request) => (
                <CommandItem
                  key={request.id}
                  // Included so typing a method or folder name finds the request.
                  value={`${request.name} ${request.method} ${request.collectionPath} ${request.url}`}
                  onSelect={() => run(() => openRequestTab(request))}
                  className="gap-2.5"
                >
                  <span
                    className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-bold ${methodBadge(request.method)}`}
                  >
                    {request.method}
                  </span>
                  <span className="truncate text-[13px] text-zinc-200">{request.name}</span>
                  {request.collectionPath && (
                    <span className="ml-auto shrink-0 truncate pl-3 text-[11px] text-zinc-600">
                      {request.collectionPath}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {environments && environments.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Environments">
                {environments.map((environment) => (
                  <CommandItem
                    key={environment.id}
                    value={`environment ${environment.name}`}
                    onSelect={() =>
                      run(() => {
                        if (!workspaceId) return;
                        setActiveEnvironment(workspaceId, environment.id);
                        toast.success(`Switched to "${environment.name}"`);
                      })
                    }
                    className="gap-2.5"
                  >
                    <Layers className="h-3.5 w-3.5 text-zinc-600" />
                    <span className="text-[13px]">{environment.name}</span>
                    {activeEnvironmentId === environment.id && (
                      <span className="ml-auto text-[11px] text-brand">Active</span>
                    )}
                  </CommandItem>
                ))}
                {activeEnvironmentId && (
                  <CommandItem
                    value="environment none clear"
                    onSelect={() =>
                      run(() => workspaceId && setActiveEnvironment(workspaceId, null))
                    }
                    className="gap-2.5"
                  >
                    <Layers className="h-3.5 w-3.5 text-zinc-600" />
                    <span className="text-[13px]">No environment</span>
                  </CommandItem>
                )}
              </CommandGroup>
            </>
          )}

          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem value="new request tab" onSelect={() => run(addTab)} className="gap-2.5">
              <FilePlus className="h-3.5 w-3.5 text-zinc-600" />
              <span className="text-[13px]">New request</span>
            </CommandItem>
            <CommandItem
              value="new collection folder"
              onSelect={() => run(() => setCreateCollectionOpen(true))}
              className="gap-2.5"
            >
              <FolderPlus className="h-3.5 w-3.5 text-zinc-600" />
              <span className="text-[13px]">New collection</span>
            </CommandItem>
            <CommandItem
              value="import postman collection"
              onSelect={() => run(() => setImportOpen(true))}
              className="gap-2.5"
            >
              <Upload className="h-3.5 w-3.5 text-zinc-600" />
              <span className="text-[13px]">Import a collection</span>
            </CommandItem>
            <CommandItem
              value="manage environments variables"
              onSelect={() => run(() => setEnvironmentsOpen(true))}
              className="gap-2.5"
            >
              <Layers className="h-3.5 w-3.5 text-zinc-600" />
              <span className="text-[13px]">Manage environments</span>
            </CommandItem>
            <CommandItem
              value="documentation docs help"
              onSelect={() => run(() => router.push("/docs"))}
              className="gap-2.5"
            >
              <BookOpen className="h-3.5 w-3.5 text-zinc-600" />
              <span className="text-[13px]">Open documentation</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default SearchBar;

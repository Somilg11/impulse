"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import { useRequestPlaygroundStore } from "../store/useRequestStore";
import { useRenameRequest } from "../hooks/request";
import { methodBadge } from "@/lib/http-display";

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, addTab, closeTab, updateTab, markUnsaved } =
    useRequestPlaygroundStore();

  // Renaming happens in the tab itself. A full-screen dialog to edit one text
  // field is far more ceremony than the action deserves, and it hides the thing
  // being renamed behind an overlay.
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const renameRequest = useRenameRequest("");

  const startRename = (tabId: string, currentTitle: string) => {
    setDraft(currentTitle);
    setRenamingId(tabId);
  };

  const commitRename = async (tabId: string) => {
    const name = draft.trim();
    setRenamingId(null);
    if (!name) return;

    const tab = tabs.find((t) => t.id === tabId);
    if (!tab || name === tab.title) return;

    updateTab(tabId, { title: name });

    // A saved request also needs the new name persisted; an unsaved tab keeps
    // it locally until it is saved for the first time.
    if (tab.requestId) {
      try {
        await renameRequest.mutateAsync({ id: tab.requestId, name });
      } catch {
        // The rename hook surfaces its own failure; the tab keeps the new title
        // and stays flagged as unsaved so the change is not silently lost.
        markUnsaved(tabId, true);
      }
    }
  };

  return (
    <div className="flex h-9 shrink-0 items-center overflow-x-auto border-b border-line bg-canvas no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;

        return (
          <div
            key={tab.id}
            onDoubleClick={() => startRename(tab.id, tab.title)}
            onClick={() => setActiveTab(tab.id)}
            className={`group relative flex h-full shrink-0 cursor-pointer items-center gap-2 border-r border-line px-3 transition-colors duration-[--duration-fast] ease-[--ease-ios] ${
              isActive
                ? "bg-surface text-white"
                : "text-zinc-500 hover:bg-surface/60 hover:text-zinc-300"
            }`}
          >
            {isActive && <div className="absolute inset-x-0 top-0 h-[2px] bg-brand" />}

            <span
              className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-bold ${methodBadge(tab.method)}`}
            >
              {tab.method}
            </span>

            {renamingId === tab.id ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onBlur={() => commitRename(tab.id)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") commitRename(tab.id);
                  if (e.key === "Escape") setRenamingId(null);
                }}
                className="w-[120px] rounded border border-brand/60 bg-canvas px-1 py-px text-[12px] text-zinc-100 outline-none"
              />
            ) : (
              <p
                className="max-w-[100px] truncate text-[12px] sm:max-w-[140px]"
                title="Double-click to rename"
              >
                {tab.title}
              </p>
            )}

            {tab.unsavedChanges && (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                title="Unsaved changes"
              />
            )}

            <button
              type="button"
              aria-label={`Close ${tab.title}`}
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="shrink-0 rounded p-0.5 text-zinc-600 opacity-0 transition-[opacity,color] duration-[--duration-fast] hover:text-zinc-200 focus-visible:opacity-100 group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}

      <button
        onClick={addTab}
        aria-label="New request tab"
        className="flex h-full items-center justify-center px-3 text-zinc-500 transition-colors duration-[--duration-fast] hover:bg-surface/60 hover:text-zinc-300"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

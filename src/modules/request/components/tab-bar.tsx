"use client";
import { X } from "lucide-react";
import { useState } from "react";
import { useRequestPlaygroundStore } from "../store/useRequestStore";
import AddNameModal from "./add-name-modal";
import { methodBadge } from "@/lib/http-display";

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, addTab, closeTab } =
    useRequestPlaygroundStore();
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);

  const onDoubleClick = (tabId: string) => {
    setSelectedTabId(tabId);
    setRenameModalOpen(true);
  }

  return (
    <>
      <div className="flex items-center border-b border-line bg-canvas h-9 overflow-x-auto no-scrollbar shrink-0">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onDoubleClick={() => onDoubleClick(tab.id)}
            onClick={() => setActiveTab(tab.id)}
            className={`group relative h-full shrink-0 cursor-pointer border-r border-line px-3 flex items-center gap-2 transition-colors duration-[--duration-fast] ease-[--ease-ios] ${activeTabId === tab.id
                ? "bg-surface text-white"
                : "text-zinc-500 hover:bg-surface/60 hover:text-zinc-300"
              }`}
          >
            {activeTabId === tab.id && (
              <div className="absolute inset-x-0 top-0 h-[2px] bg-brand" />
            )}
            
            <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${methodBadge(tab.method)}`}>
              {tab.method}
            </span>

            <p className="max-w-[100px] sm:max-w-[140px] truncate text-[12px]">
              {tab.title}
            </p>

            {tab.unsavedChanges && (
                <div className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
            )}

            <X
              className="w-3 h-3 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
            />
          </div>
        ))}
        <button
          onClick={addTab}
          className="h-full px-3 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-surface-raised/50 transition-all text-[13px]"
        >
          +
        </button>
      </div>

      {selectedTabId && (
        <AddNameModal
          isModalOpen={renameModalOpen}
          setIsModalOpen={setRenameModalOpen}
          tabId={selectedTabId}
        />
      )}
    </>
  );
}
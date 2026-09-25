"use client";
import { X } from "lucide-react";
import { useState } from "react";
import { useRequestPlaygroundStore } from "../store/useRequestStore";
import AddNameModal from "./add-name-modal";

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, addTab, closeTab } =
    useRequestPlaygroundStore();
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);

  const methodColorMap: Record<string, string> = {
    GET: "text-green-400 bg-green-400/10",
    POST: "text-amber-400 bg-amber-400/10",
    PUT: "text-blue-400 bg-blue-400/10",
    DELETE: "text-red-400 bg-red-400/10",
  };

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
            className={`group h-full px-3 flex items-center gap-2 cursor-pointer transition-all relative shrink-0 border-r border-line ${activeTabId === tab.id
                ? "bg-surface-raised text-white"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-surface-raised/50"
              }`}
          >
            {activeTabId === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500" />
            )}
            
            <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${methodColorMap[tab.method] || "text-zinc-500 bg-zinc-500/10"}`}>
              {tab.method}
            </span>

            <p className="max-w-[100px] sm:max-w-[140px] truncate text-xs">
              {tab.title}
            </p>

            {tab.unsavedChanges && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
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
          className="h-full px-3 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-surface-raised/50 transition-all text-sm"
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
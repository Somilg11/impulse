"use client";

import { useHotkeys } from "react-hotkeys-hook";
import RequestEditor from "./request-editor";
import TabBar from "./tab-bar";
import { useRequestPlaygroundStore } from "../store/useRequestStore";
import { useState } from "react";
import { toast } from "sonner";
import SaveRequestToCollectionModal from "@/modules/collections/components/add-request-modal";
import { REST_METHOD } from "@prisma/client";

import { useSaveRequest } from "../hooks/request";

export default function PlaygroundPage() {
  const { tabs, activeTabId, addTab } = useRequestPlaygroundStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const { mutateAsync } = useSaveRequest(activeTab?.requestId ?? "");
  const [showSaveModal, setShowSaveModal] = useState(false);


  const getCurrentRequestData = () => {
    if (!activeTab) {
      return {
        name: "Untitled Request",
        method: REST_METHOD.GET as REST_METHOD,
        url: "https://echo.hoppscotch.io"
      };
    }

    return {
      name: activeTab.title || "Untitled Request",
      method: (activeTab.method as REST_METHOD) || REST_METHOD.GET,
      url: activeTab.url || "https://echo.hoppscotch.io",
      body: activeTab.body,
      headers: activeTab.headers,
      parameters: activeTab.parameters,
      bodyType: activeTab.bodyType,
      auth: activeTab.auth,
      tests: activeTab.tests,
    };
  };

 useHotkeys(
  "ctrl+s, meta+s",
  async (e: { preventDefault: () => void; stopPropagation: () => void; }) => {
    e.preventDefault();
    e.stopPropagation();

    if (!activeTab) {
      toast.error("No active request to save");
      return;
    }

    // Only an already-saved request can be updated in place; anything else
    // needs a collection picked first.
    if (activeTab.requestId) {
  
      try {
        await mutateAsync({
          url: activeTab.url || "https://echo.hoppscotch.io",
          method: activeTab.method as REST_METHOD,
          name: activeTab.title || "Untitled Request",
          body: activeTab.body,
          headers: activeTab.headers,
          parameters: activeTab.parameters,
          bodyType: activeTab.bodyType,
          auth: activeTab.auth,
          tests: activeTab.tests,
        });
        toast.success("Request updated");
      } catch (err) {
        console.error("Failed to update request:", err);
        toast.error("Failed to update request");
      }
    } else {
     
      setShowSaveModal(true);
    }
  },
  { preventDefault: true, enableOnFormTags: true },
  [activeTab]
);


  useHotkeys(
    "ctrl+g, meta+shift+n",
    (e: { preventDefault: () => void; stopPropagation: () => void; }) => {
      e.preventDefault();
      e.stopPropagation();
      addTab();
    },
    {
      preventDefault: true,
      enableOnFormTags: true,
    },
    []
  );

  if (!activeTab) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 bg-canvas px-6">
        <div className="text-center">
          <p className="text-[15px] font-medium text-zinc-300">No request open</p>
          <p className="mt-1.5 text-[13px] text-zinc-600">
            Start a new one, or pick a saved request from the sidebar.
          </p>
        </div>

        <button
          onClick={addTab}
          className="h-9 rounded-lg bg-brand px-4 text-[13px] font-medium text-white transition-colors duration-[--duration-fast] ease-[--ease-ios] hover:bg-brand-hover"
        >
          New request
        </button>

        {/* Shortcuts stated here rather than hidden behind a menu: this is the
            only screen where the user has nothing else to read. */}
        <div className="mt-2 space-y-2">
          {[
            { label: "New request", keys: ["\u2318", "G"] },
            { label: "Save request", keys: ["\u2318", "S"] },
            { label: "Search", keys: ["\u2318", "K"] },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-12 text-[12px]"
            >
              <span className="text-zinc-600">{row.label}</span>
              <div className="flex gap-1">
                {row.keys.map((key) => (
                  <kbd
                    key={key}
                    className="rounded border border-line bg-surface-raised px-1.5 py-0.5 font-sans text-[10px] text-zinc-500"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TabBar />
      <div className="flex-1 min-h-0">
        <RequestEditor />
      </div>

      {/* Save Request Modal */}
      <SaveRequestToCollectionModal
        isModalOpen={showSaveModal}
        setIsModalOpen={setShowSaveModal}
        requestData={getCurrentRequestData()}
        initialName={getCurrentRequestData().name}
        linkTabId={activeTab?.id ?? null}
      />
    </div>
  );
}
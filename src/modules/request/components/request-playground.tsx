"use client";

import { useHotkeys } from "react-hotkeys-hook";
import RequestEditor from "./request-editor";
import TabBar from "./tab-bar";
import { useRequestPlaygroundStore } from "../store/useRequestStore";
import { useState } from "react";
import { toast } from "sonner";
import SaveRequestToCollectionModal from "@/modules/collections/components/add-request-modal";
import { REST_METHOD } from "@prisma/client";

import { Terminal } from "lucide-react";
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
      toast.success("New request created");
    },
    {
      preventDefault: true,
      enableOnFormTags: true,
    },
    []
  );

  if (!activeTab) {
    return (
      <div className="flex flex-col gap-6 h-full items-center justify-center bg-canvas">
        <div className="flex flex-col justify-center items-center h-20 w-20 border border-line rounded-2xl bg-surface-raised">
          <Terminal size={32} className='text-zinc-500' strokeWidth={1.5} />
        </div>
       
        <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-zinc-400">Ready to test?</p>
            <div className="bg-surface-raised border border-line px-5 py-4 rounded-lg space-y-2.5 text-xs">
              <div className="flex justify-between items-center gap-10">
                <span className="text-zinc-400">New Request</span>
                <div className="flex gap-0.5">
                    <kbd className="px-1.5 py-0.5 bg-line text-zinc-500 text-[10px] rounded">⌘</kbd>
                    <kbd className="px-1.5 py-0.5 bg-line text-zinc-500 text-[10px] rounded">⇧</kbd>
                    <kbd className="px-1.5 py-0.5 bg-line text-zinc-500 text-[10px] rounded">N</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center gap-10">
                <span className="text-zinc-400">Save Request</span>
                <div className="flex gap-0.5">
                    <kbd className="px-1.5 py-0.5 bg-line text-zinc-500 text-[10px] rounded">⌘</kbd>
                    <kbd className="px-1.5 py-0.5 bg-line text-zinc-500 text-[10px] rounded">S</kbd>
                </div>
              </div>
            </div>
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
      />
    </div>
  );
}
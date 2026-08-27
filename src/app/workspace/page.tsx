"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useWorkspaceStore } from "@/modules/layout/store";
import RequestPlayground from "@/modules/request/components/request-playground";

import TabbedSidebar from "@/modules/collections/components/sidebar";

import { useGetWorkspace } from "@/modules/workspace/hooks/workspace";
import { Archive, Loader } from "lucide-react";
import { useState } from "react";

const Page = () => {
  const { selectedWorkspace } = useWorkspaceStore();
  const { data: currentWorkspace, isPending } = useGetWorkspace(selectedWorkspace?.id ?? "");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0e1117]">
        <Loader className="animate-spin h-5 w-5 text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Mobile toggle */}
      <div className="md:hidden flex items-center border-b border-[#1e2330] bg-[#0e1117] px-3 h-9 shrink-0">
        <button
          onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
            showMobileSidebar
              ? "bg-[#1e2330] text-blue-400"
              : "text-zinc-400 hover:text-zinc-300"
          }`}
        >
          <Archive className="w-3 h-3" />
          Collections
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {showMobileSidebar && (
        <div className="md:hidden absolute inset-0 top-9 z-40 bg-[#0e1117]">
          <TabbedSidebar currentWorkspace={currentWorkspace} />
        </div>
      )}

      {/* Desktop: sidebar LEFT, playground RIGHT */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={25} maxSize={35} minSize={18} className="flex">
            <div className="flex-1 overflow-hidden">
              <TabbedSidebar currentWorkspace={currentWorkspace} />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={75} minSize={50}>
            <RequestPlayground />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile: full-width playground */}
      <div className="md:hidden flex-1 overflow-auto">
        <RequestPlayground />
      </div>
    </div>
  );
};

export default Page;
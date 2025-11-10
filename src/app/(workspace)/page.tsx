/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useWorkspaceStore } from "@/modules/layout/store";
// import RequestPlayground from "@/modules/request/components/request-playground";

import TabbedSidebar from "@/modules/collections/components/sidebar";

import { useGetWorkspace } from "@/modules/workspace/hooks/workspace";
import { Loader } from "lucide-react";

const Page = () => {
  const { selectedWorkspace } = useWorkspaceStore();
  const { data: currentWorkspace, isPending } = useGetWorkspace( selectedWorkspace?.id!);

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader className="animate-spin h-6 w-6 text-blue-500" />
      </div>
    );
  }

return (
  <ResizablePanelGroup direction="horizontal">
    <ResizablePanel defaultSize={65} minSize={40}>
        {/* <RequestPlayground /> */}
        <h1>Request Playground</h1>
    </ResizablePanel>

    <ResizableHandle withHandle />

    <ResizablePanel defaultSize={35} maxSize={40} minSize={25} className="flex">
      <div className="flex-1">
        <TabbedSidebar currentWorkspace={currentWorkspace} />
      </div>
    </ResizablePanel>
  </ResizablePanelGroup>
)
};

export default Page;
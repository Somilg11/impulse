"use client";

import { Button } from "@/components/ui/button";
import { Loader, Plus, User } from "lucide-react";
import { useEffect, useState } from "react";

import CreateWorkspace from "./create-workspace";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useWorkspaces } from "@/modules/workspace/hooks/workspace";
import { useWorkspaceStore } from "../store";

const WorkSpace = () => {
  const { data: workspaces, isLoading } = useWorkspaces();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { selectedWorkspace, setSelectedWorkspace } = useWorkspaceStore();


  useEffect(() => {
    if (workspaces && workspaces.length > 0 && !selectedWorkspace) {
      setSelectedWorkspace(workspaces[0]);
    }
  }, [workspaces, selectedWorkspace, setSelectedWorkspace]);

 
  if (isLoading) {
    return <Loader className="animate-spin size-3.5 text-zinc-400" />;
  }

  if (!workspaces || workspaces.length === 0) {
    return <div className="text-xs text-zinc-500">No workspace</div>;
  }

  return (
    <>
      <Select
        value={selectedWorkspace?.id}
        onValueChange={(id) => {
          const ws = workspaces.find((w) => w.id === id);
          if (ws) setSelectedWorkspace(ws);
        }}
      >
        <SelectTrigger className="border border-line bg-surface-raised hover:bg-line text-zinc-300 flex flex-row items-center gap-1.5 rounded-lg h-7 px-3 transition-all w-auto min-w-0">
          <div className="bg-blue-600 text-white text-[9px] font-bold w-4 h-4 rounded flex items-center justify-center shrink-0">W</div>
          <span className="text-xs font-medium truncate max-w-[120px]">
            <SelectValue placeholder="Workspace" />
          </span>
        </SelectTrigger>
        <SelectContent className="bg-surface-raised border border-line text-zinc-300 rounded-lg shadow-2xl">
          {workspaces.map((ws) => (
            <SelectItem key={ws.id} value={ws.id} className="hover:bg-line cursor-pointer rounded text-xs">
              {ws.name}
            </SelectItem>
          ))}
          <Separator className="my-1.5 bg-line" />
          <div className="p-1.5 px-2 flex flex-row justify-between items-center">
            <span className="text-[10px] text-zinc-500">Workspaces</span>
            <Button size="icon" variant="ghost" className="h-5 w-5 rounded hover:bg-line" onClick={() => setIsModalOpen(true)}>
              <Plus size={12} className="text-zinc-400" />
            </Button>
          </div>
        </SelectContent>
      </Select>

      <CreateWorkspace isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
    </>
  );
};

export default WorkSpace;
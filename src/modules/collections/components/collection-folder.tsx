import {
    EllipsisVertical,
    FilePlus,
    Trash,
    Edit,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import EditCollectionModal from "./edit-collection";
import DeleteCollectionModal from "./delete-collection";
import SaveRequestToCollectionModal from "./add-request-modal";
import { useGetAllRequestFromCollection } from "@/modules/request/hooks/request";
import { REST_METHOD } from "@prisma/client";
import { useRequestPlaygroundStore } from "@/modules/request/store/useRequestStore";

interface Props {
    collection: {
        id: string;
        name: string;
        updatedAt: Date;
        workspaceId: string;
    }
}

const CollectionFolder = ({ collection }: Props) => {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isAddRequestOpen, setIsAddRequestOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const {
    data: requestData,
    isPending,
    isError,
  } = useGetAllRequestFromCollection(collection.id);

  const { openRequestTab, activeTabId } = useRequestPlaygroundStore();

  const methodColorMap: Record<REST_METHOD, string> = {
    [REST_METHOD.GET]: "text-green-400 bg-green-400/10",
    [REST_METHOD.POST]: "text-amber-400 bg-amber-400/10",
    [REST_METHOD.PUT]: "text-blue-400 bg-blue-400/10",
    [REST_METHOD.DELETE]: "text-red-400 bg-red-400/10",
    [REST_METHOD.PATCH]: "text-orange-400 bg-orange-400/10",
  };

  const hasRequests = requestData && requestData.length > 0;

    return (
        <>
            <Collapsible
                open={isCollapsed}
                onOpenChange={setIsCollapsed}
                className="w-full"
            >
                {/* Collection header */}
                <div className="flex items-center group">
                    <CollapsibleTrigger className="flex items-center gap-1.5 flex-1 px-3 py-1.5 hover:bg-[#1e2330]/50 rounded transition-colors cursor-pointer text-left">
                        {hasRequests ? (
                            isCollapsed ? (
                                <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
                            ) : (
                                <ChevronRight className="w-3 h-3 text-zinc-500 shrink-0" />
                            )
                        ) : (
                            <div className="w-3 h-3 shrink-0" />
                        )}
                        <span className="text-xs text-zinc-300 font-medium truncate">
                            {collection.name}
                        </span>
                    </CollapsibleTrigger>

                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                        <button 
                            onClick={() => setIsAddRequestOpen(true)}
                            className="p-1 hover:bg-[#1e2330] rounded text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            <FilePlus className="w-3 h-3" />
                        </button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-1 hover:bg-[#1e2330] rounded text-zinc-500 hover:text-zinc-300 transition-colors">
                                    <EllipsisVertical className="w-3 h-3" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#161b26] border border-[#1e2330] text-zinc-300 rounded-lg shadow-xl w-36">
                                <DropdownMenuItem onClick={() => setIsAddRequestOpen(true)} className="text-xs hover:bg-[#1e2330] cursor-pointer gap-2">
                                    <FilePlus className="w-3 h-3 text-green-400" />
                                    Add Request
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsEditOpen(true)} className="text-xs hover:bg-[#1e2330] cursor-pointer gap-2">
                                    <Edit className="w-3 h-3 text-blue-400" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsDeleteOpen(true)} className="text-xs hover:bg-[#1e2330] cursor-pointer gap-2">
                                    <Trash className="w-3 h-3 text-red-400" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Requests list */}
                <CollapsibleContent>
                    {isPending ? (
                        <div className="pl-7 py-2">
                            <div className="w-3 h-3 border-2 border-[#1e2330] border-t-blue-400 rounded-full animate-spin" />
                        </div>
                    ) : isError ? (
                        <div className="pl-7 py-1.5 text-[10px] text-red-400/60">Error</div>
                    ) : hasRequests ? (
                        <div className="ml-3 space-y-0.5">
                            {requestData.map((request) => (
                                <button
                                    key={request.id}
                                    onClick={() => openRequestTab(request)}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#1e2330]/50 rounded transition-colors text-left group/req"
                                >
                                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded shrink-0 ${
                                        methodColorMap[request.method as keyof typeof methodColorMap] ?? 'text-zinc-500 bg-zinc-500/10'
                                    }`}>
                                        {request.method}
                                    </span>
                                    <span className="text-xs text-zinc-300 truncate">
                                        {request.name || "Untitled"}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="pl-7 py-1.5 text-[10px] text-zinc-600 italic">No requests</div>
                    )}
                </CollapsibleContent>
            </Collapsible>

            <SaveRequestToCollectionModal
                isModalOpen={isAddRequestOpen}
                setIsModalOpen={setIsAddRequestOpen}
                collectionId={collection.id}
            />

            <EditCollectionModal
                isModalOpen={isEditOpen}
                setIsModalOpen={setIsEditOpen}
                collectionId={collection.id}
                initialName={collection.name}
            />

            <DeleteCollectionModal
                isModalOpen={isDeleteOpen}
                setIsModalOpen={setIsDeleteOpen}
                collectionId={collection.id}
            />
        </>
    )
}

export default CollectionFolder
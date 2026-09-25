import {
    EllipsisVertical,
    FilePlus,
    Trash,
    Edit,
    ChevronDown,
    ChevronRight,
    Download,
    FolderPlus,
    Play,
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
import { useExportCollection } from "../hooks/collections";
import CreateCollection from "./create-collection";
import CollectionRunner from "@/modules/request/components/collection-runner";
import DeleteCollectionModal from "./delete-collection";
import SaveRequestToCollectionModal from "./add-request-modal";
import { useGetAllRequestFromCollection } from "@/modules/request/hooks/request";
import { methodBadge } from "@/lib/http-display";
import { useRequestPlaygroundStore } from "@/modules/request/store/useRequestStore";

interface CollectionNode {
    id: string;
    name: string;
    updatedAt: Date;
    workspaceId: string;
    parentId?: string | null;
}

interface Props {
    collection: CollectionNode;
    /** Sibling folders nested under this one. */
    children?: CollectionNode[];
    /** Look up a node's own children, so the tree can recurse. */
    childrenOf?: (parentId: string) => CollectionNode[];
    depth?: number;
}

const CollectionFolder = ({ collection, childrenOf, depth = 0 }: Props) => {
    const childFolders = childrenOf?.(collection.id) ?? [];
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isAddRequestOpen, setIsAddRequestOpen] = useState(false);
    const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);
    const [isRunnerOpen, setIsRunnerOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const {
    data: requestData,
    isPending,
    isError,
  } = useGetAllRequestFromCollection(collection.id);

  const { openRequestTab, activeTabId } = useRequestPlaygroundStore();
    const exportCollection = useExportCollection(collection.id, collection.name);

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
                    <CollapsibleTrigger
                        className="flex flex-1 cursor-pointer items-center gap-1.5 rounded-md px-2 py-[5px] text-left transition-colors duration-[--duration-fast] ease-[--ease-ios] hover:bg-surface-hover"
                        style={{ paddingLeft: `${12 + depth * 12}px` }}
                    >
                        {hasRequests ? (
                            isCollapsed ? (
                                <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
                            ) : (
                                <ChevronRight className="w-3 h-3 text-zinc-500 shrink-0" />
                            )
                        ) : (
                            <div className="w-3 h-3 shrink-0" />
                        )}
                        <span className="text-[12px] text-zinc-300 font-medium truncate">
                            {collection.name}
                        </span>
                        {/* Count conveys size without expanding; folders are counted
                            too so a container of folders does not look empty. */}
                        {!isPending && (requestData?.length || childFolders.length) ? (
                            <span className="ml-auto shrink-0 pl-1 text-[10px] tabular-nums text-zinc-600">
                                {(requestData?.length ?? 0) + childFolders.length}
                            </span>
                        ) : null}
                    </CollapsibleTrigger>

                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                        <button 
                            onClick={() => setIsAddRequestOpen(true)}
                            className="p-1 hover:bg-line rounded text-zinc-500 hover:text-zinc-300 transition-colors duration-[--duration-fast] ease-[--ease-ios]"
                        >
                            <FilePlus className="w-3 h-3" />
                        </button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-1 hover:bg-line rounded text-zinc-500 hover:text-zinc-300 transition-colors duration-[--duration-fast] ease-[--ease-ios]">
                                    <EllipsisVertical className="w-3 h-3" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-surface-raised border border-line text-zinc-300 rounded-lg shadow-xl w-36">
                                <DropdownMenuItem onClick={() => setIsAddRequestOpen(true)} className="text-[12px] hover:bg-line cursor-pointer gap-2">
                                    <FilePlus className="w-3 h-3 text-green-400" />
                                    Add Request
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsRunnerOpen(true)} className="text-[12px] hover:bg-line cursor-pointer gap-2">
                                    <Play className="w-3 h-3" />
                                    Run collection
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsAddFolderOpen(true)} className="text-[12px] hover:bg-line cursor-pointer gap-2">
                                    <FolderPlus className="w-3 h-3" />
                                    New Folder
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsEditOpen(true)} className="text-[12px] hover:bg-line cursor-pointer gap-2">
                                    <Edit className="w-3 h-3 text-brand" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => exportCollection("postman")}
                                    className="text-[12px] hover:bg-line cursor-pointer gap-2"
                                >
                                    <Download className="w-3 h-3" />
                                    Export (Postman)
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => exportCollection("impulse")}
                                    className="text-[12px] hover:bg-line cursor-pointer gap-2"
                                >
                                    <Download className="w-3 h-3" />
                                    Export (Impulse)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsDeleteOpen(true)} className="text-[12px] hover:bg-line cursor-pointer gap-2">
                                    <Trash className="w-3 h-3 text-red-400" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Requests list */}
                <CollapsibleContent>
                    {/* Child folders first, so requests read as leaves of this level */}
                    {childFolders.map((child) => (
                        <CollectionFolder
                            key={child.id}
                            collection={child}
                            childrenOf={childrenOf}
                            depth={depth + 1}
                        />
                    ))}

                    {isPending ? (
                        <div className="pl-7 py-2">
                            <div className="w-3 h-3 border-2 border-line border-t-brand rounded-full animate-spin" />
                        </div>
                    ) : isError ? (
                        <div className="pl-7 py-1.5 text-[10px] text-red-400/60">Error</div>
                    ) : hasRequests ? (
                        <div className="ml-3 space-y-0.5">
                            {requestData.map((request) => (
                                <button
                                    key={request.id}
                                    onClick={() => openRequestTab(request)}
                                    className="group/req flex w-full items-center gap-2 rounded-md px-2 py-[5px] text-left transition-colors duration-[--duration-fast] ease-[--ease-ios] hover:bg-surface-hover"
                                >
                                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded shrink-0 ${
                                        methodBadge(request.method)
                                    }`}>
                                        {request.method}
                                    </span>
                                    <span className="text-[12px] text-zinc-300 truncate">
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

            <CollectionRunner
                collectionId={collection.id}
                collectionName={collection.name}
                isOpen={isRunnerOpen}
                onClose={() => setIsRunnerOpen(false)}
            />

            <CreateCollection
                workspaceId={collection.workspaceId}
                parentId={collection.id}
                parentName={collection.name}
                isModalOpen={isAddFolderOpen}
                setIsModalOpen={setIsAddFolderOpen}
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
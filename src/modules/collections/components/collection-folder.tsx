import {
    EllipsisVertical,
    FilePlus,
    Trash,
    Edit,
    ChevronDown,
    ChevronRight,
    Download,
    FolderPlus,
    FolderInput,
    Play,
    Pencil,
    CopyPlus,
    Link2,
} from "lucide-react";
import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import EditCollectionModal from "./edit-collection";
import { useExportCollection, useMoveCollection } from "../hooks/collections";
import CreateCollection from "./create-collection";
import CollectionRunner from "@/modules/request/components/collection-runner";
import DeleteCollectionModal from "./delete-collection";
import SaveRequestToCollectionModal from "./add-request-modal";
import {
    useDeleteRequest,
    useDuplicateRequest,
    useGetAllRequestFromCollection,
    useRenameRequest,
} from "@/modules/request/hooks/request";
import { toast } from "sonner";
import { methodBadge } from "@/lib/http-display";
import { useRequestPlaygroundStore } from "@/modules/request/store/useRequestStore";
import { copyToClipboard } from "@/lib/clipboard";

interface CollectionNode {
    id: string;
    name: string;
    updatedAt: Date;
    workspaceId: string;
    parentId?: string | null;
}

interface Props {
    collection: CollectionNode;
    /** Look up a node's own children, so the tree can recurse. */
    childrenOf?: (parentId: string) => CollectionNode[];
    /** Every collection in the workspace - used to offer move targets. */
    allCollections?: CollectionNode[];
    depth?: number;
}

const CollectionFolder = ({
    collection,
    childrenOf,
    allCollections = [],
    depth = 0,
}: Props) => {
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
    const deleteRequest = useDeleteRequest(collection.id);
    const duplicateRequest = useDuplicateRequest(collection.id);
    const renameRequest = useRenameRequest(collection.id);

    // Renaming happens in place in the tree, the way a file manager does it -
    // a modal for one text field is more ceremony than the action deserves.
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [draftName, setDraftName] = useState("");

    const commitRename = async (id: string) => {
        const name = draftName.trim();
        setRenamingId(null);
        if (!name) return;
        try {
            await renameRequest.mutateAsync({ id, name });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not rename");
        }
    };
    const moveCollection = useMoveCollection(collection.workspaceId);

    // A folder cannot move into itself or anything beneath it - the server
    // refuses such a move, but offering it as a choice would be a trap.
    const descendantIds = (() => {
        const ids = new Set<string>([collection.id]);
        let frontier = [collection.id];
        while (frontier.length) {
            const next = allCollections
                .filter((c) => c.parentId && frontier.includes(c.parentId))
                .map((c) => c.id);
            frontier = next.filter((id) => !ids.has(id));
            frontier.forEach((id) => ids.add(id));
        }
        return ids;
    })();

    const moveTargets = allCollections.filter((c) => !descendantIds.has(c.id));

    const onMove = async (parentId: string | null, label: string) => {
        try {
            await moveCollection.mutateAsync({ collectionId: collection.id, parentId });
            toast.success(`Moved "${collection.name}" to ${label}`);
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Could not move the collection"
            );
        }
    };

    const onDeleteRequest = async (
        event: React.MouseEvent,
        requestId: string,
        name: string
    ) => {
        // The row itself opens the request, so the delete control must not.
        event.stopPropagation();
        try {
            await deleteRequest.mutateAsync(requestId);
            toast.success(`Deleted "${name || "Untitled"}"`);
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Could not delete the request"
            );
        }
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
                            <DropdownMenuContent align="start" className="w-52">
                                <DropdownMenuItem onClick={() => setIsAddRequestOpen(true)} className="gap-2">
                                    <FilePlus className="h-3.5 w-3.5" />
                                    Add Request
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsRunnerOpen(true)} className="gap-2">
                                    <Play className="h-3.5 w-3.5" />
                                    Run collection
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsAddFolderOpen(true)} className="gap-2">
                                    <FolderPlus className="h-3.5 w-3.5" />
                                    New Folder
                                </DropdownMenuItem>
                                {moveTargets.length > 0 && (
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger className="gap-2">
                                            <FolderInput className="h-3.5 w-3.5" />
                                            Move to
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                                            {collection.parentId && (
                                                <>
                                                    <DropdownMenuItem
                                                        onClick={() => onMove(null, "the top level")}
                                                    >
                                                        Top level
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                </>
                                            )}
                                            {moveTargets.map((target) => (
                                                <DropdownMenuItem
                                                    key={target.id}
                                                    disabled={target.id === collection.parentId}
                                                    onClick={() => onMove(target.id, target.name)}
                                                >
                                                    {target.name}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                )}
                                <DropdownMenuItem onClick={() => setIsEditOpen(true)} className="gap-2">
                                    <Edit className="h-3.5 w-3.5" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => exportCollection("postman")}
                                    className="gap-2"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Export · Postman
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => exportCollection("impulse")}
                                    className="gap-2"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Export · Impulse
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive" onClick={() => setIsDeleteOpen(true)} className="gap-2">
                                    <Trash className="h-3.5 w-3.5" />
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
                            allCollections={allCollections}
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
                                <div
                                    key={request.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => openRequestTab(request)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            openRequestTab(request);
                                        }
                                    }}
                                    className="group/req flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-[5px] text-left transition-colors duration-[--duration-fast] ease-[--ease-ios] hover:bg-surface-hover"
                                >
                                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded shrink-0 ${
                                        methodBadge(request.method)
                                    }`}>
                                        {request.method}
                                    </span>
                                    {renamingId === request.id ? (
                                        <input
                                            autoFocus
                                            value={draftName}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => setDraftName(e.target.value)}
                                            onBlur={() => commitRename(request.id)}
                                            onKeyDown={(e) => {
                                                e.stopPropagation();
                                                if (e.key === "Enter") commitRename(request.id);
                                                if (e.key === "Escape") setRenamingId(null);
                                            }}
                                            className="min-w-0 flex-1 rounded border border-brand/60 bg-canvas px-1 py-px text-[12px] text-zinc-100 outline-none"
                                        />
                                    ) : (
                                        <span className="flex-1 truncate text-[12px] text-zinc-300">
                                            {request.name || "Untitled"}
                                        </span>
                                    )}
                                    {/* Revealed on hover so the tree stays quiet, but
                                        always focusable for keyboard users. */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                type="button"
                                                aria-label={`Actions for ${request.name || "request"}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="shrink-0 rounded p-0.5 text-zinc-600 opacity-0 transition-[opacity,color] duration-[--duration-fast] hover:text-zinc-200 focus-visible:opacity-100 group-hover/req:opacity-100 data-[state=open]:opacity-100 data-[state=open]:text-zinc-200"
                                            >
                                                <EllipsisVertical className="h-3.5 w-3.5" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="start"
                                            className="w-48"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <DropdownMenuItem
                                                className="gap-2"
                                                onClick={() => {
                                                    setDraftName(request.name || "");
                                                    setRenamingId(request.id);
                                                }}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="gap-2"
                                                onClick={async () => {
                                                    try {
                                                        await duplicateRequest.mutateAsync(request.id);
                                                        toast.success("Request duplicated");
                                                    } catch (error) {
                                                        toast.error(
                                                            error instanceof Error
                                                                ? error.message
                                                                : "Could not duplicate"
                                                        );
                                                    }
                                                }}
                                            >
                                                <CopyPlus className="h-3.5 w-3.5" />
                                                Duplicate
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="gap-2"
                                                onClick={() =>
                                                    copyToClipboard(request.url || "", "Request URL copied")
                                                }
                                            >
                                                <Link2 className="h-3.5 w-3.5" />
                                                Copy URL
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                variant="destructive"
                                                className="gap-2"
                                                onClick={(e) => onDeleteRequest(e, request.id, request.name)}
                                            >
                                                <Trash className="h-3.5 w-3.5" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
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
                collectionName={collection.name}
                isModalOpen={isDeleteOpen}
                setIsModalOpen={setIsDeleteOpen}
                collectionId={collection.id}
            />
        </>
    )
}

export default CollectionFolder
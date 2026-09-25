/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react'
import { useCollections } from '../hooks/collections'
import { MEMBER_ROLE } from '@prisma/client';
import { Archive, Clock, Code, ExternalLink, HelpCircle, Loader, Plus, Search, Share2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreateCollection from './create-collection';
import EmptyCollections from './empty-collections';
import CollectionFolder from './collection-folder';
import ImportModal from './import-modal';

type Member = {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    role: MEMBER_ROLE;
    workspaceId: string;
};

export type WorkspaceDetail = {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    description: string | null;
    ownerId: string;
    members?: Member[];
};

interface Props {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentWorkspace: WorkspaceDetail | any;
}

const TabbedSidebar = ({ currentWorkspace }: Props) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: collections, isLoading, isError } = useCollections(currentWorkspace?.id);

    // The server returns a flat list; the tree is assembled here so nesting costs
    // one query instead of a recursive include of unknown depth. Rendering the
    // flat list directly would show every folder twice - once nested under its
    // parent and once at the root.
    const all = collections ?? [];
    const childrenOf = (parentId: string) => all.filter((c) => c.parentId === parentId);

    const query = searchQuery.trim().toLowerCase();
    const roots = all.filter((c) => !c.parentId);

    // While searching, match at any depth and show the hits as a flat list -
    // keeping the hierarchy would hide matches inside collapsed folders.
    const visible = query
        ? all.filter((c) => c.name.toLowerCase().includes(query))
        : roots;

    if (isLoading) return (
        <div className="flex-1 flex items-center justify-center bg-canvas">
            <Loader className="w-5 h-5 text-zinc-500 animate-spin" />
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-canvas border-r border-line overflow-hidden">
            {/* Top actions: + New and Import */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line">
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white transition-colors font-medium"
                >
                    <Plus className="w-3.5 h-3.5" />
                    New
                </button>
                <button 
                    onClick={() => setIsImportModalOpen(true)}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-300 transition-colors font-medium"
                >
                    <Upload className="w-3 h-3" />
                    Import
                </button>
            </div>

            {/* Search */}
            <div className="px-3 py-2 border-b border-line">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search collections"
                        className="w-full bg-surface-raised border border-line rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-line-strong transition-colors"
                    />
                </div>
            </div>

            {/* Collections list */}
            <div className="flex-1 overflow-y-auto px-1 py-1">
                {all.length === 0 ? (
                    <EmptyCollections onImport={() => setIsImportModalOpen(true)} />
                ) : visible.length === 0 ? (
                    <p className="px-3 py-6 text-center text-xs text-zinc-600">
                        Nothing matches &ldquo;{searchQuery.trim()}&rdquo;.
                    </p>
                ) : (
                    visible.map((collection) => (
                        <CollectionFolder
                            key={collection.id}
                            collection={collection}
                            childrenOf={query ? undefined : childrenOf}
                        />
                    ))
                )}
            </div>

            <CreateCollection
                workspaceId={currentWorkspace?.id}
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
            />
            <ImportModal
                workspaceId={currentWorkspace?.id}
                isModalOpen={isImportModalOpen}
                setIsModalOpen={setIsImportModalOpen}
            />
        </div>
    );
}

export default TabbedSidebar
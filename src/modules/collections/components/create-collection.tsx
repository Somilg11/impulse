"use client";

import Modal from "@/components/ui/modal";
import { useCreateCollection } from "@/modules/collections/hooks/collections";

import { useState } from "react";
import { toast } from "sonner";


const CreateCollection = ({
    workspaceId,
    isModalOpen,
    setIsModalOpen,
    parentId = null,
    parentName,
}: {
    workspaceId: string;
    isModalOpen: boolean;
    setIsModalOpen: (open: boolean) => void;
    /** When set, the new collection is created as a folder inside this one. */
    parentId?: string | null;
    parentName?: string;
}) => {
    const [name, setName] = useState("");
    const { mutateAsync, isPending } = useCreateCollection(workspaceId, name, parentId);

    const handleSubmit = async () => {
        if (!name.trim()) return;
        try {
            await mutateAsync();
            toast.success(parentId ? "Folder created" : "Collection created");
            setName("");
            setIsModalOpen(false);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to create collection"
            );
            console.error("Failed to create collection:", err);
        }
    };

    return (
        <Modal
            title={parentId ? "New Folder" : "Add New Collection"}
            description={
                parentId
                    ? `Create a folder inside "${parentName ?? "this collection"}"`
                    : "Create a new Collection to organize your requests"
            }
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleSubmit}
            submitText={isPending ? "Creating..." : "Create Collection"}
            submitVariant="default"
        >
            <div className="space-y-4">
                <input
                    className="w-full p-2 border rounded"
                    placeholder="Collection name..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>
        </Modal>
    );
};

export default CreateCollection;
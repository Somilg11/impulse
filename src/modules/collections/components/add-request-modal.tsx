"use client";

import Modal from "@/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Folder, Plus, Search, X } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useAddRequestToCollection } from "@/modules/request/hooks/request";
import { BODY_TYPE, REST_METHOD } from "@prisma/client";
import { useWorkspaceStore } from "@/modules/layout/store";
import { useCollections } from "../hooks/collections";
import { Button } from "@/components/ui/button";


const SaveRequestToCollectionModal = ({
  isModalOpen,
  setIsModalOpen,
  requestData = {
    name: "Untitled",
    url: "https://echo.hoppscotch.io",
    method: REST_METHOD.GET,
  },
  initialName = "Untitled",
  collectionId
}: {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  requestData?: {
    name: string;
    method: REST_METHOD;
    url: string;
    body?: string;
    headers?: string;
    parameters?: string;
    bodyType?: BODY_TYPE;
    auth?: string;
    tests?: string;
  };
  initialName?: string;
  collectionId?: string
}) => {
  const [requestName, setRequestName] = useState(initialName);
  // Only the user's explicit pick is stored; the effective selection below is
  // derived, so there is no state to keep in sync as `collections` loads.
  const [pickedCollectionId, setPickedCollectionId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  
  const { selectedWorkspace } = useWorkspaceStore();
  const { data: collections, isLoading, isError } = useCollections(selectedWorkspace?.id ?? "");

  // Reset the form each time the modal opens. Adjusting state during render
  // against the previous value is React's documented alternative to mirroring a
  // prop into state inside an effect.
  const [wasModalOpen, setWasModalOpen] = useState(isModalOpen);
  if (isModalOpen !== wasModalOpen) {
    setWasModalOpen(isModalOpen);
    if (isModalOpen) {
      setRequestName(requestData.name || initialName);
      setPickedCollectionId("");
      setSearchTerm("");
    }
  }

  // Precedence: what the user picked, then a caller-pinned collection, then the
  // first available one once the list has loaded.
  const selectedCollectionId =
    pickedCollectionId || collectionId || collections?.[0]?.id || "";

  const { mutateAsync, isPending } = useAddRequestToCollection(selectedCollectionId);


  

  const requestColorMap: Record<REST_METHOD, string> = {
    [REST_METHOD.GET]: "text-green-500",
    [REST_METHOD.POST]: "text-brand",
    [REST_METHOD.PUT]: "text-yellow-500",
    [REST_METHOD.DELETE]: "text-red-500",
    [REST_METHOD.PATCH]: "text-orange-500",
 
  };


  const filteredCollections = collections?.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const selectedCollection = collections?.find(c => c.id === selectedCollectionId);

  const handleSubmit = async () => {
    if (!requestName.trim()) {
      toast.error("Please enter a request name");
      return;
    }

    if (!selectedCollectionId) {
      toast.error("Please select a collection");
      return;
    }
    
    try {
      // Headers, params, and body must travel with the request; saving only the
      // name/method/url silently dropped everything the user configured.
      await mutateAsync({
        url: requestData.url.trim(),
        method: requestData.method,
        name: requestName.trim(),
        body: requestData.body,
        headers: requestData.headers,
        parameters: requestData.parameters,
        bodyType: requestData.bodyType,
        auth: requestData.auth,
        tests: requestData.tests,
      });
     
      toast.success(`Request saved to "${selectedCollection?.name}" collection`);
      setIsModalOpen(false);
    } catch (err) {
      toast.error("Failed to save request to collection");
      console.error("Failed to save request to collection:", err);
    }
  };

  return (
    <Modal
      title="Save as"
      description=""
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onSubmit={handleSubmit}
      submitText={isPending ? "Saving..." : "Save"}
      submitVariant="default"
    >
      <div className="space-y-4">
       
        <div>
          <label className="block text-sm font-medium mb-2 text-zinc-200">Request name</label>
          <div className="relative">
            <input
              className="w-full rounded-lg border border-line bg-surface-raised p-3 pr-20 text-[13px] text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-line-strong"
              placeholder="Enter request name..."
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              autoFocus
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className={`text-xs font-bold px-2 py-1 rounded ${requestColorMap[requestData.method]} bg-zinc-700`}>
                {requestData.method}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-zinc-200">Select location</label>
          
   
          <div className="flex items-center space-x-2 text-sm text-zinc-400 mb-3">
            <span>{selectedWorkspace?.name || "workspace"}</span>
            <span>›</span>
            <span>Collections</span>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>


          <div className="space-y-1 max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-zinc-600 border-t-brand rounded-full animate-spin"></div>
                <span className="ml-2 text-sm text-zinc-400">Loading collections...</span>
              </div>
            ) : isError ? (
              <div className="text-center py-4 text-red-400 text-sm">
                Failed to load collections
              </div>
            ) : filteredCollections.length === 0 ? (
              <div className="text-center py-4 text-zinc-500 text-sm">
                {searchTerm ? "No collections found" : "No collections available"}
              </div>
            ) : (
              filteredCollections.map((collection) => (
                <div
                  key={collection.id}
                  onClick={() => setPickedCollectionId(collection.id)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedCollectionId === collection.id
                      ? "bg-brand/20 border border-brand/50 shadow-lg shadow-brand/10"
                      : "hover:bg-zinc-800 border border-transparent"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {selectedCollectionId === collection.id ? (
                      <div className="w-4 h-4 rounded-full bg-brand flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    ) : (
                      <Folder className="w-4 h-4 text-zinc-400" />
                    )}
                    <span className={`text-sm font-medium ${
                      selectedCollectionId === collection.id ? "text-brand" : "text-zinc-200"
                    }`}>
                      {collection.name}
                    </span>
                  </div>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <span className="text-zinc-500">⋯</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Collection Preview */}
        {selectedCollection && (
          <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-zinc-400">Saving to:</span>
              <Folder className="w-4 h-4 text-brand" />
              <span className="text-brand font-medium">{selectedCollection.name}</span>
            </div>
          </div>
        )}

        {/* URL Preview (Optional) */}
        <div className="p-2 bg-zinc-900 rounded border border-zinc-700">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-zinc-500">URL:</span>
            <span className="text-zinc-300 truncate">{requestData.url}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SaveRequestToCollectionModal;
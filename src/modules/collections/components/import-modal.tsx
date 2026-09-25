"use client";

import Modal from "@/components/ui/modal";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { importCollections } from "../actions";
import { Upload, FileJson, AlertCircle, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface ImportModalProps {
    workspaceId: string;
    isModalOpen: boolean;
    setIsModalOpen: (open: boolean) => void;
}

const ImportModal = ({
    workspaceId,
    isModalOpen,
    setIsModalOpen,
}: ImportModalProps) => {
    const [jsonContent, setJsonContent] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setJsonContent(content);
            toast.success("File loaded successfully");
        };
        reader.onerror = () => {
            toast.error("Failed to read file");
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        if (!jsonContent.trim()) {
            toast.error("Please provide JSON content or upload a file");
            return;
        }

        try {
            setIsImporting(true);
            const parsedData = JSON.parse(jsonContent);
            const result = await importCollections(workspaceId, parsedData);

            if (result.success) {
                toast.success("Collections imported successfully");
                setJsonContent("");
                queryClient.invalidateQueries({ queryKey: ["collections", workspaceId] });
                setIsModalOpen(false);
            } else {
                toast.error(result.error || "Failed to import collections");
            }
        } catch (err) {
            toast.error("Invalid JSON format");
            console.error("Import error:", err);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <Modal
            title="Import Collections"
            description="Import collections and requests from Impulse JSON or Postman v2.1 exports"
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleImport}
            submitText={isImporting ? "Importing..." : "Import"}
            disabled={isImporting}
        >
            <div className="space-y-4 py-2">
                {/* File Upload Area */}
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-line rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:bg-surface-raised cursor-pointer transition-all group"
                >
                    <div className="p-3 bg-brand/10 rounded-full group-hover:bg-brand/20 transition-colors">
                        <Upload className="w-6 h-6 text-brand" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-zinc-200">Click to upload or drag and drop</p>
                        <p className="text-xs text-zinc-500 mt-1">JSON files (Postman or Impulse export)</p>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        accept=".json"
                    />
                </div>

                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-line"></div>
                    <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest text-zinc-600">or paste JSON</span>
                    <div className="flex-grow border-t border-line"></div>
                </div>

                {/* JSON Editor */}
                <div className="relative">
                    <textarea
                        value={jsonContent}
                        onChange={(e) => setJsonContent(e.target.value)}
                        placeholder='{ "collections": [...] }'
                        className="w-full h-40 bg-canvas border border-line rounded-lg p-3 text-xs font-mono text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand/50 transition-colors resize-none"
                    />
                    <div className="absolute top-2 right-2 p-1.5 bg-surface-raised border border-line rounded text-zinc-500">
                        <FileJson className="w-3.5 h-3.5" />
                    </div>
                </div>

                {/* Help Alert */}
                <div className="flex items-start gap-3 p-3 bg-brand/5 border border-brand/10 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-zinc-400">
                        Requests are imported with their methods, URLs, query parameters, headers, and bodies. Postman folders are flattened into one collection, with the folder name kept as a prefix on each request.
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default ImportModal;

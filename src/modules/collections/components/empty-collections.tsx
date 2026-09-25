import { FolderPlus, Upload } from "lucide-react";
import React from "react";

interface EmptyCollectionsProps {
  onImport?: () => void;
  onCreate?: () => void;
}

/**
 * Shown when a workspace has no collections.
 *
 * Leads with the action rather than a large decorative icon: an empty sidebar is
 * a moment to do something, not to be told it is empty.
 */
const EmptyCollections = ({ onImport, onCreate }: EmptyCollectionsProps) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-raised">
        <FolderPlus className="h-4 w-4 text-zinc-600" strokeWidth={1.75} />
      </div>

      <p className="mt-4 text-[13px] font-medium text-zinc-300">No collections yet</p>
      <p className="mt-1 max-w-[15rem] text-[12px] leading-relaxed text-zinc-600">
        Group saved requests, or bring an existing Postman collection across.
      </p>

      <div className="mt-5 flex w-full max-w-[13rem] flex-col gap-2">
        {onCreate && (
          <button
            onClick={onCreate}
            className="h-8 w-full rounded-lg bg-brand text-[12.5px] font-medium text-white transition-colors hover:bg-brand-hover"
          >
            New collection
          </button>
        )}
        <button
          onClick={onImport}
          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-surface-raised text-[12.5px] font-medium text-zinc-300 transition-colors hover:bg-surface-hover"
        >
          <Upload className="h-3.5 w-3.5" />
          Import
        </button>
      </div>
    </div>
  );
};

export default EmptyCollections;

"use client";

import { create } from "zustand";

/**
 * Dialogs that more than one place needs to open.
 *
 * The import and new-collection dialogs live inside the collections sidebar,
 * but the command palette sits in the header - a different subtree entirely.
 * Keeping their open state local meant the palette could only tell you where to
 * click, which is not a command.
 */
type UiState = {
  importOpen: boolean;
  createCollectionOpen: boolean;
  environmentsOpen: boolean;

  setImportOpen: (open: boolean) => void;
  setCreateCollectionOpen: (open: boolean) => void;
  setEnvironmentsOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  importOpen: false,
  createCollectionOpen: false,
  environmentsOpen: false,

  setImportOpen: (open) => set({ importOpen: open }),
  setCreateCollectionOpen: (open) => set({ createCollectionOpen: open }),
  setEnvironmentsOpen: (open) => set({ environmentsOpen: open }),
}));

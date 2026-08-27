import { create } from "zustand";
import { nanoid } from "nanoid";
import type { ExecResult } from "@/lib/http";
import type { SendMode } from "../lib/send-request";

/** Mirrors a Prisma `Request` row: the Json columns come back as JsonValue,
 * not string, so they are normalized before landing in a tab. */
interface SavedRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  body?: unknown;
  headers?: unknown;
  parameters?: unknown;
  collectionId?: string;
}

function toEditorString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

export type RequestTab = {
  id: string;
  title: string;
  method: string;
  url: string;
  body?: string;
  headers?: string;
  parameters?: string;
  unsavedChanges?: boolean;
  requestId?: string; // set once the tab is backed by a DB row
  collectionId?: string;
  workspaceId?: string;
};

const DEFAULT_URL = "https://echo.hoppscotch.io";

type PlaygroundState = {
  tabs: RequestTab[];
  activeTabId: string | null;
  sendMode: SendMode;
  responseViewerData: ExecResult | null;
  responseByTabId: Record<string, ExecResult>;

  addTab: () => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, data: Partial<RequestTab>) => void;
  markUnsaved: (id: string, value: boolean) => void;
  openRequestTab: (req: SavedRequest & { workspaceId?: string }) => void;
  updateTabFromSavedRequest: (tabId: string, savedRequest: SavedRequest) => void;
  setSendMode: (mode: SendMode) => void;
  setResponseViewerData: (data: ExecResult | null, tabId?: string) => void;
};

const initialTab: RequestTab = {
  id: nanoid(),
  title: "Request",
  method: "GET",
  url: DEFAULT_URL,
  unsavedChanges: false,
};

export const useRequestPlaygroundStore = create<PlaygroundState>((set) => ({
  tabs: [initialTab],
  activeTabId: initialTab.id,
  sendMode: "auto",
  responseViewerData: null,
  responseByTabId: {},

  setSendMode: (mode) => set({ sendMode: mode }),

  setResponseViewerData: (data, tabId) =>
    set((state) => ({
      responseViewerData: data,
      responseByTabId:
        tabId && data
          ? { ...state.responseByTabId, [tabId]: data }
          : state.responseByTabId,
    })),

  addTab: () =>
    set((state) => {
      const newTab: RequestTab = {
        id: nanoid(),
        title: "Untitled",
        method: "GET",
        url: "",
        body: "",
        headers: "",
        parameters: "",
        unsavedChanges: true,
      };
      return {
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
        responseViewerData: null,
      };
    }),

  closeTab: (id) =>
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== id);
      const newActive =
        state.activeTabId === id
          ? newTabs[0]?.id ?? null
          : state.activeTabId;

      const responseByTabId = { ...state.responseByTabId };
      delete responseByTabId[id];

      return {
        tabs: newTabs,
        activeTabId: newActive,
        responseByTabId,
        responseViewerData: newActive ? responseByTabId[newActive] ?? null : null,
      };
    }),

  setActiveTab: (id) =>
    set((state) => ({
      activeTabId: id,
      responseViewerData: state.responseByTabId[id] ?? null,
    })),

  updateTab: (id, data) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id ? { ...t, ...data, unsavedChanges: true } : t
      ),
    })),

  markUnsaved: (id, value) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id ? { ...t, unsavedChanges: value } : t
      ),
    })),

  openRequestTab: (req) =>
    set((state) => {
      const existing = state.tabs.find((t) => t.requestId === req.id);
      if (existing) {
        return {
          activeTabId: existing.id,
          responseViewerData: state.responseByTabId[existing.id] ?? null,
        };
      }

      const newTab: RequestTab = {
        id: nanoid(),
        title: req.name || "Untitled",
        method: req.method,
        url: req.url,
        body: toEditorString(req.body),
        headers: toEditorString(req.headers),
        parameters: toEditorString(req.parameters),
        requestId: req.id,
        collectionId: req.collectionId,
        workspaceId: req.workspaceId,
        unsavedChanges: false,
      };

      return {
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
        responseViewerData: null,
      };
    }),

  /**
   * Links a tab to the row it was just saved as. The tab keeps its own client
   * id: overwriting it with the database id used to leave `requestId` unset, so
   * sending a freshly saved request failed until the page was reloaded.
   */
  updateTabFromSavedRequest: (tabId, savedRequest) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId
          ? {
              ...t,
              title: savedRequest.name,
              method: savedRequest.method,
              url: savedRequest.url,
              body: toEditorString(savedRequest.body),
              headers: toEditorString(savedRequest.headers),
              parameters: toEditorString(savedRequest.parameters),
              requestId: savedRequest.id,
              collectionId: savedRequest.collectionId ?? t.collectionId,
              unsavedChanges: false,
            }
          : t
      ),
    })),
}));

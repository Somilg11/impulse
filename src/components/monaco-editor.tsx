"use client";

import dynamic from "next/dynamic";
import type { EditorProps, OnMount } from "@monaco-editor/react";

/**
 * The single Monaco entry point for the app.
 *
 * Every editor goes through this so the loader is pointed at our self-hosted
 * copy (see scripts/copy-monaco.mjs) exactly once. Importing
 * `@monaco-editor/react` directly falls back to its default CDN
 * (cdn.jsdelivr.net), which the Content-Security-Policy blocks - the symptom is
 * "Monaco initialization: error: Event", a bare load failure with no detail.
 *
 * Loaded dynamically with `ssr: false`: Monaco touches `window` on import, and
 * keeping it out of the server bundle also keeps it out of the initial payload.
 */
const MonacoEditor = dynamic(
  async () => {
    const mod = await import("@monaco-editor/react");

    // Must run before the first editor mounts.
    mod.loader.config({ paths: { vs: "/monaco/vs" } });

    return mod.default;
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-canvas">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-blue-400" />
      </div>
    ),
  }
);

export default MonacoEditor;
export type { EditorProps, OnMount };

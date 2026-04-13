"use client";

import { useRequestPlaygroundStore } from "../store/useRequestStore";
import RequestBar from "./request-bar";
import RequestEditorArea from "./request-editor-area";
import ResponseViewer from "./response-viewer";


export default function RequestEditor() {
  const { tabs, activeTabId, updateTab, responseViewerData

  } = useRequestPlaygroundStore();
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  if (!activeTab) return null;

  return (
    <div className="flex flex-col items-stretch py-3 px-3 md:py-4 md:px-4 gap-3 md:gap-4">
      <RequestBar tab={activeTab} updateTab={updateTab} />

      <RequestEditorArea tab={activeTab} updateTab={updateTab} />

      {responseViewerData &&
        <ResponseViewer responseData={responseViewerData} />
      }
    </div>
  );
}
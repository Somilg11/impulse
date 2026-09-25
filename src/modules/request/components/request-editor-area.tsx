import React from "react";
import { RequestTab } from "../store/useRequestStore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import KeyValueFormEditor from "./key-value-form";
import BodyEditor from "./body-editor";
import AuthEditor from "./auth-editor";
import TestsEditor from "./tests-editor";
import { parseAssertions } from "@/lib/assertions";
import { toast } from "sonner";
import { parseAuth, describeAuth } from "@/lib/auth-schemes";
import type { BodyType } from "@/lib/body-types";
import { toKeyValueMap } from "@/lib/http";

/** A count beside a segment label, so state is visible without opening it. */
const Count = ({ n }: { n: number }) => (
  <span className="ml-1 rounded-full bg-white/[0.12] px-1.5 text-[10px] font-medium leading-[15px] text-zinc-300 tabular">
    {n}
  </span>
);

/** Used where a count would be meaningless - the tab is either set or not. */
const Dot = () => (
  <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-brand" />
);

interface Props {
  tab: RequestTab;
  updateTab: (id: string, data: Partial<RequestTab>) => void;
}

const RequestEditorArea = ({ tab, updateTab }: Props) => {
  

  const parseKeyValueData = (jsonString?: string) => {
    if (!jsonString) return [];
    try {
      return JSON.parse(jsonString);
    } catch {
      return [];
    }
  };


  const getHeadersData = () => {
    const parsed = parseKeyValueData(tab.headers);
    return parsed.length > 0 ? parsed : [{ key: "", value: "", enabled: true }];
  };


  const getParametersData = () => {
    const parsed = parseKeyValueData(tab.parameters);
    return parsed.length > 0 ? parsed : [{ key: "", value: "", enabled: true }];
  };

  const getBodyData = () => {
    return {
      contentType: 'application/json' as const,
      body: tab.body || ''
    };
  };

  const handleHeadersChange = (data: { key: string; value: string; enabled?: boolean }[]) => {
 
    const filteredHeaders = data.filter((item) => 
      item.enabled !== false && (item.key.trim() || item.value.trim())
    );
    updateTab(tab.id, { headers: JSON.stringify(filteredHeaders) });
    toast.success("Headers updated successfully")
  };

  const handleParametersChange = (data: { key: string; value: string; enabled?: boolean }[]) => {
  
    const filteredParams = data.filter((item) => 
      item.enabled !== false && (item.key.trim() || item.value.trim())
    );
    updateTab(tab.id, { parameters: JSON.stringify(filteredParams) });
    toast.success("Parameters updated successfully")
  };

  const handleBodyChange = (data: { contentType: string; body?: string }) => {
    updateTab(tab.id, { body: data.body || '' });
    toast.success("Body updated successfully")
  };

  const handleBodyTypeChange = (bodyType: BodyType) => {
    updateTab(tab.id, { bodyType });
  };

  const handleAuthChange = (serialized: string) => {
    updateTab(tab.id, { auth: serialized });
  };

  const authSummary = describeAuth(parseAuth(tab.auth));
  const paramCount = Object.keys(toKeyValueMap(tab.parameters)).length;
  const headerCount = Object.keys(toKeyValueMap(tab.headers)).length;
  const hasBody =
    (tab.bodyType ?? "JSON") !== "NONE" && Boolean((tab.body ?? "").trim());
  const assertionCount = parseAssertions(tab.tests).filter((a) => a.enabled !== false).length;

  const handleTestsChange = (serialized: string) => {
    updateTab(tab.id, { tests: serialized });
  };

  return (
    <Tabs
      defaultValue="parameters"
      className="flex h-full min-h-0 w-full flex-col bg-canvas"
    >
      {/* Underline-style tabs matching the reference */}
      <div className="shrink-0 border-b border-line bg-surface px-2.5 py-2">
        <TabsList>
          <TabsTrigger 
              value="parameters" 
              >
            Params
            {paramCount > 0 && <Count n={paramCount} />}
          </TabsTrigger>
          <TabsTrigger 
              value="body" 
              >
            Body
            {hasBody && <Dot />}
          </TabsTrigger>
          <TabsTrigger 
              value="headers" 
              >
            Headers
            {headerCount > 0 && <Count n={headerCount} />}
          </TabsTrigger>
          <TabsTrigger 
              value="auth" 
              >
            Auth
            {authSummary !== "No auth" && <Dot />}
          </TabsTrigger>
          <TabsTrigger
              value="tests"
              >
            Tests
            {assertionCount > 0 && <Count n={assertionCount} />}
          </TabsTrigger>
        </TabsList>
      </div>
      
      {/* Tab content */}
      <div className="min-h-0 flex-1 overflow-auto">
        <TabsContent value="parameters" className="mt-0 p-3 focus-visible:outline-none">
            <KeyValueFormEditor
            initialData={getParametersData()}
            onSubmit={handleParametersChange}
            placeholder={{
                key: "Parameter Name",
                value: "Parameter Value",
                description: "URL Parameter",
            }}
            />
        </TabsContent>
        
        <TabsContent value="body" className="mt-0 focus-visible:outline-none">
            <BodyEditor
            initialData={getBodyData()}
            bodyType={tab.bodyType ?? "JSON"}
            onBodyTypeChange={handleBodyTypeChange}
            onSubmit={handleBodyChange}
            />
        </TabsContent>

        <TabsContent value="headers" className="mt-0 p-3 focus-visible:outline-none">
            <KeyValueFormEditor
            initialData={getHeadersData()}
            onSubmit={handleHeadersChange}
            placeholder={{
                key: "Header Name",
                value: "Header Value",
                description: "HTTP Header",
            }}
            />
        </TabsContent>
        
        <TabsContent value="auth" className="mt-0 p-4 focus-visible:outline-none">
            <AuthEditor value={tab.auth} onChange={handleAuthChange} />
        </TabsContent>

        <TabsContent value="tests" className="mt-0 p-4 focus-visible:outline-none">
            <TestsEditor value={tab.tests} onChange={handleTestsChange} />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default RequestEditorArea;
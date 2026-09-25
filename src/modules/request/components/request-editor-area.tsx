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
      <div className="shrink-0 border-b border-line bg-surface px-1">
        <TabsList className="bg-transparent h-9 p-0 gap-0">
          <TabsTrigger 
              value="parameters" 
              className="h-9 rounded-none border-b-2 border-transparent bg-transparent px-3.5 text-[12.5px] font-medium text-zinc-500 transition-colors data-[state=active]:border-brand data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            Params
          </TabsTrigger>
          <TabsTrigger 
              value="body" 
              className="h-9 rounded-none border-b-2 border-transparent bg-transparent px-3.5 text-[12.5px] font-medium text-zinc-500 transition-colors data-[state=active]:border-brand data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            Body
          </TabsTrigger>
          <TabsTrigger 
              value="headers" 
              className="h-9 rounded-none border-b-2 border-transparent bg-transparent px-3.5 text-[12.5px] font-medium text-zinc-500 transition-colors data-[state=active]:border-brand data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            Headers
          </TabsTrigger>
          <TabsTrigger 
              value="auth" 
              className="h-9 rounded-none border-b-2 border-transparent bg-transparent px-3.5 text-[12.5px] font-medium text-zinc-500 transition-colors data-[state=active]:border-brand data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            Authorization
            {authSummary !== "No auth" && (
              <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-brand" />
            )}
          </TabsTrigger>
          <TabsTrigger
              value="tests"
              className="h-9 rounded-none border-b-2 border-transparent bg-transparent px-3.5 text-[12.5px] font-medium text-zinc-500 transition-colors data-[state=active]:border-brand data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            Tests
            {assertionCount > 0 && (
              <span className="ml-1.5 text-[10px] text-zinc-500">{assertionCount}</span>
            )}
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
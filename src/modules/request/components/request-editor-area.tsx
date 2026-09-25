import React from "react";
import { RequestTab } from "../store/useRequestStore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import KeyValueFormEditor from "./key-value-form";
import BodyEditor from "./body-editor";
import AuthEditor from "./auth-editor";
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

  return (
    <Tabs
      defaultValue="parameters"
      className="w-full border border-[#1e2330] rounded-lg overflow-hidden bg-[#0e1117]"
    >
      {/* Underline-style tabs matching the reference */}
      <div className="border-b border-[#1e2330] px-1">
        <TabsList className="bg-transparent h-9 p-0 gap-0">
          <TabsTrigger 
              value="parameters" 
              className="rounded-none bg-transparent text-xs font-medium text-zinc-500 data-[state=active]:text-white data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-blue-500 px-4 h-9 transition-all"
          >
            Params
          </TabsTrigger>
          <TabsTrigger 
              value="body" 
              className="rounded-none bg-transparent text-xs font-medium text-zinc-500 data-[state=active]:text-white data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-blue-500 px-4 h-9 transition-all"
          >
            Body
          </TabsTrigger>
          <TabsTrigger 
              value="headers" 
              className="rounded-none bg-transparent text-xs font-medium text-zinc-500 data-[state=active]:text-white data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-blue-500 px-4 h-9 transition-all"
          >
            Headers
          </TabsTrigger>
          <TabsTrigger 
              value="auth" 
              className="rounded-none bg-transparent text-xs font-medium text-zinc-500 data-[state=active]:text-white data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-blue-500 px-4 h-9 transition-all"
          >
            Authorization
            {authSummary !== "No auth" && (
              <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" />
            )}
          </TabsTrigger>
        </TabsList>
      </div>
      
      {/* Tab content */}
      <div className="min-h-[250px] md:min-h-[350px]">
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
      </div>
    </Tabs>
  );
};

export default RequestEditorArea;
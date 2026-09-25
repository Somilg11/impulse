"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import MonacoEditor from "@/components/monaco-editor";
import { CODE_TARGETS, generateCode, type CodeTarget } from "@/lib/codegen";
import { composeRequest } from "@/lib/request-pipeline";
import { useActiveVariables } from "@/modules/environments/hooks/use-active-variables";
import type { RequestTab } from "../store/useRequestStore";

interface Props {
  tab: RequestTab;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Shows the current request as runnable code.
 *
 * Generated from the composed request - variables resolved, auth applied - so
 * the snippet is exactly what Send would put on the wire.
 */
const CodeDialog = ({ tab, isOpen, onClose }: Props) => {
  const [target, setTarget] = useState<CodeTarget>("curl");
  const [copied, setCopied] = useState(false);
  const { variables, activeEnvironmentName } = useActiveVariables();

  const { snippet, language, missingVariables } = useMemo(() => {
    const { request, missingVariables } = composeRequest(
      {
        method: tab.method,
        url: tab.url,
        headers: tab.headers,
        parameters: tab.parameters,
        body: tab.body,
        bodyType: tab.bodyType,
        auth: tab.auth,
      },
      variables
    );

    return {
      snippet: generateCode(request, target),
      language: CODE_TARGETS.find((t) => t.value === target)?.language ?? "shell",
      missingVariables,
    };
  }, [tab, target, variables]);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(snippet)
      .then(() => {
        setCopied(true);
        toast.success("Snippet copied");
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => toast.error("Could not copy"));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-canvas border-line text-zinc-200 max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-white">Code</DialogTitle>
          <DialogDescription className="text-zinc-500 text-xs">
            {activeEnvironmentName
              ? `Variables resolved from "${activeEnvironmentName}".`
              : "No environment selected, so any {{variables}} are left unresolved."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-1.5">
          {CODE_TARGETS.map((option) => (
            <button
              key={option.value}
              onClick={() => setTarget(option.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                target === option.value
                  ? "bg-line text-white border-brand/40"
                  : "bg-transparent text-zinc-500 border-line hover:text-zinc-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {missingVariables.length > 0 && (
          <p className="text-[11px] text-amber-400/90">
            Unresolved: {missingVariables.map((v) => `{{${v}}}`).join(", ")}
          </p>
        )}

        <div className="relative border border-line rounded-lg overflow-hidden">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="absolute right-2 top-2 z-10 h-7 px-2 text-xs text-zinc-400 hover:text-white bg-surface-raised/80 backdrop-blur-sm"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          <MonacoEditor
            height="360px"
            value={snippet}
            language={language}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 13,
              wordWrap: "on",
              padding: { top: 12, bottom: 12 },
              lineNumbers: "off",
              renderLineHighlight: "none",
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CodeDialog;

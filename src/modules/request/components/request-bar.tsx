"use client";

import { RequestTab, useRequestPlaygroundStore } from '../store/useRequestStore'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Code2, Globe, Loader, Server, Zap } from 'lucide-react'
import { useState } from 'react'
import { looksLikeCurl, parseCurl } from '@/lib/curl'
import CodeDialog from './code-dialog'
import { Hint } from '@/components/ui/hint'
import { useSendRequest } from '../hooks/request'
import { toast } from 'sonner'
import { METHODS } from '@/lib/http'
import { methodText } from '@/lib/http-display'
import type { SendMode } from '../lib/send-request'

interface Props {
    tab: RequestTab,
    updateTab: (id: string, data: Partial<RequestTab>) => void;
}

const SEND_MODES: { value: SendMode; label: string; hint: string }[] = [
  { value: "auto", label: "Auto", hint: "Browser first, proxy if CORS blocks it" },
  { value: "browser", label: "Browser", hint: "Runs on your machine - reaches localhost" },
  { value: "proxy", label: "Proxy", hint: "Runs on the server - ignores CORS, public hosts only" },
];

const RequestBar = ({ tab, updateTab }: Props) => {
  const sendMode = useRequestPlaygroundStore((s) => s.sendMode);
  const setSendMode = useRequestPlaygroundStore((s) => s.setSendMode);

  const { mutateAsync, isPending } = useSendRequest();
  const [codeOpen, setCodeOpen] = useState(false);

  /**
   * Pasting a curl command fills the whole request instead of dumping the
   * command into the URL field. Browser devtools and API docs both hand you
   * curl, so this is the fastest path in.
   */
  const onUrlPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData('text');
    if (!looksLikeCurl(text)) return;

    const parsed = parseCurl(text);
    if (!parsed) return;

    event.preventDefault();
    updateTab(tab.id, {
      method: parsed.method,
      url: parsed.url,
      headers: JSON.stringify(parsed.headers),
      parameters: JSON.stringify(parsed.parameters),
      body: parsed.body ?? '',
      bodyType: parsed.bodyType,
      ...(parsed.auth ? { auth: JSON.stringify(parsed.auth) } : {}),
    });
    toast.success('Imported from cURL');
  };

  const onSendRequest = async () => {
    try {
      const { result, missingVariables } = await mutateAsync(tab);

      if (missingVariables.length) {
        toast.warning(
          `Unresolved: ${missingVariables.map((v) => `{{${v}}}`).join(", ")}`,
          { description: "Select an environment that defines them." }
        );
      }

      if (result.error) {
        toast.error(result.error);
      } else if (result.ok) {
        toast.success(`${result.status} in ${result.durationMs} ms`);
      } else {
        toast.warning(`${result.status} ${result.statusText}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send request.');
    }
  }

  return (
    <div className="flex w-full items-center gap-2">
      {/* One continuous control: method, URL, and send read as a single field
          with segments, the way a browser address bar does, rather than three
          adjacent controls. */}
      <div className="group flex h-9 min-w-0 flex-1 items-center rounded-[10px] border border-line bg-surface-raised transition-colors duration-[--duration-fast] ease-[--ease-ios] focus-within:border-brand/60">
        {/* Method */}
        <Select
          value={tab.method}
          onValueChange={(value) => updateTab(tab.id, { method: value })}
        >
          <SelectTrigger
            className={`h-7 w-auto shrink-0 gap-1 rounded-[7px] border-0 bg-transparent pl-2.5 pr-1.5 ml-[3px] text-[12px] font-semibold tracking-[0.02em] shadow-none transition-colors duration-[--duration-fast] hover:bg-white/[0.06] focus:ring-0 ${methodText(tab.method)}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start" className="min-w-[7rem]">
            <SelectGroup>
              {METHODS.map((method) => (
                <SelectItem
                  key={method}
                  value={method}
                  className={`font-semibold ${methodText(method)}`}
                >
                  {method}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <span className="h-4 w-px shrink-0 bg-line" aria-hidden />

        {/* URL */}
        <Input
          value={tab.url || ""}
          onPaste={onUrlPaste}
          onChange={(e) => updateTab(tab.id, { url: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && tab.url && !isPending) onSendRequest();
          }}
          placeholder="Enter a URL, or paste a cURL command"
          spellCheck={false}
          className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-2.5 font-mono text-[13px] text-zinc-100 placeholder:font-sans placeholder:text-zinc-600 focus-visible:border-0"
        />

        {/* Code snippet - a quiet affordance inside the field, not a segment */}
        <Hint label="View as code" side="bottom">
          <button
            type="button"
            onClick={() => setCodeOpen(true)}
            disabled={!tab.url}
            className="mr-[3px] flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-zinc-600 transition-colors duration-[--duration-fast] hover:bg-white/[0.06] hover:text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Code2 className="h-3.5 w-3.5" />
          </button>
        </Hint>
      </div>

      {/* Send sits outside the field, as the one primary action on screen */}
      <Button
        type="button"
        onClick={onSendRequest}
        disabled={isPending || !tab.url}
        className="h-9 w-[84px] shrink-0 gap-1.5 rounded-[10px] bg-brand text-[13px] font-medium text-white transition-colors duration-[--duration-fast] ease-[--ease-ios] hover:bg-brand-hover active:scale-[0.97] disabled:opacity-40"
      >
        {isPending ? <Loader className="size-3.5 animate-spin" /> : "Send"}
      </Button>

      {/* Execution mode, as a quiet trailing control rather than a labelled row */}
      <Select value={sendMode} onValueChange={(value) => setSendMode(value as SendMode)}>
        <SelectTrigger
          className="h-9 w-auto shrink-0 gap-1.5 rounded-[10px] border-line bg-surface-raised px-2.5 text-[12px] text-zinc-400 focus:ring-0"
          title={SEND_MODES.find((m) => m.value === sendMode)?.hint}
        >
          {sendMode === "proxy" ? (
            <Server className="h-3.5 w-3.5" />
          ) : sendMode === "browser" ? (
            <Globe className="h-3.5 w-3.5" />
          ) : (
            <Zap className="h-3.5 w-3.5" />
          )}
          <span className="hidden capitalize sm:inline">{sendMode}</span>
        </SelectTrigger>
        <SelectContent align="end" className="min-w-[15rem]">
          {SEND_MODES.map((mode) => (
            <SelectItem key={mode.value} value={mode.value}>
              <div className="flex flex-col gap-0.5 py-0.5">
                <span className="text-[13px] text-zinc-200">{mode.label}</span>
                <span className="text-[11px] leading-snug text-zinc-500">{mode.hint}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <CodeDialog tab={tab} isOpen={codeOpen} onClose={() => setCodeOpen(false)} />
    </div>
  )
}

export default RequestBar

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
import { Code2, Loader } from 'lucide-react'
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
    <div className='flex flex-col gap-2 w-full'>
      <div className='flex w-full items-center overflow-hidden rounded-xl border border-line bg-surface-raised focus-within:border-line-strong transition-colors'>
        {/* Method selector */}
        <Select
          value={tab.method}
          onValueChange={(value) => updateTab(tab.id, { method: value })}
        >
          <SelectTrigger className={`w-auto min-w-[80px] sm:min-w-[90px] bg-transparent border-0 border-r border-line rounded-none h-10 px-3 font-bold text-sm tracking-wide shrink-0 focus:ring-0 ${methodText(tab.method)}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface-raised border border-line text-zinc-300 rounded-lg shadow-xl">
            <SelectGroup>
              {METHODS.map((method) => (
                <SelectItem
                  key={method}
                  value={method}
                  className={`${methodText(method)} font-bold hover:bg-line`}
                >
                  {method}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* URL input */}
        <Input
          value={tab.url || ''}
          onPaste={onUrlPaste}
          onChange={(e) => updateTab(tab.id, { url: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && tab.url && !isPending) onSendRequest();
          }}
          placeholder="https://api.example.com/users — or paste a cURL command"
          className="flex-1 min-w-0 bg-transparent border-0 rounded-none h-10 px-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:ring-offset-0"
        />

        {/* Code snippet */}
        <Hint label="View as code" side="bottom">
          <button
            type="button"
            onClick={() => setCodeOpen(true)}
            disabled={!tab.url}
            className="h-10 px-3 border-l border-line text-zinc-500 hover:text-zinc-200 disabled:opacity-40 transition-colors shrink-0"
          >
            <Code2 className="w-4 h-4" />
          </button>
        </Hint>

        {/* Send button */}
        <Button
          type='button'
          onClick={onSendRequest}
          disabled={isPending || !tab.url}
          className="h-10 shrink-0 rounded-none bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-hover sm:px-6"
        >
          {isPending ? <Loader className="animate-spin size-4" /> : "Send"}
        </Button>
      </div>

      {/* Execution mode */}
      <div className='flex items-center gap-2 text-[11px] text-zinc-500'>
        <span className='uppercase tracking-widest font-semibold'>Send via</span>
        <Select value={sendMode} onValueChange={(value) => setSendMode(value as SendMode)}>
          <SelectTrigger className="h-7 w-auto min-w-[110px] bg-surface-raised border border-line text-xs text-zinc-300 focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface-raised border border-line text-zinc-300">
            {SEND_MODES.map((mode) => (
              <SelectItem key={mode.value} value={mode.value} className="text-xs hover:bg-line">
                {mode.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className='hidden sm:inline text-zinc-600'>
          {SEND_MODES.find((m) => m.value === sendMode)?.hint}
        </span>
      </div>

      <CodeDialog tab={tab} isOpen={codeOpen} onClose={() => setCodeOpen(false)} />
    </div>
  )
}

export default RequestBar

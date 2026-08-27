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
import { Loader } from 'lucide-react'
import { useSendRequest } from '../hooks/request'
import { toast } from 'sonner'
import { METHODS } from '@/lib/http'
import type { SendMode } from '../lib/send-request'

interface Props {
    tab: RequestTab,
    updateTab: (id: string, data: Partial<RequestTab>) => void;
}

const methodColorMap: Record<string, string> = {
  GET: "text-green-400",
  POST: "text-amber-400",
  PUT: "text-blue-400",
  PATCH: "text-purple-400",
  DELETE: "text-red-400",
};

const SEND_MODES: { value: SendMode; label: string; hint: string }[] = [
  { value: "auto", label: "Auto", hint: "Browser first, proxy if CORS blocks it" },
  { value: "browser", label: "Browser", hint: "Runs on your machine - reaches localhost" },
  { value: "proxy", label: "Proxy", hint: "Runs on the server - ignores CORS, public hosts only" },
];

const RequestBar = ({ tab, updateTab }: Props) => {
  const sendMode = useRequestPlaygroundStore((s) => s.sendMode);
  const setSendMode = useRequestPlaygroundStore((s) => s.setSendMode);

  const { mutateAsync, isPending } = useSendRequest();

  const onSendRequest = async () => {
    try {
      const { result } = await mutateAsync(tab);

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
      <div className='flex items-center gap-0 bg-[#161b26] border border-[#1e2330] rounded-lg w-full overflow-hidden'>
        {/* Method selector */}
        <Select
          value={tab.method}
          onValueChange={(value) => updateTab(tab.id, { method: value })}
        >
          <SelectTrigger className={`w-auto min-w-[80px] sm:min-w-[90px] bg-transparent border-0 border-r border-[#1e2330] rounded-none h-10 px-3 font-bold text-sm tracking-wide shrink-0 focus:ring-0 ${methodColorMap[tab.method] || "text-zinc-400"}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#161b26] border border-[#1e2330] text-zinc-300 rounded-lg shadow-xl">
            <SelectGroup>
              {METHODS.map((method) => (
                <SelectItem
                  key={method}
                  value={method}
                  className={`${methodColorMap[method]} font-bold hover:bg-[#1e2330]`}
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
          onChange={(e) => updateTab(tab.id, { url: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && tab.url && !isPending) onSendRequest();
          }}
          placeholder="https://api.example.com/users"
          className="flex-1 min-w-0 bg-transparent border-0 rounded-none h-10 px-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:ring-offset-0"
        />

        {/* Send button */}
        <Button
          type='button'
          onClick={onSendRequest}
          disabled={isPending || !tab.url}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-none rounded-r-lg px-5 sm:px-6 h-10 transition-colors shrink-0 text-sm"
        >
          {isPending ? <Loader className="animate-spin size-4" /> : "Send"}
        </Button>
      </div>

      {/* Execution mode */}
      <div className='flex items-center gap-2 text-[11px] text-zinc-500'>
        <span className='uppercase tracking-widest font-semibold'>Send via</span>
        <Select value={sendMode} onValueChange={(value) => setSendMode(value as SendMode)}>
          <SelectTrigger className="h-7 w-auto min-w-[110px] bg-[#161b26] border border-[#1e2330] text-xs text-zinc-300 focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#161b26] border border-[#1e2330] text-zinc-300">
            {SEND_MODES.map((mode) => (
              <SelectItem key={mode.value} value={mode.value} className="text-xs hover:bg-[#1e2330]">
                {mode.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className='hidden sm:inline text-zinc-600'>
          {SEND_MODES.find((m) => m.value === sendMode)?.hint}
        </span>
      </div>
    </div>
  )
}

export default RequestBar

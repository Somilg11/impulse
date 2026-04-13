import { RequestTab } from '../store/useRequestStore'

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
import { Loader, Send } from 'lucide-react'
import { useRunRequest } from '../hooks/request'
import { toast } from 'sonner'

interface Props {
    tab: RequestTab,
    updateTab: (id: string, data: Partial<RequestTab>) => void;
}

const methodColorMap: Record<string, string> = {
  GET: "text-green-400",
  POST: "text-amber-400",
  PUT: "text-blue-400",
  DELETE: "text-red-400",
};

const RequestBar = ({ tab, updateTab }: Props) => {

  const {mutateAsync , isPending , isError} = useRunRequest(tab?.requestId!);

  const onSendRequest = async () => {
    try {
      const res = await mutateAsync();
      toast.success('Request sent successfully!');
    } catch (error) {
      toast.error('Failed to send request.');
    }
  }

  return (
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
            <SelectItem value="GET" className="text-green-400 font-bold hover:bg-[#1e2330]">GET</SelectItem>
            <SelectItem value="POST" className="text-amber-400 font-bold hover:bg-[#1e2330]">POST</SelectItem>
            <SelectItem value="PUT" className="text-blue-400 font-bold hover:bg-[#1e2330]">PUT</SelectItem>
            <SelectItem value="DELETE" className="text-red-400 font-bold hover:bg-[#1e2330]">DELETE</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      
      {/* URL input */}
      <Input 
        value={tab.url || ''} 
        onChange={(e) => updateTab(tab.id, { url: e.target.value })}
        placeholder="Enter or paste a URL or cURL command"
        className="flex-1 min-w-0 bg-transparent border-0 rounded-none h-10 px-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      
      {/* Send button */}
      <Button 
        type='submit'
        onClick={onSendRequest}
        disabled={isPending || !tab.url}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-none rounded-r-lg px-5 sm:px-6 h-10 transition-colors shrink-0 text-sm"
      >
        {isPending ? <Loader className="animate-spin size-4" /> : "Send"}
      </Button>
    </div>
  )
}

export default RequestBar
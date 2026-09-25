import React, { useState, useEffect, useRef } from 'react'
import { useWsStore } from '../hooks/useWs'
import { ChevronUp, ChevronDown, Trash2, Copy, Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const RealtimeClientServerLogsTable = () => {
  const { messages, clearMessages } = useWsStore()
  const [selectedMessageIndex, setSelectedMessageIndex] = useState<number>(-1)
  const tableRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])

  const scrollToBottom = () => {
    if (tableRef.current) {
      tableRef.current.scrollTop = tableRef.current.scrollHeight
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && selectedMessageIndex === -1) {
      scrollToBottom()
    }
  }, [messages.length])

  // Update row refs array when messages change
  useEffect(() => {
    rowRefs.current = rowRefs.current.slice(0, messages.length)
  }, [messages.length])


  const scrollToRow = (index: number) => {
    const row = rowRefs.current[index]
    if (row && tableRef.current) {
      const containerRect = tableRef.current.getBoundingClientRect()
      const rowRect = row.getBoundingClientRect()
      
      if (rowRect.top < containerRect.top || rowRect.bottom > containerRect.bottom) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  const handleNavigateUp = () => {
    if (messages.length === 0) return
    
    const newIndex = selectedMessageIndex === -1 
      ? messages.length - 1 
      : Math.max(0, selectedMessageIndex - 1)
    
    setSelectedMessageIndex(newIndex)
    scrollToRow(newIndex)
  }

  const handleNavigateDown = () => {
    if (messages.length === 0) return
    
    const newIndex = selectedMessageIndex === -1 
      ? 0 
      : selectedMessageIndex + 1 < messages.length 
        ? selectedMessageIndex + 1 
        : -1

    setSelectedMessageIndex(newIndex)
    
    if (newIndex === -1) {
      scrollToBottom()
    } else {
      scrollToRow(newIndex)
    }
  }

  const handleRowClick = (index: number) => {
    setSelectedMessageIndex(selectedMessageIndex === index ? -1 : index)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard')
    }).catch(err => {
      console.error('Failed to copy: ', err)
    })
  }

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    }).format(timestamp)
  }

  const formatMessageData = (data: unknown) => {
    if (typeof data === 'string') {
      try {
        return JSON.stringify(JSON.parse(data), null, 2)
      } catch {
        return data
      }
    }
    return JSON.stringify(data, null, 2)
  }

  const getMessageTypeIcon = (type: 'sent' | 'received') => {
    return type === 'sent' 
      ? <ArrowUpRight size={16} className="text-blue-400" />
      : <ArrowDownLeft size={16} className="text-green-400" />
  }

 

  return (
    <div className="flex flex-col h-[400px] bg-surface-raised border border-line rounded-xl overflow-hidden shadow-sm mt-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-surface-hover">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-zinc-800 rounded-md">
            <Clock size={16} className="text-zinc-400" />
          </div>
          <h3 className="text-sm font-bold text-zinc-100 tracking-tight">Message Logs</h3>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-1 bg-canvas px-2 py-0.5 rounded-full border border-line">
            {messages.length}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          {/* Navigation arrows */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNavigateUp}
            disabled={messages.length === 0}
            className="h-8 w-8 p-0 text-zinc-500 hover:text-white hover:bg-line-strong disabled:opacity-30"
            title="Navigate up (previous message)"
          >
            <ChevronUp size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNavigateDown}
            disabled={messages.length === 0}
            className="h-8 w-8 p-0 text-zinc-500 hover:text-white hover:bg-line-strong disabled:opacity-30"
            title="Navigate down (next message)"
          >
            <ChevronDown size={16} />
          </Button>

          <div className="w-px h-4 bg-line mx-1.5" />

          {/* Clear messages */}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            disabled={messages.length === 0}
            className="h-8 w-8 p-0 text-zinc-500 hover:text-red-400 hover:bg-line-strong disabled:opacity-30"
            title="Clear all messages"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {/* Messages Table */}
      <div ref={tableRef} className="flex-1 overflow-auto bg-canvas/50 scrollbar-thin scrollbar-thumb-line">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-500 gap-3">
            <div className="p-4 rounded-full bg-surface-hover border border-line">
              <ArrowDownLeft size={24} className="opacity-20" />
            </div>
            <p className="text-xs font-medium tracking-tight">Listening for messages...</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {messages.map((message, index) => (
              <div
                key={message.id}
                ref={(el) => { rowRefs.current[index] = el; }}
                className={`
                  relative border border-line rounded-lg p-3 cursor-pointer transition-all duration-200
                  ${selectedMessageIndex === index 
                    ? 'bg-surface-hover border-blue-500/50 shadow-lg shadow-blue-500/5' 
                    : 'bg-surface-raised hover:border-zinc-700/50'
                  }
                `}
                onClick={() => handleRowClick(index)}
              >
                {/* Visual indicator for message type */}
                <div className={`absolute top-0 left-0 bottom-0 w-1 rounded-l-lg ${
                    message.type === 'sent' ? 'bg-blue-500/50' : 'bg-green-500/50'
                }`} />

                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${
                        message.type === 'sent' ? 'bg-blue-500/10' : 'bg-green-500/10'
                    }`}>
                      {getMessageTypeIcon(message.type)}
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${
                      message.type === 'sent' ? 'text-blue-400' : 'text-green-400'
                    }`}>
                      {message.type}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono mt-0.5">
                      REQ-{index + 1}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {formatTimestamp(message.timestamp)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(message.raw || formatMessageData(message.data))
                        toast.success('Message copied')
                      }}
                      className="h-6 w-6 p-0 text-zinc-500 hover:text-zinc-200"
                      title="Copy message"
                    >
                      <Copy size={12} />
                    </Button>
                  </div>
                </div>

                <div className="text-[11px] leading-relaxed">
                  <div className={`font-mono rounded-md p-2.5 overflow-x-auto ${
                      selectedMessageIndex === index ? 'bg-canvas' : 'bg-canvas/50'
                  }`}>
                    {selectedMessageIndex === index ? (
                       <pre className="text-zinc-300 whitespace-pre-wrap break-words selection:bg-blue-500/30">
                        {formatMessageData(message.data)}
                      </pre>
                    ) : (
                      <div className="text-zinc-400 truncate">
                        {typeof message.data === 'string' 
                          ? message.data 
                          : JSON.stringify(message.data)
                        }
                      </div>
                    )}
                  </div>
                </div>

                {selectedMessageIndex === index && message.raw && message.raw !== formatMessageData(message.data) && (
                  <div className="mt-3 text-[11px]">
                    <div className="text-zinc-500 mb-1.5 font-bold uppercase tracking-tighter text-[9px]">Raw Data</div>
                    <div className="font-mono bg-canvas border border-line rounded-md p-2.5 overflow-x-auto">
                      <pre className="text-zinc-500 whitespace-pre-wrap break-words">
                        {message.raw}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with selection info */}
      {messages.length > 0 && (
        <div className="px-4 py-2 border-t border-line bg-surface-hover text-[10px] text-zinc-500 font-medium flex items-center justify-between">
          <div>
            {selectedMessageIndex >= 0 ? (
                <span>Entry {selectedMessageIndex + 1} of {messages.length}</span>
            ) : (
                <span>Showing {messages.length} entries</span>
            )}
          </div>
          <div className="flex gap-3">
             <span className="hidden sm:inline">↑↓ to navigate</span>
             <span>Press row to expand</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default RealtimeClientServerLogsTable
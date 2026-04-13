import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Copy, Trash2, RefreshCw } from 'lucide-react'
import { useWsStore } from '../hooks/useWs'
import Editor from '@monaco-editor/react'
import { toast } from 'sonner'
import RealtimeClientServerLogsTable from './realtime-client-server-logs-table'

const RealtimeMessageEditor = () => {
  const { 
    send, 
    status,
    isConnected, 
    draftMessage, 
    setDraftMessage, 
    messages 
  } = useWsStore()
  
  const [isSending, setIsSending] = useState(false)
  const [lastSent, setLastSent] = useState('')
  const editorRef = useRef(null)
  const monacoRef = useRef(null)

  useEffect(() => {
    if (!draftMessage) {
      const initial = '{\n  "type": "message",\n  "content": "Hello WebSocket!",\n  "timestamp": "' + new Date().toISOString() + '"\n}'
      setDraftMessage(initial)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSendMessage = useCallback(async () => {
    if (!status || status !== 'connected') {
      toast.info('WebSocket is not connected!')
      return
    }

    if (!draftMessage || !draftMessage.trim()) {
      toast.info('Please enter a message!')
      return
    }

    try {
      setIsSending(true)
      
      // Try to parse JSON to validate
      let messageToSend
      try {
        messageToSend = JSON.parse(draftMessage)

      } catch (e) {
        // If not valid JSON, send as string
        messageToSend = draftMessage
      }

      const success = send(messageToSend)
      if (success) {
        setLastSent(draftMessage)
        toast.success('Message sent successfully')
      } else {
        toast.error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Error sending message: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setIsSending(false)
    }
  }, [draftMessage, send, isConnected])

  // Initialize Monaco Editor
  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor
    monacoRef.current = monaco


    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [],
      enableSchemaRequest: true
    })

    // Set editor options
    editor.updateOptions({
      theme: 'vs-dark',
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      formatOnPaste: true,
      formatOnType: true
    })

    // Add keyboard shortcut for sending (Ctrl+Enter)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleSendMessage()
    })
  }, [handleSendMessage])

  const handleFormatJSON = useCallback(() => {
    try {
      const parsed = JSON.parse(draftMessage)
      const formatted = JSON.stringify(parsed, null, 2)
      setDraftMessage(formatted)
      if (editorRef.current) {
        // @ts-ignore
        editorRef.current.setValue(formatted)
      }
    } catch (error) {
      alert('Invalid JSON format')
    }
  }, [draftMessage, setDraftMessage])

  const handleCopyMessage = useCallback(() => {
    navigator.clipboard.writeText(draftMessage)
      .then(() => {
        console.log('Message copied to clipboard')
      })
      .catch(err => {
        console.error('Failed to copy message:', err)
      })
  }, [draftMessage])

  const handleClearMessage = useCallback(() => {
    const emptyMessage = '{\n  \n}'
    setDraftMessage(emptyMessage)
    if (editorRef.current) {
      // @ts-ignore
      editorRef.current.setValue(emptyMessage)
      // @ts-ignore
      editorRef.current.focus()
    }
  }, [setDraftMessage])

  

  return (
    <div className="flex flex-col space-y-4 bg-[#161b26] border border-[#1e2330] rounded-xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e2330] pb-3 mb-1">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-500/10 rounded-md">
            <Send size={16} className="text-blue-400" />
          </div>
          <h3 className="text-sm font-bold text-zinc-100 tracking-tight">Message Editor</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
            status === 'connected' 
              ? 'bg-green-500/5 border-green-500/20 text-green-500' 
              : 'bg-zinc-500/5 border-zinc-500/20 text-zinc-500'
          }`}>
            {status === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

    
      {/* Editor */}
      <div className="relative group">
        <div className="border border-[#1e2330] rounded-lg overflow-hidden bg-[#0e1117]">
          {/* Monaco Editor */}
          <Editor
            height="180px"
            language="json"
            theme="vs-dark"
            value={draftMessage}
            onChange={(value) => setDraftMessage(value || '')}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 13,
              fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              formatOnPaste: true,
              formatOnType: true,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              folding: true,
              lineNumbers: 'on',
              renderWhitespace: 'none',
              cursorStyle: 'line',
              contextmenu: true,
              mouseWheelZoom: false,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 3,
              padding: { top: 12, bottom: 12 }
            }}
            loading={
              <div className="w-full h-40 bg-[#0e1117] flex items-center justify-center">
                <div className="text-zinc-600 text-xs animate-pulse">Initializing Editor...</div>
              </div>
            }
          />
        </div>
        
        {/* Editor Actions */}
        <div className="absolute top-2 right-2 flex gap-1 opaque md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleFormatJSON}
            className="h-7 w-7 p-0 bg-[#1e2330] border border-[#1e2330] text-zinc-400 hover:text-white hover:bg-[#2a303c]"
            title="Format JSON"
          >
            <RefreshCw size={13} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopyMessage}
            className="h-7 w-7 p-0 bg-[#1e2330] border border-[#1e2330] text-zinc-400 hover:text-white hover:bg-[#2a303c]"
            title="Copy Message"
          >
            <Copy size={13} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleClearMessage}
            className="h-7 w-7 p-0 bg-[#1e2330] border border-[#1e2330] text-zinc-400 hover:text-red-400 hover:bg-[#2a303c]"
            title="Clear Editor"
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      {/* Send Button and Info */}
      <div className="flex items-center justify-between pt-1">
        <div className="text-[11px] text-zinc-500 font-medium">
          <span className="text-zinc-400 mr-2">⌘ + Enter</span> to send fast
        </div>
        <Button
          onClick={handleSendMessage}
          disabled={status !== 'connected' || isSending}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-9 px-6 shadow-lg shadow-blue-500/10 transition-all active:scale-95"
        >
          {isSending ? (
            <RefreshCw size={14} className="mr-2 animate-spin" />
          ) : (
            <Send size={14} className="mr-2" />
          )}
          {isSending ? 'Sending...' : 'Send'}
        </Button>
      </div>

      <RealtimeClientServerLogsTable />
    </div>
  )
}

export default RealtimeMessageEditor
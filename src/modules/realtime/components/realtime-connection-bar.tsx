import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlugZap, Plug, AlertCircle } from 'lucide-react'
import React, { useState, useCallback, useEffect } from 'react'
import { useWsStore } from '../hooks/useWs'

const RealtimeConnectionBar = () => {
  const { 
    status, 
    isConnected, 
    error, 
    url: connectedUrl, 
    reconnectAttempts, 
    maxReconnectAttempts,
    connect,
    disconnect
  } = useWsStore()
  
  const [url, setUrl] = useState(connectedUrl || '')

  // Keep the input in sync with the store's connected URL. React's documented
  // way to adjust state when a prop changes is to compare against the previous
  // value during render, not to mirror it in an effect.
  const [lastConnectedUrl, setLastConnectedUrl] = useState(connectedUrl)
  if (connectedUrl !== lastConnectedUrl) {
    setLastConnectedUrl(connectedUrl)
    setUrl(connectedUrl || '')
  }

  const onConnect = useCallback(() => {
    if (!url.trim()) {
      alert('Please enter a WebSocket URL')
      return
    }

    if (isConnected) {
      // Disconnect if already connected
      disconnect()
    } else {
      // Connect to WebSocket
      connect(url, {
        onOpen: (event) => {
          console.log('Successfully connected to:', url)
        },
        onClose: (event) => {
          console.log('Disconnected from WebSocket')
        },
        onError: (error) => {
          console.error('WebSocket connection error:', error)
        },
        onMessage: (event) => {
          console.log('Received message:', event.data)
        },
        autoReconnect: true,
        reconnectDelay: 3000
      })
    }
  }, [url, isConnected, connect, disconnect])

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onConnect()
    }
  }, [onConnect])

  const getConnectionColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500 hover:bg-green-600'
      case 'connecting':
      case 'reconnecting':
        return 'bg-yellow-500 hover:bg-yellow-600'
      case 'error':
        return 'bg-red-500 hover:bg-red-600'
      default:
        return 'bg-zinc-700 hover:bg-zinc-600'
    }
  }

  const getConnectionIcon = () => {
    switch (status) {
      case 'connected':
        return <Plug size={20} />
      case 'connecting':
      case 'reconnecting':
        return <PlugZap size={20} className="animate-pulse" />
      case 'error':
        return <AlertCircle size={20} />
      default:
        return <PlugZap size={20} />
    }
  }

  const getButtonText = () => {
    switch (status) {
      case 'connected':
        return 'Disconnect'
      case 'connecting':
        return 'Connecting...'
      case 'reconnecting':
        return `Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`
      case 'error':
        return 'Retry'
      default:
        return 'Connect'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'reconnecting':
        return `reconnecting (${reconnectAttempts}/${maxReconnectAttempts})`
      default:
        return status
    }
  }

  return (
    <div className='flex flex-row items-center justify-between bg-surface-raised border border-line rounded-lg px-3 py-2.5 w-full shadow-sm'>
      <div className="flex flex-row items-center gap-3 flex-1">
        <Input 
          value={url} 
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="ws://localhost:8080"
          className="flex-1 bg-canvas border-line text-zinc-200 placeholder-zinc-600 focus-visible:ring-blue-500/30 h-9"
          disabled={status === 'connecting' || status === 'reconnecting'}
        />
      </div>
      
      <div className="flex items-center gap-3">
        {/* Connection Status Indicator */}
        <div className="flex px-2 flex-col items-end text-[11px] text-zinc-500 font-medium">
          <div className="flex items-center gap-1.5">
            <div 
              className={`w-2 h-2 rounded-full ${
                status === 'connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' :
                status === 'connecting' || status === 'reconnecting' ? 'bg-yellow-500 animate-pulse' :
                status === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-zinc-700'
              }`}
            />
            <span className="capitalize tracking-wider">{getStatusText()}</span>
          </div>
        </div>
        
        <Button
          type='button'
          onClick={onConnect}
          disabled={status === 'connecting' || status === 'reconnecting'}
          className={`h-9 px-5 text-white font-semibold rounded-md transition-all duration-200 shadow-lg shadow-blue-500/10 ${
            status === 'connected' 
              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' 
              : 'bg-blue-600 hover:bg-blue-500'
          }`}
        >
          <span className="flex items-center gap-2">
            {getConnectionIcon()}
            {getButtonText()}
          </span>
        </Button>
      </div>
    </div>
  )
}

export default RealtimeConnectionBar
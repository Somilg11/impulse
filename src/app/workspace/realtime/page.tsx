"use client";
import RealtimeConnectionBar from '@/modules/realtime/components/realtime-connection-bar'
import RealtimeMessageEditor from '@/modules/realtime/components/realtime-message-editor'

const page = () => {
return (
 <div className="flex flex-col h-full bg-canvas">
    <div className='px-4 py-4 md:px-6 md:py-6 space-y-2'>
      <h1 className='text-xl md:text-2xl font-bold text-white'>WebSocket</h1>
      <p className='text-xs md:text-sm text-muted-foreground'>Connect to a websocket server and start testing!</p>
      <RealtimeConnectionBar />
    </div>
      <div className="flex-1 overflow-auto flex flex-col px-4 pb-4 md:px-6 md:pb-6">
        <RealtimeMessageEditor />
      </div>
    </div>
)
}

export default page
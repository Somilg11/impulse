/* eslint-disable @typescript-eslint/ban-ts-comment */
import { currentUser } from '@/modules/authentication/actions'
import Header from '@/modules/layout/components/header'
import { initializeWorkspace } from '@/modules/workspace/actions'
import TabbedLeftPanel from '@/modules/workspace/components/tabbed-left-panel'
import StatusBar from '@/modules/layout/components/status-bar'
import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Workspace',
    description: 'Build, send, and share API requests.',
    // Authenticated surface - never index it.
    robots: { index: false, follow: false },
}

const RootLayout = async ( { children }: { children: React.ReactNode } ) => {
    const workspace = await initializeWorkspace();
    const user = await currentUser();
  return (
    <>
    {/* @ts-expect-error */}
    <Header user={user} />
    <main className='h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] flex flex-col overflow-hidden bg-canvas'>
        <div className='flex min-h-0 w-full flex-1'>
            {/* Left icon rail - hidden on mobile */}
            <div className='hidden md:flex w-11 border-r border-line bg-canvas shrink-0 flex-col'>
                <TabbedLeftPanel />
            </div>
            <div className='flex-1 bg-canvas min-w-0'>
                {children}
            </div>
        </div>
        <StatusBar />
    </main>
    </>
  )
}

export default RootLayout
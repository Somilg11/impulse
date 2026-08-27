/* eslint-disable @typescript-eslint/ban-ts-comment */
import { currentUser } from '@/modules/authentication/actions'
import Header from '@/modules/layout/components/header'
import { initializeWorkspace } from '@/modules/workspace/actions'
import TabbedLeftPanel from '@/modules/workspace/components/tabbed-left-panel'
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
    <main className='max-h-[calc(100vh-3rem)] md:max-h-[calc(100vh-3rem)] h-[calc(100vh-3rem)] flex overflow-hidden bg-[#0e1117]'>
        <div className='flex h-full w-full'>
            {/* Left icon rail - hidden on mobile */}
            <div className='hidden md:flex w-11 border-r border-[#1e2330] bg-[#0e1117] shrink-0 flex-col'>
                <TabbedLeftPanel />
            </div>
            <div className='flex-1 bg-[#0e1117] min-w-0'>
                {children}
            </div>
        </div>
    </main>
    </>
  )
}

export default RootLayout
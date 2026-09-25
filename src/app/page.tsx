"use client"

import Link from 'next/link'
import { Terminal, ChevronDown, Download, Star, ArrowRight, Activity, Zap, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-canvas text-white font-sans overflow-hidden">
      
      {/* Header */}
      <header className="px-6 lg:px-12 py-5 flex items-center justify-between z-50 bg-canvas/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex flex-col">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-blue-600 rounded-lg p-1.5 flex items-center justify-center">
              <Terminal className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white mb-0 mt-0.5" style={{ lineHeight: 1 }}>impulse</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/docs">
            <Button variant="ghost" className="text-zinc-200 bg-line/50 hover:bg-line hover:text-white border border-white/5 rounded-full px-5 h-9 font-medium text-[15px]">
              Docs
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button className="bg-brand hover:bg-brand/90 text-white rounded-full px-5 h-9 font-medium text-[15px]">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center pt-20 px-4 text-center relative z-10">
        
        <div className="max-w-[800px] mx-auto flex flex-col items-center">
          <h1 className="text-6xl md:text-[80px] font-bold tracking-tight mb-6 leading-[1.1]">
            <span className="text-white">The </span>
            <span className="text-brand">Open-Source</span><br />
            <span className="text-white">API client</span>
          </h1>
          
          <p className="text-[19px] md:text-[21px] text-[#9ba1a6] max-w-[700px] mb-10 leading-relaxed font-medium">
            Build and test APIs in the browser, then share them with your team. Send requests from your own machine to reach localhost, or through a guarded server proxy when CORS gets in the way. Open source and self-hostable.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-10">
            <Link href="/sign-in">
              <Button size="lg" className="bg-brand hover:bg-brand/90 text-white rounded-full px-8 h-14 text-[17px] font-semibold gap-2 shadow-[0_0_20px_rgba(18,101,255,0.4)]">
                Get Started <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="https://github.com/Somilg11/impulse" target="_blank">
              <Button size="lg" className="bg-line-strong/80 hover:bg-line-strong text-white rounded-full px-8 h-14 text-[17px] font-medium border border-line-strong gap-2 transition-all">
                <Github className="h-5 w-5" /> Star on GitHub
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center text-[15px] font-medium text-zinc-300">
            <span>4.8</span>
            <Star className="h-4 w-4 text-yellow-500 fill-current mx-1.5" />
            <span className="text-brand ml-1">2,400+</span> <span className="ml-1">Stars on GitHub</span>
          </div>
        </div>

        {/* Glow Effects */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-600/20 blur-[150px] -z-10 rounded-full pointer-events-none" />

        {/* App Image Placeholder Section */}
        <div className="w-full max-w-[1100px] mx-auto mt-24 relative z-20">
            {/* Dark background glow for app container */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-blue-500/10 blur-[120px] -z-10 rounded-full pointer-events-none" />
            
            {/* Mac OS Window frame */}
            <div className="w-full aspect-[16/9] bg-surface-raised rounded-t-xl border border-line-strong shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl">
                {/* Window header */}
                <div className="h-10 bg-surface-hover flex items-center px-4 border-b border-line-strong">
                    <div className="flex space-x-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f56]" />
                        <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]" />
                        <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f]" />
                    </div>
                    <div className="mx-auto flex items-center gap-2 bg-surface-raised px-3 py-1 rounded text-xs text-zinc-400 border border-line-strong">
                        <span className="w-4 h-4 rounded-sm bg-zinc-700 flex items-center justify-center text-[10px] text-white">W</span>
                        <span>Local workspace</span>
                        <ChevronDown className="h-3 w-3" />
                    </div>
                </div>

                {/* Window body (mocking the app layout) */}
                <div className="flex-1 flex text-sm">
                    {/* Sidebar left */}
                    <div className="w-14 items-center flex flex-col py-4 border-r border-line-strong bg-surface-raised space-y-6">
                        <div className="w-8 h-8 rounded text-zinc-400 bg-white/5 flex items-center justify-center"><Terminal className="h-4 w-4" /></div>
                        <div className="w-8 h-8 rounded text-zinc-500 hover:text-zinc-300 flex items-center justify-center"><Zap className="h-4 w-4" /></div>
                        <div className="w-8 h-8 rounded text-zinc-500 hover:text-zinc-300 flex items-center justify-center"><Activity className="h-4 w-4" /></div>
                    </div>
                    
                    <div className="w-64 border-r border-line-strong bg-surface-raised p-4 hidden md:block">
                        <div className="flex text-xs font-semibold text-zinc-300 mb-6 gap-2">
                            <span className="cursor-pointer hover:text-white">+ New</span>
                            <span className="cursor-pointer hover:text-white ml-2 text-zinc-500">Import</span>
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 bg-surface-hover rounded text-zinc-400 border border-line-strong mb-4 text-xs">
                           Search...
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xs font-semibold text-zinc-500 px-2 mb-2 flex items-center gap-1"><ChevronDown className="h-3 w-3" /> API Reference</h3>
                                <ul className="space-y-0.5 text-[13px] text-zinc-300">
                                    <li className="px-2 py-1.5 flex items-center gap-2 hover:bg-white/5 rounded cursor-pointer">
                                        <span className="text-[#eab308] text-[10px] font-bold">POST</span> Login
                                    </li>
                                    <li className="px-2 py-1.5 flex items-center gap-2 hover:bg-white/5 rounded cursor-pointer">
                                        <span className="text-[#eab308] text-[10px] font-bold">POST</span> Logout
                                    </li>
                                    <li className="px-2 py-1.5 bg-blue-600/20 text-blue-400 flex items-center gap-2 rounded cursor-pointer">
                                        <span className="text-[#eab308] text-[10px] font-bold">POST</span> Refresh Token
                                    </li>
                                    <li className="px-2 py-1.5 flex items-center gap-2 hover:bg-white/5 rounded cursor-pointer">
                                        <span className="text-green-500 text-[10px] font-bold">GET</span> Get User Roles
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Main content right */}
                    <div className="flex-1 bg-surface flex flex-col p-6">
                        <div className="flex items-center text-xs text-zinc-400 mb-6 gap-2 border-b border-line-strong pb-4">
                            <span className="bg-surface-raised px-2 py-1 rounded border border-line-strong flex items-center gap-1.5">
                                Local workspace <ChevronDown className="h-3 w-3" />
                            </span>
                            <span>API Reference</span>
                            <span className="mx-1">{'>'}</span>
                            <span>Authentication</span>
                            <span className="mx-1">{'>'}</span>
                            <span>Advanced</span>
                            <span className="mx-1">{'>'}</span>
                            <span className="text-zinc-200 font-medium">Refresh Token</span>
                        </div>
                        
                        <div className="flex items-stretch mb-6">
                            <div className="w-24 bg-surface-raised border border-line-strong rounded-l-lg border-r-0 flex items-center justify-between px-3 text-[#eab308] font-bold text-xs cursor-pointer">
                                POST <ChevronDown className="h-3 w-3 text-zinc-400" />
                            </div>
                            <div className="flex-1 bg-surface-raised border border-line-strong px-4 py-2.5 text-zinc-400 text-sm flex items-center">
                                http://api.impulse.dev/v1/auth/refresh
                            </div>
                            <Button className="bg-brand hover:bg-brand/90 text-white rounded-none rounded-r-lg px-6 h-auto font-medium">
                                Send
                            </Button>
                        </div>
                        
                        <div className="flex-1 border border-line-strong rounded-lg bg-surface-raised overflow-hidden flex flex-col">
                            <div className="flex border-b border-line-strong px-4 pt-2 gap-6 text-[13px] font-medium text-zinc-400">
                                <span className="pb-2 border-b-2 border-transparent hover:text-zinc-200 cursor-pointer">Params</span>
                                <span className="pb-2 text-zinc-100 border-b-2 border-blue-500 cursor-pointer">Body</span>
                                <span className="pb-2 border-b-2 border-transparent hover:text-zinc-200 cursor-pointer">Headers</span>
                                <span className="pb-2 border-b-2 border-transparent hover:text-zinc-200 cursor-pointer">Authorization</span>
                            </div>
                            <div className="flex-1 p-4 font-mono text-[13px] text-emerald-400 flex">
                                <div className="text-zinc-600 mr-4 select-none text-right">
                                    1<br/>2<br/>3<br/>4
                                </div>
                                <div className="leading-relaxed">
                                    <span className="text-zinc-300">{'{'}</span><br/>
                                    &nbsp;&nbsp;<span className="text-blue-300">&quot;refresh_token&quot;</span><span className="text-zinc-300">: </span><span className="text-yellow-300">&quot;eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...&quot;</span><br/>
                                    <span className="text-zinc-300">{'}'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </main>
      
      {/* Footer spacer */}
      <div className="w-full h-32 relative z-10" />

    </div>
  )
}

"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Terminal, ScrollText, BookOpen, Cpu, Share2, Layers, Search, Zap, ArrowRight, Globe, Radio } from "lucide-react";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");

  const sidebarItems = useMemo(() => [
    { name: "Introduction", icon: <BookOpen className="h-4 w-4" />, href: "/docs#introduction" },
    { name: "Getting Started", icon: <Zap className="h-4 w-4" />, href: "/docs#getting-started" },
    { name: "Workspaces", icon: <Layers className="h-4 w-4" />, href: "/docs#workspaces" },
    { name: "Collections", icon: <ScrollText className="h-4 w-4" />, href: "/docs#collections" },
    { name: "Sending Requests", icon: <Terminal className="h-4 w-4" />, href: "/docs#sending-requests" },
    { name: "Execution Modes", icon: <Globe className="h-4 w-4" />, href: "/docs#execution-modes" },
    { name: "WebSockets", icon: <Radio className="h-4 w-4" />, href: "/docs#realtime" },
    { name: "AI Assistance", icon: <Cpu className="h-4 w-4" />, href: "/docs#ai-integration" },
    { name: "Collaboration", icon: <Share2 className="h-4 w-4" />, href: "/docs#collaboration" },
  ], []);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return sidebarItems;
    return sidebarItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, sidebarItems]);

  return (
    <div className="flex flex-col min-h-screen bg-[#090b14] text-zinc-100 font-sans">
      {/* Header */}
      <header className="px-6 h-16 flex items-center justify-between border-b border-white/5 bg-[#090b14]/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-blue-600 rounded-lg p-1.5">
            <Terminal className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white mb-0 mt-0.5">impulse</span>
          <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-500/20">Docs</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="relative group hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 transition-colors group-focus-within:text-blue-400 font-bold" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation..." 
              className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
          <Link href="/workspace">
            <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 py-1.5 text-sm font-medium transition-colors">
              Open App
            </button>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 max-w-[1400px] mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/5 p-8 hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="space-y-1">
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Documentation</p>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <Link 
                  key={item.name}
                  href={item.href} 
                  onClick={() => setSearchQuery("")}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all group"
                >
                  <span className="text-zinc-500 group-hover:text-blue-400 transition-colors">
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              ))
            ) : (
                <div className="px-3 py-2 text-sm text-zinc-500 italic">No results found</div>
            )}
          </nav>

          <div className="mt-12 bg-blue-600/5 border border-blue-500/10 rounded-xl p-4">
            <h4 className="text-xs font-bold text-blue-400 mb-2">Need help?</h4>
            <p className="text-[12px] text-zinc-400 leading-relaxed mb-4">
              Join our community for support and project discussions.
            </p>
            <Link href="https://github.com/Somilg11/impulse" target="_blank" className="text-xs font-bold text-white hover:text-blue-400 flex items-center gap-1 transition-colors">
              GitHub repository <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 p-8 lg:p-12 pb-24">
          <div className="max-w-3xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}


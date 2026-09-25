"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  Cpu,
  Globe,
  Layers,
  Radio,
  ScrollText,
  Search,
  Share2,
  Terminal,
  Zap,
} from "lucide-react";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");

  const sidebarItems = useMemo(
    () => [
      { name: "Introduction", icon: BookOpen, href: "/docs#introduction" },
      { name: "Getting Started", icon: Zap, href: "/docs#getting-started" },
      { name: "Workspaces", icon: Layers, href: "/docs#workspaces" },
      { name: "Collections", icon: ScrollText, href: "/docs#collections" },
      { name: "Sending Requests", icon: Terminal, href: "/docs#sending-requests" },
      { name: "Environments", icon: Layers, href: "/docs#environments" },
      { name: "Execution Modes", icon: Globe, href: "/docs#execution-modes" },
      { name: "WebSockets", icon: Radio, href: "/docs#realtime" },
      { name: "AI Assistance", icon: Cpu, href: "/docs#ai-integration" },
      { name: "Collaboration", icon: Share2, href: "/docs#collaboration" },
    ],
    []
  );

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sidebarItems;
    return sidebarItems.filter((item) => item.name.toLowerCase().includes(query));
  }, [searchQuery, sidebarItems]);

  return (
    <div className="min-h-screen bg-ink text-white antialiased [--tight:-0.035em]">
      {/* --------------------------------------------------------- header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-hairline bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-[1120px] items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2">
              <Terminal className="h-[15px] w-[15px]" strokeWidth={2.5} />
              <span className="text-[13px] font-semibold tracking-[-0.01em]">Impulse</span>
            </Link>
            <span className="text-[13px] text-zinc-700">/</span>
            <span className="text-[13px] text-zinc-400">Docs</span>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="h-7 w-52 rounded-lg border border-hairline bg-white/[0.04] pl-8 pr-3 text-[12.5px] text-zinc-200 placeholder-zinc-600 transition-colors focus:border-hairline-strong focus:outline-none"
              />
            </div>
            <Link
              href="/workspace"
              className="text-[12px] text-brand transition-opacity hover:opacity-80"
            >
              Open app
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1120px] gap-12 px-5 pt-12">
        {/* -------------------------------------------------------- sidebar */}
        <aside className="sticky top-12 hidden h-[calc(100vh-3rem)] w-52 shrink-0 overflow-y-auto py-12 lg:block">
          <p className="mb-4 px-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-600">
            Documentation
          </p>

          <nav className="space-y-px">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSearchQuery("")}
                  className="group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-white"
                >
                  <item.icon
                    className="h-3.5 w-3.5 text-zinc-700 transition-colors group-hover:text-brand"
                    strokeWidth={2}
                  />
                  {item.name}
                </Link>
              ))
            ) : (
              <p className="px-2.5 py-1.5 text-[13px] text-zinc-600">No matches.</p>
            )}
          </nav>

          <div className="mt-10 rounded-xl bg-gradient-to-b from-white/[0.055] to-white/[0.015] p-px">
            <div className="rounded-[11px] bg-ink-raised p-4">
              <p className="text-[12.5px] font-medium text-zinc-200">Something missing?</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-500">
                Open an issue and it gets read.
              </p>
              <Link
                href="https://github.com/Somilg11/impulse/issues"
                target="_blank"
                className="group mt-3 inline-flex items-center gap-1 text-[12px] text-brand transition-opacity hover:opacity-80"
              >
                GitHub
                <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </aside>

        {/* -------------------------------------------------------- content */}
        <main className="min-w-0 flex-1 py-12 pb-32">
          <div className="max-w-[46rem]">{children}</div>
        </main>
      </div>
    </div>
  );
}

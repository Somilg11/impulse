import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Guides for using Impulse: building requests, execution modes, collections, workspaces, and importing from Postman.",
  alternates: { canonical: "/docs" },
};

import React from "react";
import { Terminal, Zap, Layers, ScrollText, Cpu, Share2, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function DocsPage() {
  const sections = [
    {
      id: "introduction",
      title: "Introduction",
      icon: <Terminal className="h-6 w-6 text-blue-400" />,
      content: (
        <>
          <p className="text-zinc-400 leading-relaxed mb-6">
            Impulse is a next-generation, open-source API testing platform designed for modern development workflows. 
            It combines the power of a local terminal with the convenience of a web-based collaborative workspace.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Fast & Lightweight
              </h4>
              <p className="text-xs text-zinc-500 leading-snug">No heavy electron apps. Instant load times and zero latency.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Privacy First
              </h4>
              <p className="text-xs text-zinc-500 leading-snug">Your data stays where it belongs. Local-first architecture with optional sync.</p>
            </div>
          </div>
        </>
      )
    },
    {
      id: "getting-started",
      title: "Getting Started",
      icon: <Zap className="h-6 w-6 text-yellow-400" />,
      content: (
        <>
          <p className="text-zinc-400 leading-relaxed mb-6">
            To begin testing your APIs, navigate to the <code className="bg-white/10 px-1.5 py-0.5 rounded text-blue-400">/workspace</code> route. 
            You can sign in with your GitHub or Google account to keep your collections synced across devices.
          </p>
          <div className="bg-[#1a1c23] border border-white/5 rounded-xl p-6 font-mono text-sm mb-8 overflow-hidden relative">
            <div className="flex items-center gap-1.5 mb-4 border-b border-white/5 pb-3">
              <div className="w-2 h-2 rounded-full bg-red-500/50" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
              <div className="w-2 h-2 rounded-full bg-green-500/50" />
            </div>
            <div className="text-blue-400"># 1. Open the workspace</div>
            <div className="text-zinc-500">Visit <Link href="/workspace" className="text-blue-400 hover:underline">/workspace</Link></div>
            <div className="text-blue-400 mt-2"># 2. Create your first request</div>
            <div className="text-zinc-500">Click the + button in the sidebar</div>
          </div>
        </>
      )
    },
    {
      id: "workspaces",
      title: "Workspaces",
      icon: <Layers className="h-6 w-6 text-indigo-400" />,
      content: (
        <>
          <p className="text-zinc-400 leading-relaxed mb-6">
            Workspaces are the top-level containers for your projects. They allow you to isolate different API contexts, 
            environments, and team permissions.
          </p>
          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <div className="mt-1 bg-blue-500/10 rounded-full p-1"><CheckCircle2 className="h-4 w-4 text-blue-500" /></div>
              <div>
                <span className="text-white font-bold block">Personal Workspace</span>
                <span className="text-sm text-zinc-500">Private sandbox for your individual experiments.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 bg-blue-500/10 rounded-full p-1"><CheckCircle2 className="h-4 w-4 text-blue-500" /></div>
              <div>
                <span className="text-white font-bold block">Team Workspaces</span>
                <span className="text-sm text-zinc-500">Collaborate in real-time with team members on shared endpoints.</span>
              </div>
            </li>
          </ul>
        </>
      )
    },
    {
      id: "collections",
      title: "Collections",
      icon: <ScrollText className="h-6 w-6 text-green-400" />,
      content: (
        <>
          <p className="text-zinc-400 leading-relaxed mb-6">
            Organize your API requests into collections and folders. Collections support variables, shared headers, 
            and pre-request scripts.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8 text-center">
            <ScrollText className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <h4 className="text-white font-bold mb-2">Hierarchical Organization</h4>
            <p className="text-sm text-zinc-500">Nest folders within folders to mirror your API&apos;s versioning or resource structure.</p>
          </div>
        </>
      )
    },
    {
      id: "sending-requests",
      title: "Sending Requests",
      icon: <Terminal className="h-6 w-6 text-purple-400" />,
      content: (
        <>
          <p className="text-zinc-400 leading-relaxed mb-6">
            Sending a request in Impulse is as simple as defining a method and a URL. Use the request editor to fine-tune your payload.
          </p>
          <div className="space-y-6 mb-8">
            <div className="border-l-2 border-blue-500 pl-6">
              <h4 className="text-white font-bold mb-1">Dynamic Body Editor</h4>
              <p className="text-sm text-zinc-500 leading-relaxed">Switch between JSON, Form-data, and Multipart with a single click. Full syntax highlighting and linting included.</p>
            </div>
            <div className="border-l-2 border-green-500 pl-6">
              <h4 className="text-white font-bold mb-1">Header & Params Management</h4>
              <p className="text-sm text-zinc-500 leading-relaxed">Easily toggle headers and URL parameters. Auto-complete suggests common headers like Content-Type and Authorization.</p>
            </div>
          </div>
        </>
      )
    },
    {
      id: "ai-integration",
      title: "AI Integration",
      icon: <Cpu className="h-6 w-6 text-pink-400" />,
      content: (
        <>
          <p className="text-zinc-400 leading-relaxed mb-6">
            Impulse leverages AI to help you build and debug APIs faster. Use our integrated AI suggestions to generate requests, 
            fix formatting errors, or even predict the next endpoint in your workflow.
          </p>
          <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-white/5 rounded-2xl p-8 mb-8">
             <div className="flex items-center gap-3 mb-6">
                <div className="bg-white/10 rounded-lg p-2"><Cpu className="h-5 w-5 text-pink-400" /></div>
                <h4 className="text-lg font-bold text-white tracking-tight">Cortex AI Engine</h4>
             </div>
             <p className="text-zinc-400 text-sm leading-relaxed mb-6">
               Impulse isn&apos;t just a client; it&apos;s an intelligent assistant. Our Cortex engine analyzes your patterns and offers real-time suggestions to optimize your API usage.
             </p>
             <button className="text-xs font-bold text-white bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-colors">
               Explore Cortex features
             </button>
          </div>
        </>
      )
    },
    {
      id: "collaboration",
      title: "Collaboration",
      icon: <Share2 className="h-6 w-6 text-blue-400" />,
      content: (
        <>
          <p className="text-zinc-400 leading-relaxed mb-6">
            Built for modern teams. Share your workspaces with a single link, manage roles (Viewer, Editor, Admin), 
            and see your team&apos;s changes in real-time.
          </p>
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10 border-dashed mb-8">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold">SG</div>
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-[10px] font-bold">JD</div>
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-500">+3</div>
             </div>
             <span className="text-xs text-zinc-500">Live now: 5 users active</span>
          </div>
        </>
      )
    }
  ];

  return (
    <div className="space-y-24">
      {/* Intro section */}
      <section>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-white leading-tight">
          Impulse Documentation
        </h1>
        <p className="text-xl text-zinc-400 leading-relaxed mb-12">
          Everything you need to build, test, and document your APIs efficiently using Impulse.
        </p>
      </section>

      {/* Render sections */}
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              {section.icon}
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{section.title}</h2>
          </div>
          <div className="border-t border-white/5 pt-8">
            {section.content}
          </div>
        </section>
      ))}

      {/* Feedback section */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
        <h3 className="text-xl font-bold text-white mb-4">Still have questions?</h3>
        <p className="text-zinc-400 mb-8 max-w-md mx-auto leading-relaxed">
          If you didn&apos;t find what you were looking for, please open an issue on our <Link href="https://github.com/Somilg11/impulse" className="text-blue-400 hover:underline">GitHub</Link> or join our developer forum.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
           <Link href="https://github.com/Somilg11" target="_blank">
             <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-3 text-sm font-bold transition-all">
               Contact Developer
             </button>
           </Link>
           <Link href="https://github.com/Somilg11/impulse/issues" target="_blank">
             <button className="bg-white/5 hover:bg-white/10 text-white rounded-full px-8 py-3 text-sm font-bold border border-white/10 transition-all">
               Report Bug
             </button>
           </Link>
        </div>
      </section>

      {/* Next page navigation */}
      <div className="flex items-center justify-between border-t border-white/5 pt-12 text-right">
         <div />
         <Link href="#getting-started" className="group">
            <span className="text-xs font-bold text-zinc-500 block mb-1 uppercase tracking-widest">Next Section</span>
            <span className="text-white group-hover:text-blue-400 font-bold flex items-center justify-end gap-2 transition-colors">
              Getting Started <ArrowRight className="h-4 w-4" />
            </span>
         </Link>
      </div>
    </div>
  );
}


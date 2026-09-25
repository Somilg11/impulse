import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Guides for using Impulse: building requests, execution modes, collections, workspaces, WebSockets, and importing from Postman.",
  alternates: { canonical: "/docs" },
};

import React from "react";
import {
  Terminal,
  Zap,
  Layers,
  ScrollText,
  Cpu,
  Share2,
  ArrowRight,
  CheckCircle2,
  Globe,
  Server,
  Radio,
} from "lucide-react";
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
            Impulse is an open-source API client that runs in the browser. You build a
            request, send it, and read the response &mdash; then save it into a collection
            your whole team can use. It covers REST endpoints and WebSocket connections.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> No desktop install
              </h4>
              <p className="text-xs text-zinc-500 leading-snug">
                Runs in a browser tab. Nothing to download, nothing to keep updated.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Self-hostable
              </h4>
              <p className="text-xs text-zinc-500 leading-snug">
                Run it yourself with Docker and PostgreSQL. Your requests and responses
                stay in a database you control.
              </p>
            </div>
          </div>
        </>
      ),
    },
    {
      id: "getting-started",
      title: "Getting Started",
      icon: <Zap className="h-6 w-6 text-yellow-400" />,
      content: (
        <>
          <p className="text-zinc-400 leading-relaxed mb-6">
            Sign in with GitHub or Google, and a personal workspace is created for you
            automatically. From there, head to{" "}
            <code className="bg-white/10 px-1.5 py-0.5 rounded text-blue-400">/workspace</code>{" "}
            to start sending requests.
          </p>
          <div className="bg-[#1a1c23] border border-white/5 rounded-xl p-6 font-mono text-sm mb-8 overflow-hidden relative">
            <div className="flex items-center gap-1.5 mb-4 border-b border-white/5 pb-3">
              <div className="w-2 h-2 rounded-full bg-red-500/50" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
              <div className="w-2 h-2 rounded-full bg-green-500/50" />
            </div>
            <div className="text-blue-400"># 1. Sign in</div>
            <div className="text-zinc-500">
              GitHub or Google, at{" "}
              <Link href="/sign-in" className="text-blue-400 hover:underline">
                /sign-in
              </Link>
            </div>
            <div className="text-blue-400 mt-3"># 2. Open the workspace</div>
            <div className="text-zinc-500">
              Visit{" "}
              <Link href="/workspace" className="text-blue-400 hover:underline">
                /workspace
              </Link>
            </div>
            <div className="text-blue-400 mt-3"># 3. Send a request</div>
            <div className="text-zinc-500">
              Type a URL in the bar and press Send &mdash; no saving required
            </div>
            <div className="text-blue-400 mt-3"># 4. Keep it</div>
            <div className="text-zinc-500">
              Create a collection in the sidebar, then save the request into it
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-8">
            <h4 className="text-sm font-bold text-white mb-3">Keyboard shortcuts</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">New request tab</span>
                <code className="bg-white/10 px-2 py-0.5 rounded text-blue-400 text-xs">
                  Ctrl/&#8984; + G
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Save request</span>
                <code className="bg-white/10 px-2 py-0.5 rounded text-blue-400 text-xs">
                  Ctrl/&#8984; + S
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Search</span>
                <code className="bg-white/10 px-2 py-0.5 rounded text-blue-400 text-xs">
                  Ctrl/&#8984; + K
                </code>
              </div>
            </div>
          </div>
        </>
      ),
    },
    {
      id: "workspaces",
      title: "Workspaces",
      icon: <Layers className="h-6 w-6 text-indigo-400" />,
      content: (
        <>
          <p className="text-zinc-400 leading-relaxed mb-6">
            A workspace is the top-level container. It holds collections and a list of
            members, so you can keep separate projects &mdash; and separate teams &mdash;
            apart.
          </p>
          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <div className="mt-1 bg-blue-500/10 rounded-full p-1">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <span className="text-white font-bold block">Personal Workspace</span>
                <span className="text-sm text-zinc-500">
                  Created for you on first sign-in. Private to your account.
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 bg-blue-500/10 rounded-full p-1">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <span className="text-white font-bold block">Shared Workspaces</span>
                <span className="text-sm text-zinc-500">
                  Invite teammates by link. Everyone sees the same collections and
                  requests, and changes appear on their next load.
                </span>
              </div>
            </li>
          </ul>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-8">
            <h4 className="text-sm font-bold text-white mb-3">Roles</h4>
            <p className="text-xs text-zinc-500 leading-relaxed mb-3">
              Every member holds one role, and it is enforced on the server for each
              operation &mdash; not just hidden in the UI.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-3">
                <code className="bg-white/10 px-2 py-0.5 rounded text-purple-300 text-xs shrink-0">
                  ADMIN
                </code>
                <span className="text-zinc-500 text-xs">
                  Everything an Editor can do, plus issuing invite links
                </span>
              </div>
              <div className="flex items-start gap-3">
                <code className="bg-white/10 px-2 py-0.5 rounded text-blue-300 text-xs shrink-0">
                  EDITOR
                </code>
                <span className="text-zinc-500 text-xs">
                  Create, edit, and delete collections and requests
                </span>
              </div>
              <div className="flex items-start gap-3">
                <code className="bg-white/10 px-2 py-0.5 rounded text-zinc-300 text-xs shrink-0">
                  VIEWER
                </code>
                <span className="text-zinc-500 text-xs">
                  Read collections and send requests, but not modify them
                </span>
              </div>
            </div>
          </div>
        </>
      ),
    },
    {
      id: "collections",
      title: "Collections",
      icon: <ScrollText className="h-6 w-6 text-green-400" />,
      content: (
        <>
          <p className="text-zinc-400 leading-relaxed mb-6">
            A collection is a named group of saved requests inside a workspace. Create one
            from the sidebar, then save requests into it. Each saved request keeps its
            method, URL, query parameters, headers, and body.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h4 className="text-white font-bold mb-2">Importing from Postman</h4>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Paste or upload a Postman v2.1 collection export and Impulse recreates the
              requests with their methods, URLs, query parameters, headers, and bodies.
              Postman folders are flattened into the collection, with the folder name kept
              as a prefix on each request name.
            </p>
          </div>
          <div className="border border-dashed border-white/10 rounded-2xl p-6 mb-8">
            <h4 className="text-zinc-300 font-bold mb-2 text-sm">Not yet supported</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Collections are a single flat level &mdash; nested folders, collection-level
              variables, shared headers, and pre-request scripts are not implemented yet.
              Exporting a collection back out is also still on the roadmap.
            </p>
          </div>
        </>
      ),
    },
    {
      id: "sending-requests",
      title: "Sending Requests",
      icon: <Terminal className="h-6 w-6 text-purple-400" />,
      content: (
        <>
          <p className="text-zinc-400 leading-relaxed mb-6">
            Pick a method, type a URL, press Send. You do not need to save a request first
            &mdash; an unsaved tab sends fine.
          </p>
          <div className="space-y-6 mb-8">
            <div className="border-l-2 border-blue-500 pl-6">
              <h4 className="text-white font-bold mb-1">Methods</h4>
              <p className="text-sm text-zinc-500 leading-relaxed">
                GET, POST, PUT, PATCH, and DELETE. A body is sent for everything except
                GET.
              </p>
            </div>
            <div className="border-l-2 border-green-500 pl-6">
              <h4 className="text-white font-bold mb-1">Headers and query parameters</h4>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Add them as key/value rows and toggle individual rows off without deleting
                them. Disabled rows are left out of the request.
              </p>
            </div>
            <div className="border-l-2 border-purple-500 pl-6">
              <h4 className="text-white font-bold mb-1">JSON body editor</h4>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Powered by Monaco &mdash; the editor behind VS Code &mdash; so you get
                syntax highlighting, folding, and invalid-JSON detection, plus a format
                button. If you do not set a{" "}
                <code className="bg-white/10 px-1 rounded text-blue-400 text-xs">
                  Content-Type
                </code>{" "}
                yourself and the body parses as JSON, Impulse sets{" "}
                <code className="bg-white/10 px-1 rounded text-blue-400 text-xs">
                  application/json
                </code>{" "}
                for you.
              </p>
            </div>
            <div className="border-l-2 border-amber-500 pl-6">
              <h4 className="text-white font-bold mb-1">Reading the response</h4>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Status code, elapsed time, and size, with tabs for a pretty-printed body,
                the raw body, and the response headers. You can copy the body or download
                it to a file. Each tab remembers its own last response.
              </p>
            </div>
          </div>
          <div className="border border-dashed border-white/10 rounded-2xl p-6 mb-8">
            <h4 className="text-zinc-300 font-bold mb-2 text-sm">Not yet supported</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              The body editor handles JSON and plain text. Form-data, multipart, and file
              uploads are not implemented yet, and there is no header autocomplete, cookie
              jar, or test-assertion support.
            </p>
          </div>
        </>
      ),
    },
    {
      id: "execution-modes",
      title: "Execution Modes",
      icon: <Globe className="h-6 w-6 text-cyan-400" />,
      content: (
        <>
          <p className="text-zinc-400 leading-relaxed mb-6">
            Where a request is sent <em>from</em> decides what it can reach. Impulse gives
            you both options, chosen with the <strong className="text-zinc-300">Send via</strong>{" "}
            selector under the URL bar.
          </p>
          <div className="space-y-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Globe className="h-4 w-4 text-cyan-400" /> Browser
              </h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                The request leaves from your own machine, so it can reach{" "}
                <code className="bg-white/10 px-1 rounded text-blue-400">localhost</code>,
                private networks, and anything on your VPN. The catch is CORS: a browser
                will not let a page read a response from another origin unless that API
                opts in, and most do not. Your cookies are never attached.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Server className="h-4 w-4 text-indigo-400" /> Proxy
              </h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                The server sends the request for you, so CORS does not apply and you see
                every response header. It cannot reach your machine&apos;s localhost, and
                for safety it refuses private and internal addresses, has a 30 second
                timeout, and caps responses at 10 MB.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" /> Auto
                <span className="text-[10px] font-normal text-zinc-500 uppercase tracking-widest">
                  default
                </span>
              </h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Tries the browser first and falls back to the proxy only when the request
                never completed. A real answer from the API &mdash; including a 404 or a
                500 &mdash; is always shown as-is, never retried down the other path.
              </p>
            </div>
          </div>
        </>
      ),
    },
    {
      id: "realtime",
      title: "WebSockets",
      icon: <Radio className="h-6 w-6 text-emerald-400" />,
      content: (
        <>
          <p className="text-zinc-400 leading-relaxed mb-6">
            The realtime surface connects to a WebSocket URL and shows a live table of
            every frame sent and received, with timestamps and direction.
          </p>
          <ul className="space-y-3 mb-8 text-sm">
            <li className="flex items-start gap-3">
              <div className="mt-1 bg-emerald-500/10 rounded-full p-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-zinc-500">
                Connection status with automatic reconnection and attempt tracking
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 bg-emerald-500/10 rounded-full p-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-zinc-500">
                A Monaco editor for composing JSON payloads, with a format button
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 bg-emerald-500/10 rounded-full p-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-zinc-500">
                A scrolling log of sent and received frames, clearable at any time
              </span>
            </li>
          </ul>
          <p className="text-xs text-zinc-500 leading-relaxed mb-8">
            WebSocket connections open from your browser, so they reach local and private
            servers. Sessions are not saved to the database yet &mdash; the log is cleared
            when you leave the page.
          </p>
        </>
      ),
    },
    {
      id: "ai-integration",
      title: "AI Assistance",
      icon: <Cpu className="h-6 w-6 text-pink-400" />,
      content: (
        <>
          <p className="text-zinc-400 leading-relaxed mb-6">
            Impulse uses Google&apos;s Gemini models for two specific jobs. Both require
            you to be signed in and are rate limited per account.
          </p>
          <div className="space-y-6 mb-8">
            <div className="border-l-2 border-pink-500 pl-6">
              <h4 className="text-white font-bold mb-1">Name a request</h4>
              <p className="text-sm text-zinc-500 leading-relaxed">
                From the method and URL, it proposes a few readable names with a short
                reason for each &mdash; so a saved request reads as{" "}
                <em>&quot;Create Charge&quot;</em> rather than{" "}
                <em>&quot;POST /v1/charges&quot;</em>.
              </p>
            </div>
            <div className="border-l-2 border-purple-500 pl-6">
              <h4 className="text-white font-bold mb-1">Generate a JSON body</h4>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Describe the payload you want in plain English and it drafts the JSON,
                with a short explanation and suggestions for fields you might add.
              </p>
            </div>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed mb-8">
            If you are self-hosting, these features need a{" "}
            <code className="bg-white/10 px-1 rounded text-blue-400">
              GOOGLE_GENERATIVE_AI_API_KEY
            </code>{" "}
            in your environment. Without one, the rest of the app works normally.
          </p>
        </>
      ),
    },
    {
      id: "collaboration",
      title: "Collaboration",
      icon: <Share2 className="h-6 w-6 text-blue-400" />,
      content: (
        <>
          <p className="text-zinc-400 leading-relaxed mb-6">
            Share a workspace by generating an invite link. Anyone who opens it and signs
            in joins as a Viewer, and an Admin can change their role afterwards.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
            <h4 className="text-sm font-bold text-white mb-3">How invites work</h4>
            <ul className="space-y-2 text-xs text-zinc-500">
              <li>&bull; Only workspace Admins can generate a link</li>
              <li>&bull; Each link expires after 7 days</li>
              <li>&bull; A link is consumed once it is accepted</li>
              <li>
                &bull; Opening a link you have already used does nothing, and never changes
                a role you already hold
              </li>
            </ul>
          </div>
          <div className="border border-dashed border-white/10 rounded-2xl p-6 mb-8">
            <h4 className="text-zinc-300 font-bold mb-2 text-sm">
              A note on &ldquo;realtime&rdquo;
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Collections and requests are shared, so teammates work from the same data.
              There is no live presence, shared cursors, or push-based syncing yet &mdash;
              changes show up when the other person loads or refetches.
            </p>
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="space-y-24">
      {/* Intro section */}
      <section>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-white leading-tight">
          Impulse Documentation
        </h1>
        <p className="text-xl text-zinc-400 leading-relaxed mb-12">
          How to build, send, and share API requests with Impulse &mdash; including what is
          and is not built yet.
        </p>
      </section>

      {/* Render sections */}
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              {section.icon}
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {section.title}
            </h2>
          </div>
          <div className="border-t border-white/5 pt-8">{section.content}</div>
        </section>
      ))}

      {/* Feedback section */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
        <h3 className="text-xl font-bold text-white mb-4">Still have questions?</h3>
        <p className="text-zinc-400 mb-8 max-w-md mx-auto leading-relaxed">
          If you didn&apos;t find what you were looking for, please open an issue on{" "}
          <Link
            href="https://github.com/Somilg11/impulse"
            className="text-blue-400 hover:underline"
          >
            GitHub
          </Link>
          .
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
          <span className="text-xs font-bold text-zinc-500 block mb-1 uppercase tracking-widest">
            Next Section
          </span>
          <span className="text-white group-hover:text-blue-400 font-bold flex items-center justify-end gap-2 transition-colors">
            Getting Started <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Check,
  Code2,
  FolderTree,
  Github,
  Globe,
  Layers,
  ListChecks,
  Radio,
  Server,
  Terminal,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const GITHUB_URL = "https://github.com/Somilg11/impulse";

const FEATURES = [
  {
    icon: Layers,
    title: "Environments",
    body: "Define {{baseUrl}} once and switch between local, staging, and production without editing a single request.",
  },
  {
    icon: FolderTree,
    title: "Shared collections",
    body: "Nested folders inside team workspaces, with Admin, Editor, and Viewer roles enforced on the server.",
  },
  {
    icon: ListChecks,
    title: "Declarative tests",
    body: "Assert on status, timing, headers, or a JSON field by path. No scripting, so nothing executes arbitrary code.",
  },
  {
    icon: Code2,
    title: "Export as code",
    body: "Any request as cURL, fetch, axios, Python, or Go — generated after variables and auth resolve.",
  },
  {
    icon: Radio,
    title: "WebSocket debugger",
    body: "Connect, send JSON frames, and watch a live log of everything sent and received.",
  },
  {
    icon: Boxes,
    title: "Postman import & export",
    body: "Bring a v2.1 collection across with its folder structure intact, and take it back out whenever you want.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-canvas text-white antialiased">
      {/* ---------------------------------------------------------------- nav */}
      <header className="sticky top-0 z-50 border-b border-line/70 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand">
              <Terminal className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">Impulse</span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/docs"
              className="rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
            >
              Docs
            </Link>
            <Link
              href={GITHUB_URL}
              target="_blank"
              className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:text-white sm:flex"
            >
              <Github className="h-4 w-4" />
              GitHub
            </Link>
            <Link href="/sign-in">
              <Button
                size="sm"
                className="h-8 rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
              >
                Sign in
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* -------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden px-4 sm:px-6">
        {/* Soft brand glow, purely decorative */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-12rem] h-[28rem] w-[46rem] -translate-x-1/2 rounded-full bg-brand/15 blur-[120px]"
        />

        <div className="relative mx-auto max-w-4xl pt-20 pb-16 text-center sm:pt-28">
          <Link
            href="/docs#execution-modes"
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-surface-raised px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-line-strong hover:text-zinc-200"
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-brand" />
            Send from your browser or a guarded proxy
            <ArrowRight className="h-3 w-3" />
          </Link>

          <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            The API client your
            <br />
            <span className="text-brand">whole team</span> shares
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-zinc-400">
            Build and test REST and WebSocket APIs in the browser. Share collections
            across workspaces, keep environments per person, and reach{" "}
            <code className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-[15px] text-zinc-300">
              localhost
            </code>{" "}
            without a desktop install.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/sign-in" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="h-12 w-full gap-2 rounded-xl bg-brand px-7 text-base font-semibold text-white hover:bg-brand-hover sm:w-auto"
              >
                Start testing free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={GITHUB_URL} target="_blank" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full gap-2 rounded-xl border-line-strong bg-transparent px-7 text-base font-medium text-zinc-200 hover:bg-surface-hover hover:text-white sm:w-auto"
              >
                <Github className="h-4 w-4" />
                Self-host it
              </Button>
            </Link>
          </div>

          <p className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-brand" /> Open source
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-brand" /> Sign in with GitHub or Google
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-brand" /> Runs on your own Postgres
            </span>
          </p>
        </div>

        {/* ------------------------------------------------------- app preview */}
        <div className="relative mx-auto max-w-5xl pb-20">
          <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-2xl shadow-black/50">
            {/* window chrome */}
            <div className="flex items-center gap-2 border-b border-line bg-surface-raised px-3 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
              <span className="ml-3 font-mono text-[11px] text-zinc-500">
                impulse — Payments API
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
              {/* collections rail */}
              <div className="hidden flex-col gap-1 border-r border-line p-3 sm:flex">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                  Collections
                </p>
                {[
                  { name: "Charges", method: "POST", active: true },
                  { name: "List charges", method: "GET" },
                  { name: "Refund", method: "POST" },
                  { name: "Delete card", method: "DELETE" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
                      item.active ? "bg-brand-subtle" : ""
                    }`}
                  >
                    <span
                      className={`font-mono text-[9px] font-bold ${
                        item.method === "GET"
                          ? "text-method-get"
                          : item.method === "DELETE"
                            ? "text-method-delete"
                            : "text-method-post"
                      }`}
                    >
                      {item.method}
                    </span>
                    <span className="truncate text-[11px] text-zinc-400">{item.name}</span>
                  </div>
                ))}
              </div>

              {/* request + response */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 border-b border-line p-3">
                  <span className="rounded bg-method-post/10 px-2 py-1 font-mono text-[11px] font-bold text-method-post">
                    POST
                  </span>
                  <span className="flex-1 truncate rounded-md border border-line bg-canvas px-2.5 py-1.5 font-mono text-[11px] text-zinc-300">
                    <span className="text-brand">{"{{baseUrl}}"}</span>/v1/charges
                  </span>
                  <span className="rounded-md bg-brand px-3 py-1.5 text-[11px] font-semibold">
                    Send
                  </span>
                </div>

                <div className="flex items-center gap-4 border-b border-line bg-surface-raised px-3 py-2 font-mono text-[11px]">
                  <span className="font-bold text-status-ok">200</span>
                  <span className="text-zinc-500">148 ms</span>
                  <span className="text-zinc-500">1.2 KB</span>
                  <span className="ml-auto flex items-center gap-1 text-zinc-600">
                    <Globe className="h-3 w-3" /> browser
                  </span>
                </div>

                <pre className="overflow-hidden p-3 font-mono text-[11px] leading-relaxed text-zinc-400">
{`{
  "id": "ch_3Nk9Xy2eZvKY",
  "amount": 2000,
  "currency": "usd",
  "status": `}<span className="text-method-get">&quot;succeeded&quot;</span>{`
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------- execution modes */}
      <section className="border-y border-line bg-surface px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Two ways to send. Both matter.
            </h2>
            <p className="mt-4 text-pretty text-zinc-400">
              Where a request is sent from decides what it can reach. Most browser
              tools pick one and inherit its limitation.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-line bg-canvas p-6">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10">
                <Globe className="h-4 w-4 text-brand" />
              </div>
              <h3 className="text-lg font-semibold">From your browser</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Reaches <code className="font-mono text-zinc-300">localhost</code>,
                private networks, and anything on your VPN — because the request leaves
                from your machine, not a server. Your cookies are never attached.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-canvas p-6">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10">
                <Server className="h-4 w-4 text-brand" />
              </div>
              <h3 className="text-lg font-semibold">Through the proxy</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                CORS does not apply, so you see every response header. Rate limited,
                time and size capped, and every target checked against private address
                ranges — including after each redirect.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-xl border border-brand/20 bg-brand/5 p-5">
            <Zap className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <p className="text-sm leading-relaxed text-zinc-300">
              <span className="font-semibold text-white">Auto mode</span> tries your
              browser first and falls back to the proxy only when the request never
              completed. A real 404 or 500 is shown as-is, never silently retried down
              a different path.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- features */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Everything a team needs
            </h2>
            <p className="mt-4 text-pretty text-zinc-400">
              The parts you actually reach for, without the desktop install.
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="bg-canvas p-6 transition-colors hover:bg-surface">
                <feature.icon className="h-5 w-5 text-brand" strokeWidth={1.75} />
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- self-host */}
      <section className="border-t border-line px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Run it on your own machine
            </h2>
            <p className="mt-4 text-pretty leading-relaxed text-zinc-400">
              Impulse is open source and self-hostable. Point it at your own Postgres
              and your requests, responses, and collections never leave infrastructure
              you control.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={GITHUB_URL} target="_blank">
                <Button
                  variant="outline"
                  className="gap-2 rounded-lg border-line-strong bg-transparent text-zinc-200 hover:bg-surface-hover hover:text-white"
                >
                  <Github className="h-4 w-4" />
                  View on GitHub
                </Button>
              </Link>
              <Link href="/docs#getting-started">
                <Button variant="ghost" className="gap-2 rounded-lg text-zinc-400 hover:text-white">
                  Setup guide
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="border-b border-line bg-surface-raised px-4 py-2">
              <span className="font-mono text-[11px] text-zinc-500">bash</span>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-zinc-400">
{`git clone `}<span className="text-zinc-300">{GITHUB_URL}</span>{`
cd impulse
cp .env.example .env

`}<span className="text-zinc-600"># Postgres on :5433</span>{`
docker compose up -d
npx prisma migrate dev

npm install && npm run dev
`}<span className="text-brand">→ http://localhost:3000</span>
            </pre>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ desktop, coming soon */}
      <section className="border-t border-line bg-surface px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-canvas px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Coming soon
          </span>
          <h2 className="mt-5 text-balance text-2xl font-bold tracking-tight sm:text-3xl">
            A desktop app
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-zinc-400">
            A downloadable build is planned, so requests can originate from your machine
            with no CORS limits and no proxy at all. It is not built yet &mdash; until
            then, browser mode already reaches{" "}
            <code className="font-mono text-zinc-300">localhost</code>, and the web app
            needs no install.
          </p>
          <Link href={GITHUB_URL} target="_blank" className="mt-6 inline-block">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-lg border-line-strong bg-transparent text-zinc-300 hover:bg-surface-hover hover:text-white"
            >
              <Github className="h-3.5 w-3.5" />
              Watch the repo for releases
            </Button>
          </Link>
        </div>
      </section>

      {/* ------------------------------------------------------------- cta */}
      <section className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Open a tab and send a request
          </h2>
          <p className="mt-4 text-pretty text-zinc-400">
            Sign in with GitHub or Google. A personal workspace is waiting.
          </p>
          <Link href="/sign-in" className="mt-8 inline-block">
            <Button
              size="lg"
              className="h-12 gap-2 rounded-xl bg-brand px-8 text-base font-semibold text-white hover:bg-brand-hover"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ---------------------------------------------------------- footer */}
      <footer className="border-t border-line px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand">
              <Terminal className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm text-zinc-500">
              Impulse — built by{" "}
              <Link
                href="https://github.com/Somilg11"
                target="_blank"
                className="text-zinc-300 transition-colors hover:text-white"
              >
                Somil Gupta
              </Link>
            </span>
          </div>

          <nav className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/docs" className="transition-colors hover:text-zinc-300">
              Docs
            </Link>
            <Link
              href={`${GITHUB_URL}/issues`}
              target="_blank"
              className="transition-colors hover:text-zinc-300"
            >
              Issues
            </Link>
            <Link href={GITHUB_URL} target="_blank" className="transition-colors hover:text-zinc-300">
              GitHub
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

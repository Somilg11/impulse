"use client";

import Link from "next/link";
import { ChevronRight, Github, Terminal } from "lucide-react";

const GITHUB_URL = "https://github.com/Somilg11/impulse";

/* --------------------------------------------------------------------------
 * Small presentational primitives.
 *
 * The chrome is built from translucent white hairlines rather than opaque grey
 * borders, so panels read correctly against true black, and radii are generous.
 * Both are what make an interface feel native on macOS rather than webby.
 * ------------------------------------------------------------------------ */

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-gradient-to-b from-white/[0.055] to-white/[0.015] p-px ${className}`}
    >
      <div className="h-full rounded-[15px] bg-ink-raised">{children}</div>
    </div>
  );
}

function MethodTag({ method }: { method: string }) {
  const tone: Record<string, string> = {
    GET: "text-method-get",
    POST: "text-method-post",
    PUT: "text-method-put",
    PATCH: "text-method-patch",
    DELETE: "text-method-delete",
  };
  return (
    <span className={`font-mono text-[10px] font-semibold ${tone[method] ?? "text-zinc-500"}`}>
      {method}
    </span>
  );
}

/* ------------------------------------------------------------------ page */

export default function Home() {
  return (
    <div className="min-h-screen bg-ink text-white antialiased [--tight:-0.035em]">
      {/* ------------------------------------------------------------- nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-hairline bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-[1120px] items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2">
            <Terminal className="h-[15px] w-[15px] text-white" strokeWidth={2.5} />
            <span className="text-[13px] font-semibold tracking-[-0.01em]">Impulse</span>
          </Link>

          <nav className="flex items-center gap-7 text-[12px] text-zinc-400">
            <Link href="/docs" className="transition-colors hover:text-white">
              Docs
            </Link>
            <Link
              href={GITHUB_URL}
              target="_blank"
              className="hidden transition-colors hover:text-white sm:block"
            >
              GitHub
            </Link>
            <Link href="/sign-in" className="text-brand transition-opacity hover:opacity-80">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* ------------------------------------------------------------ hero */}
      <section className="px-5 pt-36 pb-20 sm:pt-44">
        <div className="mx-auto max-w-[1120px] text-center">
          <h1 className="rise text-balance text-[clamp(2.75rem,7.5vw,5.25rem)] font-semibold leading-[1.02] tracking-[var(--tight)]">
            An API client
            <br />
            worth sharing.
          </h1>

          <p
            className="rise mx-auto mt-7 max-w-[34rem] text-pretty text-[17px] leading-relaxed text-zinc-400 sm:text-[19px]"
            style={{ animationDelay: "80ms" }}
          >
            Test REST and WebSocket APIs in the browser. Share collections with your
            team, switch environments in a keystroke, and still reach the server running
            on your laptop.
          </p>

          <div
            className="rise mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-7"
            style={{ animationDelay: "160ms" }}
          >
            <Link
              href="/sign-in"
              className="inline-flex h-11 items-center rounded-full bg-brand px-7 text-[15px] font-medium text-white transition-colors hover:bg-brand-hover"
            >
              Get started
            </Link>
            <Link
              href="/docs"
              className="group inline-flex items-center gap-1 text-[15px] text-brand transition-opacity hover:opacity-80"
            >
              Read the docs
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* -------------------------------------------------- product shot */}
        <div
          className="rise mx-auto mt-20 max-w-[1080px]"
          style={{ animationDelay: "240ms" }}
        >
          <div className="rounded-[18px] bg-gradient-to-b from-white/[0.09] to-white/[0.02] p-px shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]">
            <div className="overflow-hidden rounded-[17px] bg-[#0c0f16]">
              {/* title bar */}
              <div className="flex h-9 items-center gap-2 border-b border-hairline px-4">
                <span className="h-[11px] w-[11px] rounded-full bg-[#ff5f57]" />
                <span className="h-[11px] w-[11px] rounded-full bg-[#febc2e]" />
                <span className="h-[11px] w-[11px] rounded-full bg-[#28c840]" />
                <span className="mx-auto text-[11px] text-zinc-500">Payments · Staging</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[196px_1fr]">
                {/* sidebar */}
                <aside className="hidden flex-col border-r border-hairline p-3 md:flex">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                      Collections
                    </span>
                    <span className="text-[13px] leading-none text-zinc-600">+</span>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-md px-2 py-[5px] text-[12px] text-zinc-300">
                    <ChevronRight className="h-3 w-3 rotate-90 text-zinc-600" />
                    Payments
                    <span className="ml-auto text-[10px] text-zinc-600">4</span>
                  </div>

                  <div className="ml-3 flex flex-col gap-px">
                    {[
                      { m: "POST", n: "Create charge", on: true },
                      { m: "GET", n: "List charges" },
                      { m: "POST", n: "Refund" },
                      { m: "DELETE", n: "Remove card" },
                    ].map((r) => (
                      <div
                        key={r.n}
                        className={`flex items-center gap-2 rounded-md px-2 py-[5px] ${
                          r.on ? "bg-brand/[0.16]" : ""
                        }`}
                      >
                        <MethodTag method={r.m} />
                        <span
                          className={`truncate text-[12px] ${
                            r.on ? "text-white" : "text-zinc-500"
                          }`}
                        >
                          {r.n}
                        </span>
                      </div>
                    ))}
                  </div>
                </aside>

                {/* main */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 border-b border-hairline p-3">
                    <span className="rounded-md bg-method-post/10 px-2 py-1 font-mono text-[11px] font-semibold text-method-post">
                      POST
                    </span>
                    <div className="flex-1 truncate rounded-lg border border-hairline bg-black/40 px-3 py-[7px] font-mono text-[12px] text-zinc-300">
                      <span className="text-brand">{"{{baseUrl}}"}</span>
                      <span className="text-zinc-500">/v1/charges</span>
                    </div>
                    <span className="rounded-lg bg-brand px-3.5 py-[7px] text-[12px] font-medium">
                      Send
                    </span>
                  </div>

                  <div className="flex items-center gap-5 border-b border-hairline px-3 py-2 font-mono text-[11px]">
                    <span className="text-[15px] font-semibold text-status-ok">200</span>
                    <span className="text-zinc-500">148 ms</span>
                    <span className="text-zinc-500">1.2 KB</span>
                    <span className="ml-auto text-zinc-600">browser</span>
                  </div>

                  <pre className="p-4 font-mono text-[12px] leading-[1.7] text-zinc-500">
{`{
  `}<span className="text-sky-300">&quot;id&quot;</span>{`: `}<span className="text-method-get">&quot;ch_3Nk9Xy2eZvKY&quot;</span>{`,
  `}<span className="text-sky-300">&quot;amount&quot;</span>{`: `}<span className="text-method-patch">2000</span>{`,
  `}<span className="text-sky-300">&quot;currency&quot;</span>{`: `}<span className="text-method-get">&quot;usd&quot;</span>{`,
  `}<span className="text-sky-300">&quot;status&quot;</span>{`: `}<span className="text-method-get">&quot;succeeded&quot;</span>{`
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------- execution modes */}
      <section className="border-t border-hairline px-5 py-28 sm:py-36">
        <div className="mx-auto max-w-[1120px]">
          <div className="mx-auto max-w-[40rem] text-center">
            <p className="text-[13px] font-medium tracking-[0.06em] text-brand">
              EXECUTION MODES
            </p>
            <h2 className="mt-4 text-balance text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.08] tracking-[var(--tight)]">
              Two ways to send.
              <br />
              You need both.
            </h2>
            <p className="mx-auto mt-6 max-w-[32rem] text-pretty text-[16px] leading-relaxed text-zinc-400">
              Where a request leaves from decides what it can reach. Browser-only tools
              cannot touch your laptop. Server-only tools cannot either.
            </p>
          </div>

          <div className="mt-16 grid gap-4 md:grid-cols-2">
            <Panel>
              <div className="flex h-full flex-col p-7">
                <span className="font-mono text-[11px] tracking-[0.1em] text-zinc-600">
                  01 — BROWSER
                </span>
                <h3 className="mt-4 text-[22px] font-semibold tracking-[-0.02em]">
                  Straight from your machine
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">
                  Reaches <span className="font-mono text-zinc-300">localhost</span>,
                  private networks, and anything on your VPN. Cookies are never attached.
                </p>

                <div className="mt-7 rounded-xl border border-hairline bg-black/40 p-4 font-mono text-[12px]">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-status-ok" />
                    you → localhost:8080
                  </div>
                  <div className="mt-2 pl-[14px] text-status-ok">200 · 12 ms</div>
                </div>
              </div>
            </Panel>

            <Panel>
              <div className="flex h-full flex-col p-7">
                <span className="font-mono text-[11px] tracking-[0.1em] text-zinc-600">
                  02 — PROXY
                </span>
                <h3 className="mt-4 text-[22px] font-semibold tracking-[-0.02em]">
                  Around CORS, safely
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">
                  Every response header visible. Rate limited, time and size capped, and
                  private address ranges refused — rechecked after each redirect.
                </p>

                <div className="mt-7 rounded-xl border border-hairline bg-black/40 p-4 font-mono text-[12px]">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                    server → api.stripe.com
                  </div>
                  <div className="mt-2 pl-[14px] text-status-server-error">
                    169.254.169.254 blocked
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          <p className="mx-auto mt-10 max-w-[38rem] text-center text-[14px] leading-relaxed text-zinc-500">
            <span className="text-zinc-300">Auto</span> tries the browser first and falls
            back only when the request never completed. A real 404 is shown as a 404.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------- bento */}
      <section className="border-t border-hairline px-5 py-28 sm:py-36">
        <div className="mx-auto max-w-[1120px]">
          <h2 className="max-w-[26rem] text-balance text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.08] tracking-[var(--tight)]">
            Built for the way teams actually work.
          </h2>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {/* environments - wide */}
            <Panel className="md:col-span-2">
              <div className="flex h-full flex-col justify-between gap-8 p-7">
                <div>
                  <h3 className="text-[20px] font-semibold tracking-[-0.02em]">
                    Environments
                  </h3>
                  <p className="mt-2 max-w-[26rem] text-[15px] leading-relaxed text-zinc-400">
                    Write <span className="font-mono text-zinc-300">{"{{baseUrl}}"}</span>{" "}
                    once. Point the same collection at local, staging, or production
                    without touching a request.
                  </p>
                </div>

                <div className="rounded-xl border border-hairline bg-black/40 p-4 font-mono text-[12px]">
                  <div className="flex items-center gap-2 border-b border-hairline pb-3">
                    {["Local", "Staging", "Production"].map((env, i) => (
                      <span
                        key={env}
                        className={`rounded-md px-2.5 py-1 ${
                          i === 1 ? "bg-brand text-white" : "text-zinc-500"
                        }`}
                      >
                        {env}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 space-y-1.5 text-zinc-500">
                    <div>
                      <span className="text-brand">baseUrl</span>
                      <span className="text-zinc-700"> = </span>
                      https://staging.api.acme.dev
                    </div>
                    <div>
                      <span className="text-brand">token</span>
                      <span className="text-zinc-700"> = </span>
                      <span className="text-zinc-700">••••••••••••</span>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>

            {/* tests */}
            <Panel>
              <div className="flex h-full flex-col justify-between gap-8 p-7">
                <div>
                  <h3 className="text-[20px] font-semibold tracking-[-0.02em]">Tests</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-zinc-400">
                    Assert on status, timing, headers, or a JSON path. Nothing executes
                    arbitrary code.
                  </p>
                </div>

                <div className="space-y-2 font-mono text-[11px]">
                  {[
                    ["Status equals 200", true],
                    ["Time under 500 ms", true],
                    ["data.id exists", false],
                  ].map(([label, ok]) => (
                    <div key={label as string} className="flex items-center gap-2">
                      <span className={ok ? "text-status-ok" : "text-status-server-error"}>
                        {ok ? "✓" : "✕"}
                      </span>
                      <span className="text-zinc-500">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            {/* code export */}
            <Panel>
              <div className="flex h-full flex-col justify-between gap-8 p-7">
                <div>
                  <h3 className="text-[20px] font-semibold tracking-[-0.02em]">
                    Export as code
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-zinc-400">
                    Hand a teammate a snippet that runs.
                  </p>
                </div>

                <div className="rounded-xl border border-hairline bg-black/40 p-3.5 font-mono text-[11px]">
                  <div className="mb-2.5 flex gap-3 text-zinc-600">
                    <span className="text-white">cURL</span>
                    <span>fetch</span>
                    <span>Python</span>
                  </div>
                  <div className="leading-relaxed text-zinc-500">
                    <span className="text-method-get">curl</span> -X POST \
                    <br />
                    <span className="pl-3">&apos;https://…/charges&apos;</span>
                  </div>
                </div>
              </div>
            </Panel>

            {/* collections */}
            <Panel>
              <div className="flex h-full flex-col justify-between gap-8 p-7">
                <div>
                  <h3 className="text-[20px] font-semibold tracking-[-0.02em]">
                    Shared workspaces
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-zinc-400">
                    Nested folders, invite links, and roles enforced on the server.
                  </p>
                </div>

                <div className="space-y-1.5 font-mono text-[11px] text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <ChevronRight className="h-3 w-3 rotate-90 text-zinc-700" /> v1
                  </div>
                  <div className="flex items-center gap-2 pl-4">
                    <MethodTag method="GET" /> customers
                  </div>
                  <div className="flex items-center gap-2 pl-4">
                    <MethodTag method="POST" /> charges
                  </div>
                </div>
              </div>
            </Panel>

            {/* import */}
            <Panel>
              <div className="flex h-full flex-col justify-between gap-8 p-7">
                <div>
                  <h3 className="text-[20px] font-semibold tracking-[-0.02em]">
                    Bring your collections
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-zinc-400">
                    Import Postman v2.1 with folders intact. Export whenever you like.
                  </p>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-500">
                  <span className="rounded-md border border-hairline px-2.5 py-1.5">
                    Postman
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-700" />
                  <span className="rounded-md border border-hairline px-2.5 py-1.5 text-zinc-300">
                    Impulse
                  </span>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- self-host */}
      <section className="border-t border-hairline px-5 py-28 sm:py-36">
        <div className="mx-auto grid max-w-[1120px] items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-[13px] font-medium tracking-[0.06em] text-brand">
              OPEN SOURCE
            </p>
            <h2 className="mt-4 text-balance text-[clamp(2rem,4.5vw,3rem)] font-semibold leading-[1.08] tracking-[var(--tight)]">
              Your keys never
              <br />
              leave your machine.
            </h2>
            <p className="mt-6 max-w-[28rem] text-[16px] leading-relaxed text-zinc-400">
              Run the whole thing yourself against your own Postgres. Four commands, no
              account, no telemetry.
            </p>
            <Link
              href={GITHUB_URL}
              target="_blank"
              className="group mt-8 inline-flex items-center gap-2 text-[15px] text-brand transition-opacity hover:opacity-80"
            >
              <Github className="h-4 w-4" />
              View the source
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <Panel>
            <div className="p-6">
              <pre className="overflow-x-auto font-mono text-[12.5px] leading-[1.9] text-zinc-500">
{`$ `}<span className="text-zinc-200">git clone github.com/Somilg11/impulse</span>{`
$ `}<span className="text-zinc-200">cp .env.example .env</span>{`
$ `}<span className="text-zinc-200">docker compose up -d</span>{`
$ `}<span className="text-zinc-200">npm install && npm run dev</span>{`

`}<span className="text-brand">→ ready on http://localhost:3000</span>
              </pre>
            </div>
          </Panel>
        </div>
      </section>

      {/* ------------------------------------------------------ desktop */}
      <section className="border-t border-hairline px-5 py-20">
        <div className="mx-auto flex max-w-[1120px] flex-col items-center justify-between gap-5 sm:flex-row">
          <div>
            <p className="text-[15px] font-medium text-zinc-300">
              A desktop app is coming.
            </p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-zinc-500">
              Not built yet. Browser mode already reaches{" "}
              <span className="font-mono text-zinc-400">localhost</span> in the meantime.
            </p>
          </div>
          <Link
            href={GITHUB_URL}
            target="_blank"
            className="group inline-flex shrink-0 items-center gap-1.5 text-[14px] text-brand transition-opacity hover:opacity-80"
          >
            Watch for releases
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* ---------------------------------------------------------- cta */}
      <section className="border-t border-hairline px-5 py-32 sm:py-40">
        <div className="mx-auto max-w-[1120px] text-center">
          <h2 className="text-balance text-[clamp(2.25rem,5.5vw,4rem)] font-semibold leading-[1.05] tracking-[var(--tight)]">
            Open a tab.
            <br />
            Send a request.
          </h2>
          <Link
            href="/sign-in"
            className="mt-10 inline-flex h-11 items-center rounded-full bg-brand px-8 text-[15px] font-medium text-white transition-colors hover:bg-brand-hover"
          >
            Get started
          </Link>
          <p className="mt-5 text-[13px] text-zinc-600">
            GitHub or Google. Nothing to install.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------- footer */}
      <footer className="border-t border-hairline px-5 py-9">
        <div className="mx-auto flex max-w-[1120px] flex-col items-center justify-between gap-4 text-[12px] text-zinc-600 sm:flex-row">
          <span>
            Impulse — by{" "}
            <Link
              href="https://github.com/Somilg11"
              target="_blank"
              className="text-zinc-400 transition-colors hover:text-white"
            >
              Somil Gupta
            </Link>
          </span>
          <nav className="flex items-center gap-7">
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
            <Link
              href={GITHUB_URL}
              target="_blank"
              className="transition-colors hover:text-zinc-300"
            >
              GitHub
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

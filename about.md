# About Impulse

A complete introduction to this project — written so that someone with no
context can read it top to bottom and understand what was built, why, and what
was hard about it.

**Contents**

1. [Start here: what problem does this solve?](#1-start-here-what-problem-does-this-solve)
2. [What Impulse is](#2-what-impulse-is)
3. [What it can do](#3-what-it-can-do)
4. [How it works, in plain language](#4-how-it-works-in-plain-language)
5. [The one genuinely interesting engineering problem](#5-the-one-genuinely-interesting-engineering-problem)
6. [The security work](#6-the-security-work)
7. [How it is built](#7-how-it-is-built)
8. [Project facts](#8-project-facts)
9. [Interview summary](#9-interview-summary)
10. [Expected interview questions, with answers](#10-expected-interview-questions-with-answers)
11. [What is deliberately not built](#11-what-is-deliberately-not-built)

For the deeper technical reference — architecture diagrams, module conventions,
and harder questions — see [`docs/summary.md`](docs/summary.md).

---

## 1. Start here: what problem does this solve?

Skip this section if you already know what an API client is.

### What an API is

Most software talks to other software over the internet. When a weather app
shows you the forecast, it is not calculating the weather — it is sending a
message to a weather company's server and displaying the reply. That
message-passing contract is an **API** (Application Programming Interface).

A single exchange looks like this:

```
REQUEST                                  RESPONSE
POST /v1/charges                    →    200 OK
Authorization: Bearer sk_test_...        { "id": "ch_3Nk",
Content-Type: application/json             "status": "succeeded",
                                           "amount": 2000 }
{ "amount": 2000, "currency": "usd" }
```

Four things go out — a **method** (`POST`, meaning "create something"), a
**URL**, some **headers** (metadata, including who you are), and a **body** (the
actual data). Three come back — a **status code** (`200` = fine, `404` = not
found, `500` = the server broke), headers, and a body.

### Why developers need a tool for this

While building software, you constantly need to ask: *does this endpoint
actually work?* You could write a throwaway script every time, but you would
lose it, and you could not share it with a teammate.

So developers use an **API client**: a tool where you fill in the method, URL,
headers, and body in a form, press Send, and read the response. You save useful
requests into folders, and your team shares them.

**Postman** is the best-known one. It is also a large desktop application, and
its collaboration features sit behind a paid plan.

### The gap

Two things make a good opening for an alternative:

1. **Weight.** Postman is a heavy desktop install. A browser tab that opens
   instantly is a real improvement for a common task.
2. **Collaboration.** Sharing API collections with a team is the feature teams
   most want and most often have to pay for.

Impulse is a web-based API client built around shared team workspaces.

---

## 2. What Impulse is

> A collaborative API client that runs in the browser. Teams share workspaces
> and collections of saved requests, test REST endpoints and WebSockets, and can
> send requests either from their own browser or through a hardened server-side
> proxy.

It is a full application, not a demo: real authentication with Google and
GitHub, a PostgreSQL database with versioned migrations, role-based permissions,
and a CI pipeline.

---

## 3. What it can do

**Send and inspect requests.** A tabbed editor for method, URL, query
parameters, headers, and a JSON body, using Monaco — the same code editor that
powers VS Code — so the body pane has syntax highlighting, folding, and error
detection. The response pane shows status, duration, size, headers, a
pretty-printed body, and a download button.

**Save and organise.** Requests are saved into collections, which belong to a
workspace. Every send against a saved request is recorded in the database with
its status, headers, body, and duration.

**Work as a team.** A workspace has members with one of three roles — Admin,
Editor, or Viewer — and those roles are enforced on the server for every
operation. You invite people with a single-use link that expires after seven
days.

**Migrate in.** Existing Postman collections (v2.1 export format) can be
imported directly, with headers, query parameters, bodies, and methods
preserved.

**Debug WebSockets.** A separate surface connects to a WebSocket URL, sends JSON
payloads, and shows a live table of sent and received frames with
auto-reconnect.

**Get AI help.** Gemini suggests a name for a request from its method and URL,
and can generate a JSON request body from a plain-English description.

---

## 4. How it works, in plain language

```
       YOUR BROWSER                          THE SERVER                DATABASE
┌───────────────────────┐          ┌────────────────────────┐      ┌───────────┐
│  Request editor       │          │  Auth (Google/GitHub)  │      │           │
│  Response viewer      │◄────────►│  Permission checks     │◄────►│ Postgres  │
│  Collections sidebar  │          │  Proxy endpoint        │      │           │
└───────────┬───────────┘          └───────────┬────────────┘      └───────────┘
            │                                  │
            │ browser mode                     │ proxy mode
            ▼                                  ▼
   ┌──────────────────┐               ┌──────────────────┐
   │  The API you are │               │  The API you are │
   │  testing         │               │  testing         │
   └──────────────────┘               └──────────────────┘
```

When you press Send, the request can leave from one of two places, and that
choice has real consequences. Understanding why is the single most useful thing
to take away from this project — it is covered next.

Everything else follows a conventional shape. The browser holds the UI. The
server handles logging in, checking whether you are allowed to touch a given
collection, and talking to the database. PostgreSQL stores users, workspaces,
collections, requests, and run history.

---

## 5. The one genuinely interesting engineering problem

**Where should a request be sent from?**

It sounds trivial. It is not, and getting it wrong makes the product either
insecure or useless.

### Option A: send from the browser

The natural choice. Your browser sends the request directly to the API you are
testing.

This can reach `http://localhost:3000` — the API running on your own laptop,
which is the thing developers most want to test. It uses your network, your VPN,
your machine.

**But browsers block most of these responses.** A security rule called **CORS**
(Cross-Origin Resource Sharing) stops a web page from reading a response from a
different website unless that website explicitly opts in. This rule exists
precisely to stop a random web page from reading your bank's API on your behalf.
Most APIs do not opt in, so most requests fail.

### Option B: send from the server

Our server makes the request and relays the answer back. CORS does not apply to
servers, so this works with any public API.

**But the server cannot reach your laptop.** From the server's point of view,
`localhost` means *the server itself*, not your machine. The most common use
case dies.

**And it is dangerous.** A server that fetches any URL a user gives it is a
textbook security hole — Server-Side Request Forgery, covered in the next
section.

### What Impulse does

Ships both, and tries the browser first.

| Mode | Runs on | Reaches your localhost | Blocked by CORS |
|---|---|---|---|
| **Browser** | Your machine | Yes | Yes |
| **Proxy** | The server | No | No |
| **Auto** (default) | Browser, then proxy | Yes, on the first try | Falls back |

The subtle part is **when** to fall back. The rule is:

```ts
const shouldFallBack = Boolean(browserResult.error) && browserResult.status === 0;
```

Fall back only when the request never completed. A `404` or a `500` is a real
answer from the API — the user needs to see it, not have it silently retried
down a different path and possibly get a different result.

Why check `status === 0` instead of inspecting the error? Because the browser
will not tell you what went wrong. CORS rejection, DNS failure, and a refused
connection all surface as the same bare `TypeError` with no detail — deliberately,
so that a malicious page cannot use error messages to map a private network.
That opacity is the constraint the design has to work around.

---

## 6. The security work

This is the part worth talking about in an interview, because two of these were
real vulnerabilities in the codebase, not hypotheticals.

### Server-Side Request Forgery (SSRF)

Proxy mode fetches a URL the user supplies. Done naively, that hands every user
a tunnel into the server's private network. Cloud servers are the worst case:
most cloud providers expose a metadata service at `169.254.169.254` that hands
out the server's own access credentials to anything that asks from inside.

The guard (`src/lib/ssrf.ts`) rejects:

- anything that is not `http`/`https`
- `localhost`, `*.localhost`, and known metadata hostnames
- private, loopback, and link-local IP addresses, in IPv4 and IPv6, including
  IPv4-mapped forms like `::ffff:127.0.0.1`
- **hostnames that resolve into those ranges.** `127.0.0.1.nip.io` looks like an
  ordinary domain and resolves to loopback, so the guard checks the resolved
  addresses, not just the text.

Redirects are followed **manually**, re-running the guard on every hop. This
matters: a permitted public URL that redirects to `169.254.169.254` would sail
straight through the default `redirect: "follow"`.

There is one honest limitation, documented in the file rather than hidden: **DNS
rebinding.** Validation and connection are two separate DNS lookups, so a
hostile resolver could answer differently each time. Closing it fully means
pinning the connection to the already-validated IP address.

### Server Actions are public endpoints

This one is a genuine trap in modern Next.js, and it is worth understanding
properly.

Next.js lets you write a function on the server and call it from the browser as
if it were local:

```ts
"use server";

export const getCollections = async (workspaceId: string) =>
  db.collection.findMany({ where: { workspaceId } });
```

It *looks* private. It is not. Every export from a `"use server"` file compiles
into a **publicly reachable HTTP endpoint**. Anyone can call it with any
argument they like.

So that function let any logged-in user read any other team's collections by
passing a different workspace id. That is an **IDOR** — Insecure Direct Object
Reference — and nearly every action in the codebase had the same shape.

The fix is one helper applied everywhere an id is accepted:

```ts
export const editCollection = async (collectionId: string, name: string) => {
  await assertCollectionAccess(collectionId, MEMBER_ROLE.EDITOR);
  // ...
};
```

It walks the ownership chain — request → collection → workspace — and checks the
caller's role against a required minimum, with roles ranked
`VIEWER < EDITOR < ADMIN`. The role column already existed in the database; it
was simply never checked.

### A bug that types should have caught but did not

Headers and query parameters were **never actually sent**. The cause:

```ts
headers: request.headers as Record<string, string>
```

The value was a JSON *string*, not an object. The `as` cast told TypeScript to
stop asking questions, the HTTP client got a string where it wanted a map, and
silently dropped it. Requests appeared to work — they just quietly lost their
`Authorization` header.

The lesson is precise and worth stating that way: **a type assertion is a
promise to the compiler, not a conversion.** This bug existed *because of* a
type annotation, not despite one.

There was a second shape problem underneath it. The editor saved headers as
`[{key, value, enabled}]` while the Postman importer saved them as
`{key: value}`. One normaliser (`toKeyValueMap`) now accepts either, plus a JSON
string of either, and every send path goes through it.

### Everything else

- Browser-mode requests use `credentials: "omit"` — your cookies are never
  attached to a third-party API.
- The proxy is authenticated, rate limited to 60 requests/minute per user,
  capped at a 30-second timeout and a 10 MB response.
- Prisma query logging is off in production; it was writing request bodies and
  `Authorization` headers into server logs.
- Security headers — CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy` — are set for every route.
- Invite tokens are 32 bytes of CSPRNG output, expire in 7 days, and accepting
  one is idempotent.

---

## 7. How it is built

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16, App Router | Server Components render workspace data without a client round trip; Server Actions remove an entire REST layer for CRUD |
| Language | TypeScript, strict | One `ExecResult` shape flows through browser, proxy, store, and viewer; without types that contract rots |
| Database | PostgreSQL via Prisma | Real foreign keys and cascade deletes across workspace → collection → request → run; migrations are reviewable SQL in the repo |
| Auth | Better Auth | Self-hosted OAuth that owns its tables in *your* database — no third-party identity vendor, no per-user pricing |
| Client state | Zustand | Open tabs, active tab, send mode — state with no server truth |
| Server state | TanStack Query | Collections, requests, history — gets caching and invalidation for free |
| UI | Radix + Tailwind (shadcn/ui) | Radix supplies accessible primitives; components are copied into the repo as editable source |
| Editor | Monaco | Users editing JSON expect VS Code behaviour; building that is not a good use of time |
| Validation | Zod | Runtime checks at the two trust boundaries: the proxy payload and environment variables |
| AI | Vercel AI SDK + Gemini | Provider-agnostic, so swapping models is config rather than a rewrite |

The split between Zustand and TanStack Query is deliberate and worth stating as
a rule: **Zustand for what the user is doing, TanStack Query for what the server
knows.**

Code is organised by feature, not by file type. `src/modules/request/` owns its
own actions, components, hooks, store, and pure logic. A change to "how requests
are sent" touches one directory instead of five.

---

## 8. Project facts

| | |
|---|---|
| Source files | 138 (55 are vendored shadcn UI primitives) |
| Lines of TypeScript | ~14,300 |
| Feature modules | 8 |
| Database models | 10 |
| Migrations | 11 |
| Pages / API routes | 6 / 4 |
| Commits | 43 |
| CI | typecheck, lint, build, migrations-on-fresh-Postgres with drift detection, blocking dependency audit |
| `npm audit` | 0 vulnerabilities |

---

## 8a. How it is verified

169 unit tests cover the logic that decides what goes on the wire: key/value
normalization, variable substitution, auth schemes, body encoding, the
composition pipeline, assertions, cURL parsing, code generation, collection
export, and the SSRF address guard. Those modules were written free of React,
Prisma, and network access specifically so they could be tested directly - no
mocking, no test database, and the suite runs in about half a second.

The suite was mutation-checked rather than assumed correct. Three deliberate
regressions were introduced and each was caught: letting an auth scheme
overwrite a hand-set `Authorization` header, removing the link-local range from
the SSRF blocklist, and blanking unresolved variables instead of leaving them
literal.

Security behaviour was additionally verified against the running application -
seeding two users, signing real session cookies, and calling server actions over
HTTP as the owner, as a non-member, and anonymously.

The honest gap is end-to-end coverage. UI paths are verified by hand, and
several bugs reached the browser before being caught by eye.

---

## 9. Interview summary

Two minutes, spoken:

> Impulse is a collaborative API client — a Postman alternative built around
> shared team workspaces. Next.js App Router, PostgreSQL through Prisma, Better
> Auth for OAuth, Zustand and TanStack Query splitting client and server state.
>
> The interesting engineering is in how a request actually gets sent.
> Browser-based API clients face a fork: send from the browser and CORS blocks
> most APIs; send from the server and you can't reach the developer's own
> localhost, which is what they most want to test. Impulse does both, browser
> first, falling back to a server proxy only on a transport failure — never on a
> real 4xx or 5xx, because that's a genuine answer.
>
> That proxy is the part I'd want reviewed. Fetching user-supplied URLs
> server-side is textbook SSRF, so it's authenticated, rate limited, capped on
> time and size, and every target — including each redirect hop — is checked
> against private and link-local ranges *after* DNS resolution, so a hostname
> that resolves to loopback is caught too.
>
> The other thing I learned is that Next.js Server Actions are public HTTP
> endpoints, not private functions. Every action that took an id needed a
> membership and role check against the specific object being touched. That's
> now one helper applied uniformly, and it's the change I'd point to first.

### Three things to lead with

1. **A real security finding you fixed** — the unauthenticated action that
   fetched arbitrary URLs from the server.
2. **A design decision with a real trade-off** — dual execution modes, and the
   precise fallback rule.
3. **A bug that teaches something** — the `as` cast that silently dropped every
   request header.

---

## 10. Expected interview questions, with answers

### On the product

**Why build another Postman?**
Two openings: Postman is a heavy desktop install for a task that suits a browser
tab, and team collaboration on collections is the feature teams most want and
most often pay for. Shared workspaces were the starting point, not an add-on.

**What is the hardest part of a browser-based API client?**
That the browser refuses to let you read most responses. CORS exists to stop a
page reading another origin's data, and an API client's entire job is doing
exactly that. Every browser-based client has to answer it, and the honest answer
is a second execution path.

### On the architecture

**Why both browser and proxy execution?**
Neither is sufficient. Browser-only can't reach an API without CORS headers,
which is most of them. Proxy-only can't reach `localhost`, which is the most
common thing a developer tests. Auto mode tries the browser and falls back only
on transport failure.

**How do you distinguish a CORS failure from the server being down?**
You can't, from the browser. `fetch` reports both as a bare `TypeError` with no
detail, deliberately, so a page can't probe a private network through error
messages. That's why the fallback keys on `status === 0` rather than trying to
classify. The user-facing message names both possibilities instead of guessing.

**Why is the proxy a route handler when everything else is a Server Action?**
Server Actions suit UI-driven mutations tied to a component. The proxy is a real
API: it takes a structured payload, is called from a plain client function, needs
explicit HTTP status codes for rate limiting, and pins the Node.js runtime
because it resolves DNS. A route handler expresses all of that naturally.

**Zustand and TanStack Query both hold state — why both?**
Different kinds of state. Zustand holds client state with no server truth: open
tabs, active tab, send mode. TanStack Query holds server state that can go
stale: collections, requests, history, so it gets caching and invalidation.
Putting server data in Zustand means hand-writing cache invalidation; putting
tab state in Query means inventing a server resource that doesn't exist.

**Why feature-sliced modules instead of `components/`, `hooks/`, `services/`?**
Layer-first folders optimise for finding *a kind of file*. Feature-first
optimise for finding *a feature*, which is what actually changes. "How requests
are sent" lives in one directory rather than being spread across five.

### On security

**What is the biggest security risk in an app like this?**
SSRF. The product's entire purpose is fetching user-supplied URLs. Do it
server-side without a guard and you've handed every user a gateway to your
internal network and your cloud metadata endpoint — which serves IAM
credentials.

**Walk me through your SSRF guard. What's its weakness?**
Protocol allowlist, hostname blocklist, IP-literal check, then DNS resolution
with every returned address checked against loopback, link-local, and private
ranges — re-run on every redirect hop. Its weakness is DNS rebinding:
validation and connection are separate resolutions, so a hostile resolver could
answer differently. Closing it means pinning the connection to the validated IP
with a custom dispatcher.

**Someone says "Server Actions are private, only my UI calls them." Response?**
They're wrong, and it's the most consequential misconception about the App
Router. Every `"use server"` export is a public HTTP endpoint reachable with the
action id and arbitrary arguments. Any action taking an id must verify the
caller's access to *that object*.

**Why isn't authorization in middleware?**
Middleware runs before routing and can't know which object is being accessed —
it sees a path, not a `collectionId` inside an action payload. It's also
cookie-presence-based for speed, which an attacker can forge. It's a UX
redirect, not a boundary. The boundary belongs next to the query.

**Your rate limiter is in-memory. Isn't that broken?**
Broken at scale, correct at one instance. Each process keeps its own counters,
so N instances means N times the limit. It's documented in the file with Redis
as the upgrade path. A deliberate scope decision, not an oversight.

### On data and types

**Tell me about a bug that types should have caught but didn't.**
Request headers were never being sent. The code read
`request.headers as Record<string, string>` where the value was actually a JSON
string. The cast silenced the compiler; the runtime got a string where a map was
expected and dropped it. A type assertion is a promise, not a conversion — that
bug existed *because of* the cast.

**Why store headers as JSON rather than a proper table?**
They're read and written as a unit, never queried across, and their shape varies
per request. A `RequestHeader` table would add a join for no query benefit. The
cost is no schema enforcement inside the column, paid down by normalising at one
point instead of trusting the stored shape.

**Why is run history a separate table?**
Different lifecycles. A request definition is edited in place; runs are
append-only and grow without bound. Separating them keeps the hot table small
and makes history paginable and prunable without touching the definition.

### On process

**What would you build next, and why?**
The desktop build. Browser mode reaches localhost but is blocked by CORS;
proxy mode ignores CORS but cannot reach localhost. A desktop app collapses
that trade-off entirely — one execution path with neither limitation. It is
the last structural compromise in the product rather than a missing feature.

**What's the weakest part of this codebase?**
End-to-end coverage. 169 unit tests cover the request pipeline and the
security guard, and CI gates typecheck, lint, build, and migration integrity
— but UI paths are still verified by hand. That gap is not theoretical: a
submenu rendered clipped because it was never portalled out of a scrolling
parent, and a `${name}` in a toast silently resolved to the DOM's
`window.name` global, so it typechecked and rendered empty. Both were caught
by looking at screenshots, not by any automated check.

**Why did you skip the Prisma 7 and TypeScript 7 upgrades?**
They're major versions needing real migration work, and nothing depended on
them. The one transitive advisory Prisma 7 would have fixed was closable with an
`overrides` pin instead. Taking a major upgrade to fix a transitive dependency is
the wrong trade when a two-line pin does it.

---

## 11. What is deliberately not built

Being able to state this list is itself worth points — it shows the scope was
chosen rather than stumbled into.

| Missing | Why it matters |
|---|---|
| Collection **export** | Import is one-way today. The most glaring asymmetry. |
| Environments / `{{baseUrl}}` variables | The largest remaining gap versus Postman. |
| Auth helper tabs (Bearer, Basic, OAuth2) | Currently a hand-written `Authorization` header. |
| Run history UI | The rows are already written. Nothing renders them. |
| Pre-request scripts, assertions, collection runner | What would turn this from a client into a testing tool. |
| Nested folders, form-data uploads, cookie jar, GraphQL | Feature-parity items. |
| Desktop app / local agent | Would remove both the CORS limit and the proxy at once. |
| Automated tests | The real gap. See above. |

Known weak spots, all documented in [`SECURITY.md`](SECURITY.md) rather than
hidden: in-memory rate limiting, response bodies stored unencrypted, CSP still
requiring `unsafe-inline` and `unsafe-eval`, and the DNS-rebinding gap.

# Impulse — Project Summary

An interview-ready reference for the Impulse codebase: what it does, how it is
built, the problems that were actually hard, and the questions a reviewer is
likely to ask.

---

## 1. One-line pitch

> Impulse is a collaborative, browser-based API client — a Postman alternative
> where teams share workspaces and collections, and requests can execute either
> from the user's own browser or through a hardened server-side proxy.

**The differentiator worth leading with:** most web-based API clients force one
execution model and inherit its limitation. Impulse ships both, with automatic
fallback, and the proxy is defended against SSRF rather than being an open
gateway into the server's network.

---

## 2. What it does

### REST client
- Tabbed request playground: method, URL, query params, headers, JSON body.
- Monaco (the editor that powers VS Code) for body editing, with formatting and
  JSON validity checking.
- Per-tab response retention — switching tabs restores that tab's last response.
- Response viewer: pretty/raw body, response headers, status, duration, size,
  download-to-file, copy.
- Every send against a saved request is persisted as a `RequestRun` row —
  status, headers, body, duration.

### Collaboration
- Workspaces with members and three roles: `ADMIN`, `EDITOR`, `VIEWER`.
- Token-based invite links with a 7-day expiry, single use.
- Collections group requests inside a workspace.

### Import
- Postman v2.1 collection import, plus a simpler native format.
- Folders are flattened (the schema has no nested-folder model) with the folder
  name prefixed onto each request so grouping is not lost.

### Realtime
- WebSocket debugger: connect, send JSON payloads, watch a structured log of
  sent/received frames, auto-reconnect with attempt tracking.

### AI assist
- Gemini (via the Vercel AI SDK) suggests request names from a method + URL, and
  generates JSON request bodies from a natural-language prompt.

---

## 3. Architecture

```
src/
├── app/                        Next.js App Router
│   ├── api/auth/[...all]/      Better Auth catch-all handler
│   ├── api/ai/                 name + JSON-body generation (authenticated)
│   ├── api/proxy/              server-side request execution (Mode B)
│   ├── workspace/              the product surface
│   └── invite/[token]/         invite acceptance
├── lib/                        cross-cutting, framework-level concerns
│   ├── authz.ts                membership + role assertions
│   ├── http.ts                 request normalization (shared client & server)
│   ├── ssrf.ts                 private-address guard
│   ├── server-fetch.ts         guarded server-side executor
│   ├── rate-limit.ts           fixed-window limiter
│   ├── auth.ts / db.ts / env.ts
└── modules/                    feature-sliced; each owns its own layers
    ├── request/                actions | components | hooks | lib | store
    ├── collections/            actions | components | hooks
    ├── workspace/  invites/  layout/  realtime/  ai/  authentication/
```

**Module convention.** Each feature module owns `actions/` (server actions),
`components/`, `hooks/` (TanStack Query wrappers), and where needed `store/`
(Zustand) and `lib/` (pure logic). Nothing in `modules/` imports another
module's internals except through its public entry points. Genuinely shared
concerns live in `lib/`.

**Why feature slices over layer folders** (`components/`, `hooks/`, `services/`
at the top level): a change to "how requests are sent" touches one directory
instead of five. Layer-first folders optimise for finding *a kind of file*;
feature-first optimise for finding *a feature*, which is what changes.

### Data model

`User → Workspace → Collection → Request → RequestRun`, plus `WorkspaceMember`
(the join table carrying `MEMBER_ROLE`) and `WorkspaceInvite`. Better Auth owns
`Session`, `Account`, and `Verification`.

`RequestRun` is a separate table rather than a column on `Request` because run
history is append-only, high-volume, and read on a different cadence than the
request definition itself.

---

## 4. Execution modes — the core design decision

Where a request is *sent from* determines what it can reach. This is the single
most important thing to be able to explain about the project.

| Mode | Runs on | Reaches localhost / private network | Blocked by CORS | Sees all response headers |
|---|---|---|---|---|
| **Browser** | The user's machine | Yes | Yes | No — only CORS-safelisted |
| **Proxy** | The server | No (SSRF guard) | No | Yes |
| **Auto** | Browser, then proxy | Yes, on the first attempt | Falls back | Depends which won |

### Why both are necessary

**Browser-only** cannot test any API that does not send
`Access-Control-Allow-Origin` — which is most APIs, because CORS exists to stop
exactly this. It also only exposes six safelisted response headers.

**Proxy-only** cannot reach `http://localhost:8080`, which is the single most
common thing a developer wants to test. From the server, "localhost" is the
*server's* localhost. It also cannot use the developer's VPN or network.

So the honest answer is that neither is sufficient, and the product ships both
with the browser tried first.

### The fallback rule

```ts
const shouldFallBack = Boolean(browserResult.error) && browserResult.status === 0;
```

Fall back **only** on a transport-level failure. A `404` or `500` is a real
answer from the target and must be shown, not retried through a different path.
`fetch` reports CORS rejection, DNS failure, and connection refusal all as the
same `TypeError` with no detail — that opacity is why the rule keys on
`status === 0` rather than trying to classify the error.

### What proxy mode had to defend against

A naive proxy — "accept a URL, fetch it, return the response" — is a Server-Side
Request Forgery vulnerability, not a feature. It lets any caller reach:

- cloud metadata endpoints (`169.254.169.254`) and the IAM credentials they serve,
- internal services on the private network,
- admin ports bound to the server's own loopback interface.

`src/lib/ssrf.ts` blocks by protocol (http/https only), by hostname
(`localhost`, `*.localhost`, known metadata hostnames), by IP literal, and by
**resolving DNS and checking every returned address** — so `127.0.0.1.nip.io`,
which resolves to loopback, is caught. Blocked ranges include loopback,
link-local (which covers cloud metadata), RFC 1918 private, carrier-grade NAT,
multicast, and reserved space, plus the IPv6 equivalents and IPv4-mapped IPv6
(`::ffff:127.0.0.1`).

Crucially, redirects are followed **manually** with the guard re-run on each
hop. An allowed public URL that 302s to `169.254.169.254` is the obvious bypass,
and `redirect: "follow"` would have walked straight into it.

**Known residual risk, stated honestly:** DNS rebinding. The guard resolves and
validates the hostname, then fetches by hostname, so a hostile resolver could
return a public address for the check and a private one for the connection.
Closing it fully requires pinning the connection to the validated IP with a
custom `undici` dispatcher. The guard stops every practical case (IP literals,
localhost, metadata hostnames, redirects); the gap is documented in the file
rather than hidden.

The escape hatch is `IMPULSE_ALLOW_PRIVATE_HOSTS=true`, for self-hosters running
the server on the same trusted machine as the APIs under test — documented with
an explicit warning never to set it on a shared deployment.

---

## 5. Security model

### Server actions are public HTTP endpoints

The most important thing to understand about Next.js server actions: **every
export from a `"use server"` file is a callable HTTP endpoint.** It is not a
private function that only your own UI can invoke. Anyone can `POST` to it with
the action id and arbitrary arguments.

That means an action like:

```ts
export const getCollections = async (workspaceId: string) =>
  db.collection.findMany({ where: { workspaceId } });
```

is an Insecure Direct Object Reference: any authenticated user reads any
workspace's collections by passing someone else's id.

The fix is a single helper applied at the top of every action that accepts an id:

```ts
export async function assertWorkspaceMember(
  workspaceId: string,
  min: MEMBER_ROLE = MEMBER_ROLE.VIEWER
) { /* resolves role, throws AuthzError on failure */ }
```

with `assertCollectionAccess` and `assertRequestAccess` walking the ownership
chain (`request → collection → workspace`) so a request id is checked against
the workspace that actually owns it. Roles are ranked
(`VIEWER 0 < EDITOR 1 < ADMIN 2`) so each action declares a minimum.

### Defence in depth

| Layer | What it does | What it deliberately does *not* do |
|---|---|---|
| `middleware.ts` | Optimistic redirect on session-cookie presence | Validate the session — it is a UX affordance, not a security boundary |
| `lib/authz.ts` | Real session check + membership + role | — |
| `lib/ssrf.ts` | Target-address validation for server-side fetches | — |
| `lib/rate-limit.ts` | Per-user caps on proxy (60/min) and AI (20/min) | Survive across instances — it is in-memory, single-process |

Middleware runs on every navigation, so it uses `getSessionCookie` (a cookie
presence check) instead of an HTTP round trip to `/api/auth/get-session`. An
attacker can forge cookie *presence*, which is exactly why the real check lives
in the actions rather than the middleware.

### Other hardening

- Invite tokens: 16 → 32 bytes of `crypto.randomBytes`.
- `acceptWorkspaceInvite` upserts, so replaying a link is idempotent and cannot
  demote an existing ADMIN back to VIEWER.
- Prisma query logging disabled in production — it was writing request bodies
  and `Authorization` headers into server logs.
- Browser-mode fetches use `credentials: "omit"` so the user's ambient cookies
  are never attached to a third-party API.
- AI routes require authentication; previously anyone could burn the shared
  Gemini quota.

---

## 6. Tech stack — and why each piece

| Choice | Why this, specifically |
|---|---|
| **Next.js 16 (App Router)** | Server Components let workspace/collection data render without a client round trip, and server actions remove a whole REST layer for CRUD. Route handlers are still used where the endpoint is genuinely an API (`/api/proxy`) rather than a UI mutation. |
| **React 19** | Required by the App Router; `use client` boundaries keep Monaco and the Zustand store client-side while the shell stays server-rendered. |
| **TypeScript (strict)** | The whole value of the `ExecResult` design is one shape flowing through browser, proxy, store, and viewer. Without types that contract erodes silently. |
| **Prisma + PostgreSQL** | Relational data with real foreign keys (`workspace → collection → request → run`) and cascade deletes. Migrations are versioned SQL in the repo, reviewable in a PR. Prisma's generated client is what makes `Json` columns type-visible — which is how a real bug got caught (see §7). |
| **Better Auth** | Self-hosted OAuth (GitHub + Google) that owns its own tables in *your* database via the Prisma adapter — no external identity service, no vendor row limits. Session-cookie based, which suits an app that is server-rendered. |
| **Zustand** | Client state that is genuinely client-only: open tabs, active tab, send mode, per-tab responses. Small, no provider, and `getState()` outside React avoids stale-closure bugs inside TanStack mutations. |
| **TanStack Query** | Server state: collections, requests, run history. Gives caching, invalidation, and request de-duplication. The split is deliberate — *Zustand for what the user is doing, TanStack Query for what the server knows.* |
| **Radix UI + Tailwind (shadcn/ui)** | Radix supplies accessible, unstyled primitives (focus traps, keyboard nav, ARIA); Tailwind styles them. shadcn copies components into the repo, so they are editable source rather than a locked dependency. |
| **Monaco Editor** | Users editing JSON bodies expect VS Code behaviour — folding, bracket matching, syntax errors. Building that is not a reasonable use of time. |
| **Zod** | Runtime validation at the two trust boundaries: `/api/proxy`'s request payload, and environment variables via `@t3-oss/env-nextjs` (which fails the build on a missing secret rather than at 3am in production). |
| **Vercel AI SDK + Gemini** | Provider-agnostic interface; swapping models is a config change, not a rewrite. |
| **Docker Compose** | One command for a Postgres matching production, on port 5433 so it does not collide with a host Postgres. |

### Trade-offs worth naming

- **Server actions vs. tRPC/REST**: less boilerplate and type-safe by default,
  but the public-endpoint property is a footgun that must be answered with
  discipline (see §5). A reviewer asking "why not tRPC" is asking whether you
  understand that trade-off.
- **In-memory rate limiting**: correct for a single instance, wrong for a
  horizontally scaled one. Documented in the file. Redis is the upgrade path.
- **Flattened import folders**: a schema simplification, made visible to the user
  by prefixing folder names, rather than silently dropped.

---

## 7. Challenges — the ones actually worth telling

### a. Two data shapes for one concept

Headers and query params were persisted **two different ways**: the key-value
editor wrote `[{key, value, enabled}]`, while the Postman importer wrote
`{key: value}` — both JSON-stringified into a `Json` column. The send path did:

```ts
headers: request.headers as Record<string, string>
```

A `as` cast on a value that was actually a *string*. TypeScript was satisfied;
axios received a string where it wanted a map; **headers were silently never
sent**. Requests appeared to work — they just quietly lost their
`Authorization` header.

The fix was a single normalizer (`toKeyValueMap`) that accepts array form,
object form, or a JSON string of either, and drops disabled and blank-key rows —
applied at every send path so the two shapes converge at one point.

**The lesson to state:** `as` is not a conversion, it is a promise to the
compiler. This bug existed *because* of a type assertion, not despite one.

### b. JSON bodies sent as `text/plain`

`data: request.body` with a string body means the HTTP client sets no
`Content-Type`, so it defaults to `text/plain`. Most APIs reject that with 400
or 415. `buildExecRequest` now infers `application/json` when the body parses as
JSON and the caller has not set the header explicitly — and drops the body
entirely for GET/HEAD.

### c. Sending only worked for saved requests

`useRunRequest(tab.requestId!)` — a non-null assertion on an optional value. An
unsaved scratch tab has no `requestId`, so the server action threw "Request not
found". The most common flow in any API client — type a URL, hit send — was
broken.

Root cause was one line in the store: on save, the tab's client-side id was
*overwritten* with the database id instead of `requestId` being set alongside
it. Fixing it meant separating the two identities: a tab id is a client concept
that lives as long as the tab; a request id is a server concept that may not
exist yet.

This is also why execution moved out of a server action entirely — nothing in
the send path should require a database row.

### d. Making the proxy safe (§4)

The interesting part is not "add a blocklist" but *where* the check goes:
per-hop rather than once, and after DNS resolution rather than on the string.

### e. Fake UI that lied

The response viewer had a "Test Results" tab showing three hardcoded passing
assertions. It was removed rather than kept, because a UI that reports success
it did not measure is worse than no UI. Same for the non-functional
Filter/Save buttons — Save became a real `Blob` download.

---

## 8. Testing and verification

CI runs on every push and PR: typecheck, lint, and build, plus a job that
applies every migration to a fresh Postgres and fails on schema drift, plus a
dependency audit that fails on any high or critical advisory.

There is no *test framework* wired up yet — an honest gap. Verification for the
security-critical work was done by exercising the running application:

- Normalization and the SSRF address matcher were driven with a compiled
  harness over both persisted shapes and 11 address cases.
- The proxy was probed live for metadata IPs, localhost, RFC 1918, a
  DNS-resolves-to-loopback hostname, a `file://` URL, and a redirect into a
  private address.
- Authorization was checked by seeding two users, signing real session cookies,
  and calling server actions directly over HTTP as the owner, as a non-member,
  and anonymously — then repeating at each role level.

**What to say if asked:** the right next step is Vitest over the pure logic
(`toKeyValueMap`, `buildExecRequest`, `isBlockedAddress`, the import parser) and
Playwright over the send flow, added to the existing CI pipeline. The functions
were deliberately written as pure and dependency-free so that is a small job.

---

## 9. Roadmap — what is deliberately not built yet

| Item | Why it matters |
|---|---|
| **Collection export** | Import is one-way today. Letting users leave is what makes them trust staying. |
| **Environments / `{{baseUrl}}` variables** | The single biggest remaining gap versus Postman. |
| **Auth helper tabs** (Bearer, Basic, OAuth2) | Currently a hand-written `Authorization` header. |
| **Mode C: local agent / desktop app** | A downloadable Node agent, or a Tauri build, so requests originate on the user's machine with no CORS *and* no proxy. |
| **Scripts, assertions, collection runner** | Turns the client into a testing tool. |
| **Nested folders, form-data, cookie jar, GraphQL** | Feature parity items. |
| **Run history UI** | The rows are already written; nothing renders them. |

---

## 9a. Repository and operations

| Concern | How it is handled |
|---|---|
| CI | `.github/workflows/ci.yml` — typecheck, lint, build; migrations applied to a fresh Postgres with a drift check; blocking `npm audit` at high severity |
| Branching | Trunk-based with `main` (deployable) and `develop` (integration); short-lived `type/issue-slug` branches; hotfixes off `main` and back-merged |
| Commits | Conventional Commits, squash-merged so the squash title becomes the changelog entry |
| Review | PR template with a security checklist; `CODEOWNERS` marks `authz.ts`, `ssrf.ts`, `server-fetch.ts`, `api/`, `middleware.ts`, and `prisma/` as review-required |
| Dependencies | Dependabot, grouped so Radix does not open thirty PRs |
| Deploy | Multi-stage `Dockerfile` on Next.js `output: "standalone"`, non-root user, healthcheck |
| Config | `.env.example`, Zod-validated env that fails the build on a missing secret, `SKIP_ENV_VALIDATION` for image builds |
| Headers | CSP, HSTS, frame/content-type/referrer/permissions policies set in `next.config.ts` |

**Worth knowing for an interview:** the Docker build initially failed because
`prisma.config.ts` reads `DATABASE_URL` when the config module loads, so
`prisma generate` needs the variable set even though it never opens a
connection. Both the image build and CI pass a placeholder that is replaced at
runtime.

---

## 10. Interview questions to expect

### Architecture

**Q. Why both browser and proxy execution? Isn't one enough?**
Neither is sufficient alone. Browser-only cannot reach any API without CORS
headers, which is most of them. Proxy-only cannot reach `localhost`, which is
the most common thing a developer tests. Auto mode tries the browser and falls
back — but only on transport failure, since a 404 is a real answer.

**Q. How do you tell a CORS failure from the server being down?**
You cannot, from the browser. `fetch` reports both as a bare `TypeError` with no
detail, deliberately, so a page cannot use CORS errors to probe a private
network. That is why the fallback keys on `status === 0` rather than trying to
classify. The user-facing message names both possibilities honestly.

**Q. Why is `/api/proxy` a route handler when everything else is a server action?**
Server actions are for UI-driven mutations tied to a component. The proxy is a
genuine API: it takes a structured payload, is called from a plain client
function, needs explicit HTTP status codes for rate limiting, and pins the
Node.js runtime for DNS resolution. Route handlers express all of that
naturally.

**Q. Zustand and TanStack Query both hold state — why both?**
Different kinds of state. Zustand holds client state with no server truth: open
tabs, active tab, send mode. TanStack Query holds server state that can go
stale: collections, requests, run history — so it gets caching and invalidation.
Putting server data in Zustand means hand-writing cache invalidation; putting
tab state in Query means inventing a server resource that does not exist.

### Security

**Q. What is the biggest security risk in an app like this?**
Server-Side Request Forgery. The product's whole purpose is fetching
user-supplied URLs. Do it on the server without a guard and you have handed
every user a gateway to your internal network and your cloud metadata endpoint —
which serves IAM credentials.

**Q. How does the guard work, and what is its weakness?**
Protocol allowlist, hostname blocklist, IP-literal check, and DNS resolution
with every returned address checked against loopback/link-local/private ranges —
re-run on every redirect hop. Its weakness is DNS rebinding: validation and
connection are two separate resolutions. Closing it means pinning the connection
to the validated IP via a custom dispatcher.

**Q. Someone says "server actions are private, only my UI calls them." Response?**
They are wrong, and it is the most consequential misconception about the App
Router. Every `"use server"` export is a public HTTP endpoint reachable with the
action id and arbitrary arguments. Any action taking an id must verify the
caller's access to *that* object — which is what `lib/authz.ts` does.

**Q. Why is authorization not in middleware?**
Middleware runs before routing and cannot know which object is being accessed —
it sees a path, not a `collectionId` in an action payload. It is also
cookie-presence-based for performance. It is a UX redirect, not a boundary. The
boundary is in the action, next to the query.

**Q. Your rate limiter is in-memory. Isn't that broken?**
Broken at scale, correct at one instance. Each process keeps its own counters,
so N instances means N × the limit. It is documented in the file with Redis as
the upgrade path. It is a deliberate scope decision, not an oversight.

### Data and types

**Q. Tell me about a bug that types should have caught but did not.**
Headers were never being sent. The code read `request.headers as Record<string,
string>` where the value was actually a JSON *string*. The `as` cast silenced
the compiler; the runtime got a string where a map was expected and dropped it.
A type assertion is a promise, not a conversion — that bug existed because of
the cast.

**Q. Why store headers as `Json` and not a proper table?**
They are read and written as a unit, never queried across, and their shape
varies per request. A `RequestHeader` table would add a join for zero query
benefit. The cost is no schema enforcement inside the column — paid down by
normalizing at one point (`toKeyValueMap`) instead of trusting the stored shape.

**Q. Why is `RequestRun` separate from `Request`?**
Different lifecycles. A request definition is edited in place; runs are
append-only and grow unbounded. Separating them keeps the hot table small and
makes history paginable and prunable without touching the definition.

### Next.js specifics

**Q. When does a component need `"use client"` here?**
Anything holding interactive state or browser APIs: the playground, Monaco, the
Zustand store, the send path (`fetch` must run in the user's browser to reach
their localhost). Workspace shells and data-loading pages stay server components.

**Q. Why not `redirect: "follow"` in the proxy?**
Because the guard must run on every hop. `follow` hands redirect handling to the
runtime, so a permitted public URL that 302s to `169.254.169.254` would be
fetched with no further checks. Manual following re-validates each `Location`.

**Q. How do you keep secrets out of the client bundle?**
`@t3-oss/env-nextjs` with a Zod schema splits server and client variables and
fails the build if a server secret is referenced from client code, or if a
required variable is missing — a build-time failure instead of a runtime one.

### Product judgement

**Q. What would you build next and why?**
Collection export. Import already exists, so the asymmetry is the tell — the
product accepts data but will not give it back. Portability is cheap to build
and disproportionately affects whether a team is willing to adopt it.

**Q. What is the weakest part of the codebase?**
No automated test suite. CI enforces typecheck, lint, build, and migration
integrity, but correctness verification is still manual against a running
instance. The logic was deliberately written pure and dependency-free so tests
are a small job — until they exist, every refactor is a manual re-verify.

**Q. Your CI runs `prisma migrate diff --exit-code` — why?**
To catch a `schema.prisma` edit that was never turned into a migration. Without
it, the schema and the migration history drift apart silently and the next
deploy fails against a database that was never migrated. It is the same class of
bug that broke OAuth here once: the app expected a column the database did not
have.

---

## 11. Two-minute verbal summary

> Impulse is a collaborative API client — workspaces, collections, an
> import path from Postman, a WebSocket debugger, and AI-assisted request
> authoring. Next.js App Router, Prisma on Postgres, Better Auth for OAuth,
> Zustand plus TanStack Query for state.
>
> The interesting engineering is in how a request actually gets sent. Web-based
> API clients face a fork: send from the browser and CORS blocks most APIs; send
> from the server and you cannot reach the developer's own localhost, which is
> what they most want to test. Impulse does both, browser first, falling back to
> a server proxy only on transport failure — never on a real 4xx or 5xx.
>
> That proxy is the part I would want reviewed. Fetching user-supplied URLs
> server-side is textbook SSRF, so it is authenticated, rate limited, capped on
> time and size, and every target — including each redirect hop — is checked
> against private and link-local ranges after DNS resolution, so a hostname that
> resolves to loopback is caught too.
>
> The other lesson was that Next.js server actions are public HTTP endpoints,
> not private functions. Every action taking an id needed a membership and role
> check against the object being touched, which is now one helper applied
> uniformly.

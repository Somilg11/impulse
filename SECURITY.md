# Security Policy

## Reporting a vulnerability

Please report privately through
[GitHub Security Advisories](https://github.com/Somilg11/impulse/security/advisories/new).
Do not open a public issue.

Include: what the issue is, how to reproduce it, and what an attacker gains.
Expect an acknowledgement within a few days.

## Supported versions

This project is pre-1.0. Only the `main` branch receives fixes.

## Security model

The parts of this codebase that are security-relevant, and what protects them.

### Server actions are public endpoints

Every export from a `"use server"` file is a callable HTTP endpoint, not a
private function. Any action taking an id authorizes the caller against that
object through `src/lib/authz.ts`, with roles ranked
`VIEWER < EDITOR < ADMIN`.

### Server-side request execution (proxy mode)

`/api/proxy` fetches user-supplied URLs, which is Server-Side Request Forgery by
default. It is protected by:

- authentication and a per-user rate limit (60/min),
- a 30 s timeout and a 10 MB response cap,
- `src/lib/ssrf.ts`, which rejects non-HTTP(S) protocols, localhost and known
  metadata hostnames, private/loopback/link-local IP literals, and hostnames
  that *resolve* to those ranges,
- manual redirect following, so every hop is re-validated.

**Known limitation:** DNS rebinding. Validation and connection are separate
resolutions, so a hostile resolver could return different answers. Closing this
requires pinning the connection to the validated IP with a custom dispatcher.

`IMPULSE_ALLOW_PRIVATE_HOSTS=true` disables these address checks. It exists for
local self-hosting only. **Setting it on a shared or public deployment turns the
proxy into an open gateway to that server's internal network.**

### Browser execution mode

Requests are sent with `credentials: "omit"`, so a user's ambient cookies are
never attached to a third-party API.

### Transport and headers

`next.config.ts` sets CSP, HSTS (production), `X-Frame-Options: DENY`,
`X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`, and
disables `X-Powered-By`. `/api/*` is `no-store` and `noindex`.

`connect-src *` in the CSP is deliberate and load-bearing: browser mode must be
able to reach arbitrary user-supplied APIs.

### Data handling

- Prisma query logging is disabled in production — it would write request bodies
  and `Authorization` headers to server logs.
- Response bodies are stored in `RequestRun` in plaintext. **Do not point a
  shared deployment at production APIs with live credentials** until
  at-rest encryption for that column exists.
- Invite tokens are 32 bytes from `crypto.randomBytes`, expire after 7 days, and
  are deleted on acceptance.

### Known gaps

Tracked, not hidden:

- No automated test suite or security regression tests yet.
- Rate limiting is in-memory, so limits are per-instance.
- `RequestRun` bodies are unencrypted at rest.
- CSP relies on `'unsafe-inline'` and `'unsafe-eval'`; nonce-based CSP is the
  upgrade path.

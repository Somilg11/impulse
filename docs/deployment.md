# Deploying Impulse

Target: **Vercel** for the app, **Neon** for Postgres. Both have free tiers that
comfortably host this project, and Neon is the right shape for serverless — its
pooled endpoint survives a function-per-request model that a plain Postgres
connection limit would not.

Budget about 30 minutes, most of it waiting on OAuth consent screens.

---

## 1. Database (Neon)

1. Create a project at [neon.tech](https://neon.tech). Pick the region closest
   to the Vercel region you will deploy to — every query pays that round trip.
2. From the dashboard, copy **two** connection strings:

| Neon calls it | Goes in | Used by |
|---|---|---|
| Pooled connection | `DATABASE_URL` | the running app |
| Direct connection | `DIRECT_URL` | `prisma migrate` only |

The pooled URL ends in `-pooler` and carries `?sslmode=require`. Keep it.

> **Why two.** Migrations take advisory locks and run DDL, neither of which
> survives a transaction pooler — `prisma migrate` against the pooled URL hangs
> or fails mid-way. The app itself never needs the direct URL.

3. Apply the schema from your machine, once:

```bash
DATABASE_URL="<pooled>" DIRECT_URL="<direct>" npm run db:deploy
```

`db:deploy` runs `prisma migrate deploy`, which applies committed migrations
without generating new ones. It is deliberately **not** part of `npm run build`:
preview deployments share the production database, and migrating on every
preview build would rewrite it from a branch.

---

## 2. OAuth applications

Both providers need the production callback URL, which you only know after the
first deploy. Deploy first with placeholder values, or claim a domain up front.

**GitHub** — [Developer settings → OAuth Apps](https://github.com/settings/developers)

```
Homepage URL:              https://<your-domain>
Authorization callback URL: https://<your-domain>/api/auth/callback/github
```

**Google** — [Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)

```
Authorized JavaScript origin: https://<your-domain>
Authorized redirect URI:      https://<your-domain>/api/auth/callback/google
```

A trailing slash counts as a different URI to both providers. Match exactly.

---

## 3. Vercel

Import the repository at [vercel.com/new](https://vercel.com/new). The framework
is detected automatically; no `vercel.json` is needed.

Set these environment variables for **Production** (and Preview, if you want
preview deploys to work):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `DIRECT_URL` | Neon direct connection string |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` — at least 32 characters |
| `BETTER_AUTH_URL` | `https://<your-domain>` |
| `NEXT_PUBLIC_APP_URL` | `https://<your-domain>` |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | from step 2 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | from step 2 |
| `GOOGLE_GENERATIVE_AI_API_KEY` | optional — see below |

`NEXT_PUBLIC_APP_URL` does more than build invite links: Better Auth derives
callback URLs, the `trustedOrigins` allowlist, and the `Secure` cookie flag from
it. Pointing it at `http://` in production silently disables secure cookies.

The build command is `prisma generate && next build`, already set in
`package.json`. The explicit `prisma generate` matters — Vercel caches
`node_modules`, so the package's own postinstall hook does not reliably re-run,
and a cached stale client fails at runtime rather than at build time.

### Do not set this

```
IMPULSE_ALLOW_PRIVATE_HOSTS=true
```

It disables the SSRF address guard so proxy mode can reach loopback and private
ranges. That is correct on your laptop, where the server and the APIs under test
are the same trusted machine. On a public deployment it turns `/api/proxy` into
an open gateway to Vercel's internal network and to any host that resolves into
a private range. Leave it unset.

---

## 4. Verify

After the first deploy:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://<your-domain>/            # 200
curl -s https://<your-domain>/api/proxy -X POST -d '{}'                    # 401
```

Then, in a browser:

1. Sign in with GitHub, then with Google. Both should land back on `/workspace`.
2. Create a collection, add a request to `https://echo.hoppscotch.io`, send it.
3. Switch execution mode to **Proxy** and send again — this exercises the
   server path and the SSRF guard.
4. Create an environment, set `baseUrl`, and confirm `{{baseUrl}}` resolves.

Proxy mode is the one to check by hand: browser mode would keep working even if
the server half were entirely misconfigured.

---

## Notes

**Without an AI key.** `GOOGLE_GENERATIVE_AI_API_KEY` is optional. Leave it out
and the app deploys and runs normally; the two AI routes answer `503` with a
clear message instead of the instance failing to boot.

**`localhost` on a deployed instance.** Proxy mode runs on Vercel, so it cannot
reach your machine — that is the guard working, not a bug. Browser mode still
can, because it runs in your tab. This is the tradeoff described in the README's
execution-mode table, and it is why `auto` falls back the way it does.

**Cold starts.** Fluid Compute reuses instances, but the first request after an
idle period still pays Prisma's connection setup. Neon's pooled endpoint keeps
this to roughly a few hundred milliseconds.

# Contributing to Impulse

## Local setup

```bash
git clone https://github.com/Somilg11/impulse.git
cd impulse
cp .env.example .env        # then fill in the values
npm install
docker compose up -d        # Postgres on :5433
npx prisma migrate dev      # apply migrations + generate the client
npm run dev
```

Node 22 (see `.nvmrc`). With nvm: `nvm use`.

If sign-in returns a 500 with `P2021 table does not exist`, migrations were
never applied to your database. Run `npx prisma migrate dev`.

---

## Branching model

Trunk-based with a release branch. Two long-lived branches:

| Branch | Purpose | Protected |
|---|---|---|
| `main` | Always deployable. Tagged releases come from here. | Yes |
| `develop` | Integration branch. Features merge here first. | Yes |

Everything else is short-lived and branches off `develop`:

```
<type>/<issue-number>-<short-slug>

feat/42-collection-export
fix/57-header-normalization
chore/61-bump-prisma
docs/12-execution-modes
refactor/33-request-store
```

Hotfixes are the one exception: they branch off `main`, merge back into **both**
`main` and `develop`.

```
hotfix/88-ssrf-redirect-bypass
```

### Flow

```
feat/42-collection-export ──▶ develop ──▶ main ──▶ tag v0.2.0
hotfix/88-... ──▶ main ──▶ back-merge into develop
```

1. Branch from an up-to-date `develop`.
2. Commit in small, reviewable steps.
3. Rebase on `develop` before opening the PR — keep history linear.
4. Open the PR against `develop`. Fill in the template, including the security
   checklist.
5. Squash-merge. The squash title becomes the changelog entry, so write it as a
   conventional commit.

### Branch protection to configure on GitHub

- Require a PR before merging, with at least one approval.
- Require the `quality` and `migrations` CI jobs to pass.
- Require branches to be up to date before merging.
- Dismiss stale approvals on new commits.
- Disallow force pushes and deletion on `main` and `develop`.

---

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

feat(request): add collection export in Postman v2.1 format
fix(proxy): re-validate target on every redirect hop
chore(deps): bump next to 16.3.3 for CVE-2025-66478
docs(readme): document execution modes
refactor(store): separate tab id from request id
test(http): cover both persisted key-value shapes
```

Types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`.

Scopes follow the module layout: `request`, `collections`, `workspace`,
`invites`, `realtime`, `ai`, `auth`, `proxy`, `deps`.

Breaking changes get a `!` and a `BREAKING CHANGE:` footer.

---

## Code conventions

**Feature-sliced modules.** Each feature in `src/modules/<feature>/` owns its
own `actions/`, `components/`, `hooks/`, and where needed `store/` and `lib/`.
Do not import another module's internals. Genuinely shared code lives in
`src/lib/`.

**State.** Zustand for client-only state (open tabs, active tab, send mode).
TanStack Query for anything the server owns (collections, requests, run
history). Do not mix the two.

**Types.** No `any` in new code. Prefer a runtime check over a type assertion —
`as` is a promise to the compiler, not a conversion, and a bad one silently
dropped every request header in this codebase once (see `docs/summary.md` §7a).

**Comments** explain *why*, not *what*. If a line encodes a non-obvious
constraint — a security check, a spec quirk, a workaround — say so.

---

## Security rules that are not optional

These are the ones a reviewer will block on.

**1. Every `"use server"` export is a public HTTP endpoint.** Anyone can call it
with arbitrary arguments. Any action that accepts an id must authorize the
caller against *that object*:

```ts
export const editCollection = async (collectionId: string, name: string) => {
  await assertCollectionAccess(collectionId, MEMBER_ROLE.EDITOR); // required
  ...
};
```

Use `assertWorkspaceMember`, `assertCollectionAccess`, or `assertRequestAccess`
from `src/lib/authz.ts` with the minimum role the operation needs.

**2. Never fetch a user-supplied URL from the server without the guard.**
`assertUrlIsSafe` in `src/lib/ssrf.ts` — on every hop, including redirects.
Server-side execution belongs in `src/lib/server-fetch.ts`; do not add another
path.

**3. Never log request bodies, headers, or response bodies.** They carry bearer
tokens.

**4. Schema changes ship with a migration.** A required column added to a
populated table needs a default or a backfill.

---

## Before you open a PR

```bash
npm run typecheck
npm run lint
npm run build
```

CI runs the same three, plus applies every migration to a fresh Postgres and
fails on schema drift.

# Changelog

All notable changes to this project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Browser and proxy execution modes with automatic fallback, selectable per
  request ("Send via").
- `POST /api/proxy`: authenticated, rate-limited, SSRF-guarded server-side
  request execution.
- `src/lib/authz.ts`: workspace membership and role assertions applied to every
  server action that accepts an id.
- `src/lib/ssrf.ts`: private-address guard covering IP literals, hostnames that
  resolve to private ranges, and every redirect hop.
- Per-user rate limiting on the proxy (60/min) and the AI endpoints (20/min).
- Security headers (CSP, HSTS, frame/content-type/referrer/permissions policies)
  and full site metadata, `robots.txt`, and `sitemap.xml`.
- Response body download, per-tab response retention, `PATCH` method support.
- `.env.example`, CI workflow, issue/PR templates, `CONTRIBUTING.md`,
  `SECURITY.md`, `Dockerfile`.

### Fixed
- Headers and query params were never sent: the two persisted shapes
  (`[{key,value,enabled}]` from the editor, `{key: value}` from the importer)
  are now normalized through `toKeyValueMap`.
- JSON bodies were sent as `text/plain`; `Content-Type` is now inferred.
- Unsaved tabs could not be sent — execution no longer requires a database row.
- Freshly saved requests were unsendable until reload (tab id was overwritten
  with the request id instead of `requestId` being set).
- Postman import: folders are flattened with their name prefixed instead of
  being dropped, `url.query` becomes params, unknown methods fall back to GET.
- Prisma query logging disabled in production (it logged request bodies and
  `Authorization` headers).
- `account.issuer` added for Better Auth 1.7, which scopes account identity by
  OIDC issuer — OAuth sign-in failed without it.

### Security
- Removed an unauthenticated server action that fetched arbitrary URLs from the
  server (open SSRF proxy).
- Added authorization to every previously unprotected server action (IDOR).
- AI endpoints now require authentication.
- Invite tokens widened from 16 to 32 bytes; acceptance is idempotent and can no
  longer demote an existing admin.

### Removed
- `axios` (unused), the `Test` model, `verify_prisma.js`, and a fake
  "All tests passed" panel that reported assertions it never ran.

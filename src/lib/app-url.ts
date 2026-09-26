/**
 * The application's own origin.
 *
 * Read through here rather than from `process.env` directly so a trailing
 * slash in the deployment's configuration cannot leak into generated links.
 * `https://example.com/` + `/invite/x` produced `https://example.com//invite/x`,
 * which Next.js 308-redirects - harmless for a click, but it also reached the
 * sitemap and robots.txt as duplicate URLs.
 */
export function appUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/** Build an absolute URL for `path`, which may or may not start with "/". */
export function absoluteUrl(path: string): string {
  return `${appUrl()}/${path.replace(/^\/+/, "")}`;
}

/**
 * Narrow a caller-supplied "return here afterwards" path to something safe.
 *
 * Only a same-origin absolute path is honoured. A value starting with "//" is
 * protocol-relative ("//evil.com" is a different site to a browser) and an
 * absolute URL is another origin outright, so both fall back. Without this the
 * parameter would be an open redirect, and it is consumed by the OAuth
 * callback - exactly where one is worth having.
 */
export function safeInternalPath(
  raw: string | null | undefined,
  fallback = "/workspace"
): string {
  if (!raw) return fallback;
  const value = raw.trim();
  if (!value.startsWith("/")) return fallback;
  // "//host" and the backslash variant browsers also normalize to it.
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

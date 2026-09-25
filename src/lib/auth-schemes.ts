/**
 * Request authorization schemes.
 *
 * Auth is stored per request and turned into headers (or a query parameter) at
 * send time, rather than the user hand-writing an `Authorization` header. Values
 * may themselves contain `{{variables}}`; substitution runs after auth is
 * applied, so `{{token}}` in a bearer field resolves normally.
 */

export type AuthConfig =
  | { type: "none" }
  | { type: "bearer"; token: string }
  | { type: "basic"; username: string; password: string }
  | { type: "apiKey"; key: string; value: string; in: "header" | "query" };

export type AuthType = AuthConfig["type"];

export const AUTH_TYPES: { value: AuthType; label: string }[] = [
  { value: "none", label: "No Auth" },
  { value: "bearer", label: "Bearer Token" },
  { value: "basic", label: "Basic Auth" },
  { value: "apiKey", label: "API Key" },
];

export const NO_AUTH: AuthConfig = { type: "none" };

/** Accepts the stored Json value (object, or JSON string) and narrows it. */
export function parseAuth(input: unknown): AuthConfig {
  let raw = input;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return NO_AUTH;
    try {
      raw = JSON.parse(trimmed);
    } catch {
      return NO_AUTH;
    }
  }

  if (!raw || typeof raw !== "object") return NO_AUTH;
  const candidate = raw as Record<string, unknown>;

  switch (candidate.type) {
    case "bearer":
      return { type: "bearer", token: String(candidate.token ?? "") };
    case "basic":
      return {
        type: "basic",
        username: String(candidate.username ?? ""),
        password: String(candidate.password ?? ""),
      };
    case "apiKey":
      return {
        type: "apiKey",
        key: String(candidate.key ?? ""),
        value: String(candidate.value ?? ""),
        in: candidate.in === "query" ? "query" : "header",
      };
    default:
      return NO_AUTH;
  }
}

/**
 * Base64 for Basic auth, correct for non-ASCII credentials.
 *
 * `btoa` throws on any code point above U+00FF, so the string is encoded to
 * UTF-8 bytes first. Available in both the browser and Node 18+.
 */
function base64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/**
 * Fold an auth config into headers and query params.
 *
 * A header the user set by hand wins: if `Authorization` is already present, the
 * scheme does not overwrite it. Silently replacing an explicit header would be
 * the wrong call.
 */
export function applyAuth(
  auth: AuthConfig,
  headers: Record<string, string>,
  params: Record<string, string>
): { headers: Record<string, string>; params: Record<string, string> } {
  const nextHeaders = { ...headers };
  const nextParams = { ...params };

  const hasHeader = (name: string) =>
    Object.keys(nextHeaders).some((key) => key.toLowerCase() === name.toLowerCase());

  switch (auth.type) {
    case "bearer": {
      const token = auth.token.trim();
      if (token && !hasHeader("authorization")) {
        nextHeaders.Authorization = `Bearer ${token}`;
      }
      break;
    }
    case "basic": {
      if ((auth.username || auth.password) && !hasHeader("authorization")) {
        nextHeaders.Authorization = `Basic ${base64(`${auth.username}:${auth.password}`)}`;
      }
      break;
    }
    case "apiKey": {
      const key = auth.key.trim();
      if (!key) break;
      if (auth.in === "query") {
        if (!(key in nextParams)) nextParams[key] = auth.value;
      } else if (!hasHeader(key)) {
        nextHeaders[key] = auth.value;
      }
      break;
    }
    case "none":
    default:
      break;
  }

  return { headers: nextHeaders, params: nextParams };
}

/** Short description for the collapsed auth tab label. */
export function describeAuth(auth: AuthConfig): string {
  switch (auth.type) {
    case "bearer":
      return auth.token ? "Bearer token" : "Bearer (empty)";
    case "basic":
      return auth.username ? `Basic (${auth.username})` : "Basic (empty)";
    case "apiKey":
      return auth.key ? `API key (${auth.key})` : "API key (empty)";
    default:
      return "No auth";
  }
}

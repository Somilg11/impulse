/**
 * Shared HTTP request normalization.
 *
 * Headers and query params are persisted in two different shapes across the
 * app: the editor writes `[{ key, value, enabled }]` while the Postman importer
 * writes `{ key: value }`, and both are stored as JSON *strings* in a Json
 * column. Everything that actually sends a request must go through these
 * helpers so both shapes end up as a plain `Record<string, string>`.
 */

export type KeyValueEntry = {
  key?: string;
  value?: string;
  enabled?: boolean;
};

export type ExecRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  params: Record<string, string>;
  body?: string;
};

export type ExecResult = {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  contentType: string;
  durationMs: number;
  size: number;
  via: "browser" | "proxy";
  error?: string;
};

export const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export type Method = (typeof METHODS)[number];

/** Methods that may carry a request body. */
export function methodAllowsBody(method: string): boolean {
  const m = method.toUpperCase();
  return m !== "GET" && m !== "HEAD";
}

/**
 * Accepts an array of `{key,value,enabled}`, an object map, or a JSON string of
 * either, and returns a flat string map. Disabled and blank-key rows dropped.
 */
export function toKeyValueMap(input: unknown): Record<string, string> {
  let raw = input;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return {};
    try {
      raw = JSON.parse(trimmed);
    } catch {
      return {};
    }
  }

  if (!raw || typeof raw !== "object") return {};

  const out: Record<string, string> = {};

  if (Array.isArray(raw)) {
    for (const entry of raw as KeyValueEntry[]) {
      if (!entry || typeof entry !== "object") continue;
      if (entry.enabled === false) continue;
      const key = String(entry.key ?? "").trim();
      if (!key) continue;
      out[key] = String(entry.value ?? "");
    }
    return out;
  }

  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const k = key.trim();
    if (!k) continue;
    if (value === null || value === undefined) continue;
    out[k] = typeof value === "string" ? value : String(value);
  }
  return out;
}

/** Case-insensitive header lookup. */
export function findHeader(
  headers: Record<string, string>,
  name: string
): string | undefined {
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target) return value;
  }
  return undefined;
}

/** Normalize a stored body (string | object | null) to a string. */
export function toBodyString(input: unknown): string | undefined {
  if (input === null || input === undefined) return undefined;
  if (typeof input === "string") return input.length ? input : undefined;
  try {
    return JSON.stringify(input);
  } catch {
    return undefined;
  }
}

function looksLikeJson(body: string): boolean {
  const t = body.trim();
  if (!t) return false;
  if (!/^[[{]/.test(t)) return false;
  try {
    JSON.parse(t);
    return true;
  } catch {
    return false;
  }
}

/**
 * Build the final request payload: drops the body for GET/HEAD and infers
 * `Content-Type: application/json` when the caller did not set one and the body
 * parses as JSON. Without this, a JSON body goes out as text/plain and most
 * APIs reject it.
 */
export function buildExecRequest(input: {
  method: string;
  url: string;
  headers?: unknown;
  parameters?: unknown;
  body?: unknown;
}): ExecRequest {
  const method = (input.method || "GET").toUpperCase();
  const headers = toKeyValueMap(input.headers);
  const params = toKeyValueMap(input.parameters);

  let body = methodAllowsBody(method) ? toBodyString(input.body) : undefined;
  if (body !== undefined && !body.trim()) body = undefined;

  if (body !== undefined && !findHeader(headers, "content-type")) {
    headers["Content-Type"] = looksLikeJson(body)
      ? "application/json"
      : "text/plain;charset=UTF-8";
  }

  return { method, url: (input.url || "").trim(), headers, params, body };
}

/** Merge query params into the URL, preserving params already in the string. */
export function applyParams(
  url: string,
  params: Record<string, string>
): string {
  if (!Object.keys(params).length) return url;
  const separator = url.includes("?") ? "&" : "?";
  const search = new URLSearchParams(params).toString();
  return `${url}${separator}${search}`;
}

export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

/** Normalize a Headers instance to a plain object. */
export function headersToObject(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

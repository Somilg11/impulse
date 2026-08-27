import {
  applyParams,
  byteLength,
  headersToObject,
  type ExecRequest,
  type ExecResult,
} from "@/lib/http";
import { assertUrlIsSafe, BlockedUrlError } from "@/lib/ssrf";

/**
 * Server-side request executor ("proxy mode").
 *
 * This module is deliberately NOT a `"use server"` file: it must only be
 * reachable through callers that have already authenticated and authorized the
 * user. Every hop is re-validated against the SSRF guard, including redirects.
 */

export const PROXY_TIMEOUT_MS = 30_000;
export const PROXY_MAX_BODY_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_REDIRECTS = 5;

// Hop-by-hop headers plus ones the runtime must own.
const STRIPPED_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "proxy-authorization",
  "proxy-connection",
  "te",
  "trailer",
  "content-length",
]);

function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (STRIPPED_REQUEST_HEADERS.has(key.toLowerCase())) continue;
    out[key] = value;
  }
  return out;
}

async function readCappedText(response: Response): Promise<string> {
  const declared = Number(response.headers.get("content-length") ?? "0");
  if (declared > PROXY_MAX_BODY_BYTES) {
    throw new Error(
      `Response too large (${declared} bytes, limit ${PROXY_MAX_BODY_BYTES})`
    );
  }

  if (!response.body) return await response.text();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > PROXY_MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error(`Response exceeded ${PROXY_MAX_BODY_BYTES} byte limit`);
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

/**
 * Execute a request from the server with SSRF protection, a timeout, a response
 * size cap, and manual redirect handling (each hop re-validated).
 */
export async function executeOnServer(request: ExecRequest): Promise<ExecResult> {
  const started = Date.now();

  const failure = (error: string): ExecResult => ({
    ok: false,
    status: 0,
    statusText: "",
    headers: {},
    body: "",
    contentType: "",
    durationMs: Date.now() - started,
    size: 0,
    via: "proxy",
    error,
  });

  if (!request.url) return failure("URL is required");

  let target = applyParams(request.url, request.params);
  let method = request.method.toUpperCase();
  let body = request.body;
  const headers = sanitizeHeaders(request.headers);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const safeUrl = await assertUrlIsSafe(target);

      const response = await fetch(safeUrl, {
        method,
        headers,
        body: method === "GET" || method === "HEAD" ? undefined : body,
        redirect: "manual",
        signal: controller.signal,
        cache: "no-store",
      });

      const isRedirect = response.status >= 300 && response.status < 400;
      const location = response.headers.get("location");

      if (isRedirect && location) {
        if (hop === MAX_REDIRECTS) return failure("Too many redirects");
        target = new URL(location, safeUrl).toString();
        // 303, and 301/302 on POST, degrade to a bodyless GET per RFC 9110.
        if (response.status === 303 || (method === "POST" && response.status !== 307 && response.status !== 308)) {
          method = "GET";
          body = undefined;
        }
        continue;
      }

      const text = await readCappedText(response);
      const responseHeaders = headersToObject(response.headers);

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: text,
        contentType: response.headers.get("content-type") ?? "",
        durationMs: Date.now() - started,
        size: Number(response.headers.get("content-length")) || byteLength(text),
        via: "proxy",
      };
    }

    return failure("Too many redirects");
  } catch (error) {
    if (error instanceof BlockedUrlError) return failure(error.message);
    if (error instanceof DOMException && error.name === "AbortError") {
      return failure(`Request timed out after ${PROXY_TIMEOUT_MS} ms`);
    }
    return failure(error instanceof Error ? error.message : "Request failed");
  } finally {
    clearTimeout(timeout);
  }
}

"use client";

import {
  applyParams,
  buildExecRequest,
  byteLength,
  headersToObject,
  type ExecRequest,
  type ExecResult,
} from "@/lib/http";

/**
 * Request execution modes.
 *
 * - `browser`: fetch runs on the user's machine. Reaches localhost, private
 *   networks, and VPN-only hosts, and never touches our server. Blocked by CORS
 *   when the target does not opt in.
 * - `proxy`:   fetch runs on our server (/api/proxy). Ignores CORS, but cannot
 *   reach the user's private network and is SSRF-restricted to public hosts.
 * - `auto`:    try the browser first, fall back to the proxy when the browser
 *   fetch fails in a way that looks like CORS or a network block.
 */
export type SendMode = "auto" | "browser" | "proxy";

export const BROWSER_TIMEOUT_MS = 30_000;

export type SendInput = {
  method: string;
  url: string;
  headers?: unknown;
  parameters?: unknown;
  body?: unknown;
};

function failure(
  via: ExecResult["via"],
  error: string,
  durationMs: number
): ExecResult {
  return {
    ok: false,
    status: 0,
    statusText: "",
    headers: {},
    body: "",
    contentType: "",
    durationMs,
    size: 0,
    via,
    error,
  };
}

/**
 * A `TypeError` from fetch means the request never completed: CORS rejection,
 * DNS failure, refused connection, or mixed content. It is the only signal the
 * browser gives us, so it is what triggers the proxy fallback.
 */
function isNetworkOrCorsFailure(error: unknown): boolean {
  return error instanceof TypeError;
}

export async function executeInBrowser(request: ExecRequest): Promise<ExecResult> {
  const started = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BROWSER_TIMEOUT_MS);

  try {
    const target = applyParams(request.url, request.params);

    const response = await fetch(target, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      signal: controller.signal,
      mode: "cors",
      // Never attach the user's ambient cookies to a third-party API.
      credentials: "omit",
      redirect: "follow",
      cache: "no-store",
    });

    const text = await response.text();
    const durationMs = Math.round(performance.now() - started);

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      // Cross-origin responses only expose CORS-safelisted headers unless the
      // server sets Access-Control-Expose-Headers. Proxy mode sees all of them.
      headers: headersToObject(response.headers),
      body: text,
      contentType: response.headers.get("content-type") ?? "",
      durationMs,
      size: Number(response.headers.get("content-length")) || byteLength(text),
      via: "browser",
    };
  } catch (error) {
    const durationMs = Math.round(performance.now() - started);

    if (error instanceof DOMException && error.name === "AbortError") {
      return failure("browser", `Request timed out after ${BROWSER_TIMEOUT_MS} ms`, durationMs);
    }
    if (isNetworkOrCorsFailure(error)) {
      return failure(
        "browser",
        "Blocked by CORS or unreachable from the browser. Try proxy mode.",
        durationMs
      );
    }
    return failure(
      "browser",
      error instanceof Error ? error.message : "Request failed",
      durationMs
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function executeViaProxy(request: ExecRequest): Promise<ExecResult> {
  const started = performance.now();

  try {
    const response = await fetch("/api/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      return failure(
        "proxy",
        payload.error || `Proxy failed with ${response.status}`,
        Math.round(performance.now() - started)
      );
    }

    return (await response.json()) as ExecResult;
  } catch (error) {
    return failure(
      "proxy",
      error instanceof Error ? error.message : "Proxy request failed",
      Math.round(performance.now() - started)
    );
  }
}

/**
 * Send a request using the selected mode. Works for unsaved tabs: nothing here
 * needs a database id.
 */
export async function sendRequest(
  input: SendInput,
  mode: SendMode = "auto"
): Promise<ExecResult> {
  const request = buildExecRequest(input);

  if (!request.url) return failure("browser", "URL is required", 0);

  try {
    // Reject obviously malformed URLs before spending a round trip.
    new URL(request.url);
  } catch {
    return failure(
      "browser",
      "Invalid URL. Include the scheme, e.g. https://api.example.com",
      0
    );
  }

  if (mode === "proxy") return await executeViaProxy(request);
  if (mode === "browser") return await executeInBrowser(request);

  const browserResult = await executeInBrowser(request);

  // Only a transport-level failure is worth retrying through the proxy; a 4xx
  // or 5xx is a real answer from the target.
  const shouldFallBack =
    Boolean(browserResult.error) && browserResult.status === 0;

  if (!shouldFallBack) return browserResult;

  const proxyResult = await executeViaProxy(request);

  // If the proxy also failed, surface the browser error too - it is usually the
  // more actionable one (CORS vs. "private address blocked").
  if (proxyResult.error) {
    return {
      ...proxyResult,
      error: `${proxyResult.error} (browser: ${browserResult.error})`,
    };
  }

  return proxyResult;
}

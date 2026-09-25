import type { REST_METHOD } from "@prisma/client";

/**
 * Presentation rules for HTTP methods and response status.
 *
 * These lived duplicated across the tab bar, sidebar, method selector, response
 * pane, and run history - each with its own slightly different shade, so a GET
 * was one green in the sidebar and another in the tab bar. Defined once here,
 * against the design tokens in globals.css.
 */

export type MethodName = REST_METHOD | string;

/** Text colour only - for a method rendered inline, such as the selector. */
export const METHOD_TEXT: Record<string, string> = {
  GET: "text-method-get",
  POST: "text-method-post",
  PUT: "text-method-put",
  PATCH: "text-method-patch",
  DELETE: "text-method-delete",
};

/** Text plus a tinted background - for a method rendered as a badge. */
export const METHOD_BADGE: Record<string, string> = {
  GET: "text-method-get bg-method-get/10",
  POST: "text-method-post bg-method-post/10",
  PUT: "text-method-put bg-method-put/10",
  PATCH: "text-method-patch bg-method-patch/10",
  DELETE: "text-method-delete bg-method-delete/10",
};

export function methodText(method: MethodName): string {
  return METHOD_TEXT[String(method).toUpperCase()] ?? "text-zinc-400";
}

export function methodBadge(method: MethodName): string {
  return (
    METHOD_BADGE[String(method).toUpperCase()] ?? "text-zinc-400 bg-zinc-400/10"
  );
}

/** Colour a status code by its class. 0 means the request never completed. */
export function statusText(status: number): string {
  if (status >= 200 && status < 300) return "text-status-ok";
  if (status >= 300 && status < 400) return "text-status-redirect";
  if (status >= 400 && status < 500) return "text-status-client-error";
  if (status >= 500) return "text-status-server-error";
  return "text-zinc-500";
}

export function statusBadge(status: number): string {
  if (status >= 200 && status < 300) return "text-status-ok bg-status-ok/10";
  if (status >= 300 && status < 400)
    return "text-status-redirect bg-status-redirect/10";
  if (status >= 400 && status < 500)
    return "text-status-client-error bg-status-client-error/10";
  if (status >= 500)
    return "text-status-server-error bg-status-server-error/10";
  return "text-zinc-500 bg-zinc-500/10";
}

/** Short human label for a status class, shown next to the code. */
export function statusLabel(status: number): string {
  if (status === 0) return "No response";
  if (status < 200) return "Informational";
  if (status < 300) return "Success";
  if (status < 400) return "Redirect";
  if (status < 500) return "Client error";
  return "Server error";
}

export function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / Math.pow(1024, index);
  // Whole bytes read better without a decimal; larger units need one.
  return `${index === 0 ? value : parseFloat(value.toFixed(1))} ${units[index]}`;
}

export function formatDuration(ms?: number | null): string {
  if (ms === undefined || ms === null) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

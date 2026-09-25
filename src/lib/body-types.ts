import { BODY_TYPE } from "@prisma/client";

/**
 * Request body encoding.
 *
 * A body is stored as either a string (JSON, text, XML, GraphQL) or a list of
 * key/value fields (form-data, url-encoded). This module turns whichever is
 * stored into the bytes that go on the wire, plus the Content-Type that
 * describes them.
 *
 * File uploads are deliberately out of scope: a File cannot be serialized to the
 * server proxy, so supporting it in one mode and not the other would be worse
 * than not offering it. Form-data here carries text fields.
 */

export type BodyType = BODY_TYPE;

export const BODY_TYPES: { value: BodyType; label: string; hint: string }[] = [
  { value: "NONE", label: "None", hint: "No request body" },
  { value: "JSON", label: "JSON", hint: "application/json" },
  { value: "TEXT", label: "Text", hint: "text/plain" },
  { value: "XML", label: "XML", hint: "application/xml" },
  { value: "FORM_DATA", label: "Form Data", hint: "multipart/form-data" },
  { value: "URL_ENCODED", label: "URL Encoded", hint: "x-www-form-urlencoded" },
  { value: "GRAPHQL", label: "GraphQL", hint: "query + variables as JSON" },
];

export type BodyField = { key: string; value: string; enabled?: boolean };

/** Body types whose editor is a key/value grid rather than a text area. */
export function isFieldBody(type: BodyType): boolean {
  return type === "FORM_DATA" || type === "URL_ENCODED";
}

export function parseBodyFields(input: unknown): BodyField[] {
  let raw = input;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      raw = JSON.parse(trimmed);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return (raw as BodyField[])
    .filter((f) => f && typeof f === "object")
    .map((f) => ({
      key: String(f.key ?? ""),
      value: String(f.value ?? ""),
      enabled: f.enabled !== false,
    }));
}

/** The language id Monaco should use for a text-shaped body. */
export function monacoLanguageFor(type: BodyType): string {
  switch (type) {
    case "JSON":
      return "json";
    case "XML":
      return "xml";
    case "GRAPHQL":
      return "graphql";
    default:
      return "plaintext";
  }
}

const MULTIPART_BOUNDARY_PREFIX = "----ImpulseFormBoundary";

function buildMultipart(fields: BodyField[]): { body: string; contentType: string } {
  // Random enough to not collide with field content in practice, and stable for
  // the length of one request.
  const boundary = `${MULTIPART_BOUNDARY_PREFIX}${Math.random().toString(36).slice(2, 12)}`;

  const parts = fields
    .filter((f) => f.enabled !== false && f.key.trim())
    .map(
      (f) =>
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${f.key}"\r\n\r\n` +
        `${f.value}\r\n`
    );

  return {
    body: parts.join("") + `--${boundary}--\r\n`,
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

export type EncodedBody = {
  body?: string;
  contentType?: string;
};

/**
 * Encode a stored body for transmission. Returns no body for NONE, and no
 * Content-Type when the caller should be left to decide.
 */
export function encodeBody(type: BodyType, stored: unknown): EncodedBody {
  if (type === "NONE") return {};

  if (isFieldBody(type)) {
    const fields = parseBodyFields(stored);
    const active = fields.filter((f) => f.enabled !== false && f.key.trim());
    if (!active.length) return {};

    if (type === "URL_ENCODED") {
      const search = new URLSearchParams();
      for (const field of active) search.append(field.key, field.value);
      return {
        body: search.toString(),
        contentType: "application/x-www-form-urlencoded;charset=UTF-8",
      };
    }

    return buildMultipart(active);
  }

  const text = typeof stored === "string" ? stored : stored == null ? "" : String(stored);
  if (!text.trim()) return {};

  switch (type) {
    case "JSON":
      return { body: text, contentType: "application/json" };
    case "XML":
      return { body: text, contentType: "application/xml" };
    case "GRAPHQL":
      // GraphQL over HTTP is a JSON envelope. If the stored text is already that
      // envelope, send it through; otherwise treat it as the query itself.
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === "object" && "query" in parsed) {
          return { body: text, contentType: "application/json" };
        }
      } catch {
        // not JSON - fall through and wrap it
      }
      return {
        body: JSON.stringify({ query: text }),
        contentType: "application/json",
      };
    case "TEXT":
    default:
      return { body: text, contentType: "text/plain;charset=UTF-8" };
  }
}

import type { BODY_TYPE, REST_METHOD } from "@prisma/client";

import { parseAuth, type AuthConfig } from "@/lib/auth-schemes";
import { isFieldBody, parseBodyFields } from "@/lib/body-types";
import { toKeyValueMap } from "@/lib/http";

/**
 * Collection export.
 *
 * Import already existed; without export the product takes data in and refuses
 * to give it back. Two formats are produced from the same tree: Postman v2.1,
 * so collections are portable to the tool most teams already use, and a native
 * format that round-trips through this app's own importer without loss.
 */

export type ExportableRequest = {
  name: string;
  method: REST_METHOD | string;
  url: string;
  headers?: unknown;
  parameters?: unknown;
  body?: unknown;
  bodyType?: BODY_TYPE | null;
  auth?: unknown;
};

export type ExportableCollection = {
  name: string;
  requests: ExportableRequest[];
  children?: ExportableCollection[];
};

type PostmanKeyValue = { key: string; value: string; disabled?: boolean };

function toPostmanKeyValues(input: unknown): PostmanKeyValue[] {
  return Object.entries(toKeyValueMap(input)).map(([key, value]) => ({ key, value }));
}

/** Postman keeps the raw URL plus a parsed form; both are emitted. */
function toPostmanUrl(rawUrl: string, parameters: unknown) {
  const query = toPostmanKeyValues(parameters);
  const raw = rawUrl ?? "";

  try {
    // Variables like {{baseUrl}} are not valid URLs, so this often throws -
    // falling back to the raw string is correct, not an error case.
    const parsed = new URL(raw);
    return {
      raw,
      protocol: parsed.protocol.replace(":", ""),
      host: parsed.hostname.split("."),
      path: parsed.pathname.split("/").filter(Boolean),
      ...(query.length ? { query } : {}),
    };
  } catch {
    return { raw, ...(query.length ? { query } : {}) };
  }
}

function toPostmanAuth(auth: AuthConfig) {
  switch (auth.type) {
    case "bearer":
      return {
        type: "bearer",
        bearer: [{ key: "token", value: auth.token, type: "string" }],
      };
    case "basic":
      return {
        type: "basic",
        basic: [
          { key: "username", value: auth.username, type: "string" },
          { key: "password", value: auth.password, type: "string" },
        ],
      };
    case "apiKey":
      return {
        type: "apikey",
        apikey: [
          { key: "key", value: auth.key, type: "string" },
          { key: "value", value: auth.value, type: "string" },
          { key: "in", value: auth.in, type: "string" },
        ],
      };
    default:
      return { type: "noauth" };
  }
}

const RAW_LANGUAGE: Partial<Record<string, string>> = {
  JSON: "json",
  XML: "xml",
  TEXT: "text",
  GRAPHQL: "graphql",
};

function toPostmanBody(bodyType: BODY_TYPE | null | undefined, body: unknown) {
  const type = bodyType ?? "JSON";
  if (type === "NONE") return undefined;

  if (isFieldBody(type)) {
    const fields = parseBodyFields(body).map((f) => ({
      key: f.key,
      value: f.value,
      ...(f.enabled === false ? { disabled: true } : {}),
      type: "text",
    }));
    if (!fields.length) return undefined;
    return type === "FORM_DATA"
      ? { mode: "formdata", formdata: fields }
      : { mode: "urlencoded", urlencoded: fields };
  }

  const raw = typeof body === "string" ? body : body == null ? "" : String(body);
  if (!raw.trim()) return undefined;

  if (type === "GRAPHQL") {
    // Postman models GraphQL separately from raw bodies.
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && "query" in parsed) {
        return {
          mode: "graphql",
          graphql: {
            query: String(parsed.query ?? ""),
            variables: JSON.stringify(parsed.variables ?? {}),
          },
        };
      }
    } catch {
      // not an envelope - treat the text as the query itself
    }
    return { mode: "graphql", graphql: { query: raw, variables: "{}" } };
  }

  return {
    mode: "raw",
    raw,
    options: { raw: { language: RAW_LANGUAGE[type] ?? "text" } },
  };
}

function toPostmanItem(request: ExportableRequest) {
  const auth = parseAuth(request.auth);
  const body = toPostmanBody(request.bodyType, request.body);

  return {
    name: request.name || "Untitled Request",
    request: {
      method: String(request.method ?? "GET").toUpperCase(),
      header: toPostmanKeyValues(request.headers),
      url: toPostmanUrl(request.url, request.parameters),
      ...(auth.type !== "none" ? { auth: toPostmanAuth(auth) } : {}),
      ...(body ? { body } : {}),
    },
    response: [],
  };
}

function toPostmanFolder(collection: ExportableCollection): unknown {
  return {
    name: collection.name,
    item: [
      ...(collection.children ?? []).map(toPostmanFolder),
      ...collection.requests.map(toPostmanItem),
    ],
  };
}

/** A Postman v2.1 collection document. */
export function toPostmanCollection(collection: ExportableCollection) {
  return {
    info: {
      name: collection.name,
      schema:
        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      description: "Exported from Impulse",
    },
    item: [
      ...(collection.children ?? []).map(toPostmanFolder),
      ...collection.requests.map(toPostmanItem),
    ],
  };
}

/**
 * Native format. Deliberately shaped so this app's own importer reads it back
 * without loss, including the fields Postman has no place for.
 */
export function toImpulseCollection(collection: ExportableCollection) {
  const serialize = (node: ExportableCollection): unknown => ({
    name: node.name,
    requests: node.requests.map((request) => ({
      name: request.name,
      method: request.method,
      url: request.url,
      headers: toKeyValueMap(request.headers),
      parameters: toKeyValueMap(request.parameters),
      body: request.body ?? null,
      bodyType: request.bodyType ?? "JSON",
      auth: parseAuth(request.auth),
    })),
    children: (node.children ?? []).map(serialize),
  });

  return { format: "impulse-collection", version: 1, collections: [serialize(collection)] };
}

export type ExportFormat = "postman" | "impulse";

export function serializeCollection(
  collection: ExportableCollection,
  format: ExportFormat
): string {
  const document =
    format === "postman"
      ? toPostmanCollection(collection)
      : toImpulseCollection(collection);
  return JSON.stringify(document, null, 2);
}

/** Filesystem-safe filename for a downloaded collection. */
export function exportFilename(name: string, format: ExportFormat): string {
  const slug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "collection";
  return format === "postman"
    ? `${slug}.postman_collection.json`
    : `${slug}.impulse.json`;
}

import type { BODY_TYPE } from "@prisma/client";

import type { AuthConfig } from "@/lib/auth-schemes";

/**
 * cURL command parsing.
 *
 * Browser devtools, API docs, and error reports all hand you a `curl` command,
 * so pasting one is the fastest way into a request. The URL bar's placeholder
 * promised this before it existed; this makes the promise true.
 *
 * Scope is the flags that actually appear in copied commands - not a complete
 * implementation of curl's option surface.
 */

export type ParsedCurl = {
  method: string;
  url: string;
  headers: { key: string; value: string; enabled: boolean }[];
  parameters: { key: string; value: string; enabled: boolean }[];
  body?: string;
  bodyType: BODY_TYPE;
  auth?: AuthConfig;
};

/** True when the text looks like a curl command rather than a bare URL. */
export function looksLikeCurl(text: string): boolean {
  return /^\s*curl\s/i.test(text);
}

/**
 * Split a shell command into argv, honouring single and double quotes and
 * backslash line continuations. Not a full shell parser - no variable expansion
 * or subshells, which have no business in a pasted curl command anyway.
 */
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let started = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (quote) {
      if (char === "\\" && quote === '"' && i + 1 < input.length) {
        current += input[++i];
        continue;
      }
      if (char === quote) {
        quote = null;
        continue;
      }
      current += char;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      started = true;
      continue;
    }

    // Line continuation: a backslash before a newline joins the lines.
    if (char === "\\" && (input[i + 1] === "\n" || input[i + 1] === "\r")) {
      i++;
      if (input[i] === "\r" && input[i + 1] === "\n") i++;
      continue;
    }

    if (/\s/.test(char)) {
      if (current || started) {
        tokens.push(current);
        current = "";
        started = false;
      }
      continue;
    }

    current += char;
  }

  if (current || started) tokens.push(current);
  return tokens;
}

function splitOnce(text: string, separator: string): [string, string] {
  const index = text.indexOf(separator);
  if (index === -1) return [text.trim(), ""];
  return [text.slice(0, index).trim(), text.slice(index + separator.length).trim()];
}

function guessBodyType(body: string, contentType: string | undefined): BODY_TYPE {
  const type = (contentType ?? "").toLowerCase();
  if (type.includes("x-www-form-urlencoded")) return "URL_ENCODED";
  if (type.includes("multipart/form-data")) return "FORM_DATA";
  if (type.includes("xml")) return "XML";
  if (type.includes("graphql")) return "GRAPHQL";
  if (type.includes("json")) return "JSON";

  // No usable Content-Type: fall back to the body's own shape.
  const trimmed = body.trim();
  if (/^[[{]/.test(trimmed)) {
    try {
      JSON.parse(trimmed);
      return "JSON";
    } catch {
      /* not JSON after all */
    }
  }
  return "TEXT";
}

export function parseCurl(command: string): ParsedCurl | null {
  const tokens = tokenize(command.trim());
  if (!tokens.length) return null;
  if (tokens[0].toLowerCase() !== "curl") return null;

  let method = "";
  let url = "";
  const headers: ParsedCurl["headers"] = [];
  const dataParts: string[] = [];
  const formParts: { key: string; value: string; enabled: boolean }[] = [];
  let auth: AuthConfig | undefined;
  let isFormEncoded = false;

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    const next = () => tokens[++i] ?? "";

    switch (true) {
      case token === "-X" || token === "--request":
        method = next().toUpperCase();
        break;

      case token === "-H" || token === "--header": {
        const [key, value] = splitOnce(next(), ":");
        if (key) headers.push({ key, value, enabled: true });
        break;
      }

      case token === "-u" || token === "--user": {
        const [username, password] = splitOnce(next(), ":");
        auth = { type: "basic", username, password };
        break;
      }

      case token === "-d" ||
        token === "--data" ||
        token === "--data-raw" ||
        token === "--data-binary" ||
        token === "--data-ascii":
        dataParts.push(next());
        break;

      case token === "--data-urlencode":
        isFormEncoded = true;
        dataParts.push(next());
        break;

      case token === "-F" || token === "--form": {
        const [key, value] = splitOnce(next(), "=");
        if (key) formParts.push({ key, value, enabled: true });
        break;
      }

      case token === "--url":
        url = next();
        break;

      // Flags that carry no value and do not affect the request we build.
      case token === "-L" ||
        token === "--location" ||
        token === "--compressed" ||
        token === "-k" ||
        token === "--insecure" ||
        token === "-s" ||
        token === "--silent" ||
        token === "-i" ||
        token === "--include" ||
        token === "-v" ||
        token === "--verbose" ||
        token === "-g":
        break;

      // Flags that take a value we deliberately ignore.
      case token === "-o" || token === "--output" || token === "-A" || token === "--user-agent":
        next();
        break;

      default:
        if (!token.startsWith("-") && !url) url = token;
        break;
    }
  }

  if (!url) return null;

  // curl infers POST from a body when no method was given.
  const body = dataParts.join("&");
  if (!method) method = body || formParts.length ? "POST" : "GET";

  const contentType = headers.find((h) => h.key.toLowerCase() === "content-type")?.value;

  let bodyType: BODY_TYPE = "NONE";
  let finalBody: string | undefined;

  if (formParts.length) {
    bodyType = "FORM_DATA";
    finalBody = JSON.stringify(formParts);
  } else if (body) {
    bodyType = isFormEncoded ? "URL_ENCODED" : guessBodyType(body, contentType);
    if (bodyType === "URL_ENCODED") {
      const fields = body.split("&").map((pair) => {
        const [key, value] = splitOnce(pair, "=");
        return { key, value: decodeURIComponent(value ?? ""), enabled: true };
      });
      finalBody = JSON.stringify(fields);
    } else {
      finalBody = body;
    }
  }

  // Query params live in the URL; lift them out so they land on the Params tab.
  const parameters: ParsedCurl["parameters"] = [];
  let cleanUrl = url;
  const questionMark = url.indexOf("?");
  if (questionMark !== -1) {
    cleanUrl = url.slice(0, questionMark);
    const search = new URLSearchParams(url.slice(questionMark + 1));
    for (const [key, value] of search.entries()) {
      parameters.push({ key, value, enabled: true });
    }
  }

  return { method, url: cleanUrl, headers, parameters, body: finalBody, bodyType, auth };
}

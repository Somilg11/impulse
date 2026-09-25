/**
 * Environment variable substitution.
 *
 * `{{name}}` appearing anywhere in a URL, header, query parameter, or body is
 * replaced with the value from the active environment. This is the same syntax
 * Postman uses, so imported collections keep working.
 *
 * A variable with no match is left in place literally rather than replaced with
 * an empty string: silently sending `https:///users` because `{{baseUrl}}` was
 * undefined is far harder to debug than seeing the placeholder come back.
 */

export type Variable = {
  key: string;
  value: string;
  enabled?: boolean;
  /** Masked in the UI. Still sent in the request - this is not encryption. */
  secret?: boolean;
};

export type VariableMap = Record<string, string>;

/** `{{ name }}` - surrounding whitespace tolerated, names are trimmed. */
const VARIABLE_PATTERN = /\{\{\s*([^{}\s][^{}]*?)\s*\}\}/g;

export function toVariableMap(input: unknown): VariableMap {
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

  if (!Array.isArray(raw)) {
    if (raw && typeof raw === "object") {
      const out: VariableMap = {};
      for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
        if (!key.trim()) continue;
        out[key.trim()] = value == null ? "" : String(value);
      }
      return out;
    }
    return {};
  }

  const out: VariableMap = {};
  for (const entry of raw as Variable[]) {
    if (!entry || typeof entry !== "object") continue;
    if (entry.enabled === false) continue;
    const key = String(entry.key ?? "").trim();
    if (!key) continue;
    out[key] = String(entry.value ?? "");
  }
  return out;
}

/** Every distinct variable name referenced in `text`, in order of appearance. */
export function findVariables(text: string): string[] {
  if (!text) return [];
  const names: string[] = [];
  for (const match of text.matchAll(VARIABLE_PATTERN)) {
    const name = match[1].trim();
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

export type SubstitutionResult = {
  text: string;
  /** Names referenced but absent from the map. */
  missing: string[];
};

export function substitute(text: string, vars: VariableMap): SubstitutionResult {
  if (!text) return { text: text ?? "", missing: [] };

  const missing: string[] = [];

  const out = text.replace(VARIABLE_PATTERN, (whole, rawName: string) => {
    const name = rawName.trim();
    if (Object.prototype.hasOwnProperty.call(vars, name)) return vars[name];
    if (!missing.includes(name)) missing.push(name);
    return whole;
  });

  return { text: out, missing };
}

/** Substitute across a key/value map, resolving both keys and values. */
export function substituteMap(
  map: Record<string, string>,
  vars: VariableMap
): { map: Record<string, string>; missing: string[] } {
  const out: Record<string, string> = {};
  const missing: string[] = [];

  for (const [key, value] of Object.entries(map)) {
    const k = substitute(key, vars);
    const v = substitute(value, vars);
    out[k.text] = v.text;
    for (const name of [...k.missing, ...v.missing]) {
      if (!missing.includes(name)) missing.push(name);
    }
  }

  return { map: out, missing };
}

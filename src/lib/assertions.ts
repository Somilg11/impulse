import type { ExecResult } from "@/lib/http";

/**
 * Declarative response assertions.
 *
 * Postman runs arbitrary JavaScript for tests. That is powerful and also means
 * executing user code, which in a shared web app is a sandbox problem rather
 * than a feature. These assertions are declarative instead: they cover what
 * request tests actually check - status, duration, headers, body content, and
 * JSON fields - with no code execution anywhere.
 */

export type AssertionSource = "status" | "duration" | "size" | "header" | "body" | "json";

export type Comparator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "lessThan"
  | "greaterThan"
  | "exists"
  | "notExists"
  | "matches";

export type Assertion = {
  id: string;
  source: AssertionSource;
  /** Header name for `header`, dot/bracket path for `json`. Unused otherwise. */
  path?: string;
  comparator: Comparator;
  target: string;
  enabled?: boolean;
};

export type AssertionResult = {
  id: string;
  passed: boolean;
  label: string;
  actual: string;
  error?: string;
};

export const SOURCES: { value: AssertionSource; label: string; needsPath: boolean }[] = [
  { value: "status", label: "Status code", needsPath: false },
  { value: "duration", label: "Response time (ms)", needsPath: false },
  { value: "size", label: "Response size (bytes)", needsPath: false },
  { value: "header", label: "Header", needsPath: true },
  { value: "body", label: "Body (raw text)", needsPath: false },
  { value: "json", label: "JSON field", needsPath: true },
];

export const COMPARATORS: { value: Comparator; label: string; needsTarget: boolean }[] = [
  { value: "equals", label: "equals", needsTarget: true },
  { value: "notEquals", label: "does not equal", needsTarget: true },
  { value: "contains", label: "contains", needsTarget: true },
  { value: "notContains", label: "does not contain", needsTarget: true },
  { value: "lessThan", label: "is less than", needsTarget: true },
  { value: "greaterThan", label: "is greater than", needsTarget: true },
  { value: "matches", label: "matches regex", needsTarget: true },
  { value: "exists", label: "exists", needsTarget: false },
  { value: "notExists", label: "does not exist", needsTarget: false },
];

export function parseAssertions(input: unknown): Assertion[] {
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

  return (raw as Assertion[])
    .filter((a) => a && typeof a === "object")
    .map((a, index) => ({
      id: String(a.id ?? `assertion-${index}`),
      source: (a.source ?? "status") as AssertionSource,
      path: a.path ? String(a.path) : undefined,
      comparator: (a.comparator ?? "equals") as Comparator,
      target: String(a.target ?? ""),
      enabled: a.enabled !== false,
    }));
}

/**
 * Resolve a dot/bracket path against parsed JSON: `data.items[0].name`.
 * Returns `undefined` for any missing segment, which `exists` then reports on.
 */
export function resolveJsonPath(value: unknown, path: string): unknown {
  if (!path.trim()) return value;

  const segments = path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean);

  let current: unknown = value;
  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index)) return undefined;
      current = current[index];
      continue;
    }
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function stringify(value: unknown): string {
  if (value === undefined) return "";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function findHeaderValue(
  headers: Record<string, string>,
  name: string
): string | undefined {
  const target = name.trim().toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target) return value;
  }
  return undefined;
}

function extract(
  assertion: Assertion,
  result: ExecResult
): { value: unknown; label: string } {
  switch (assertion.source) {
    case "status":
      return { value: result.status, label: "Status code" };
    case "duration":
      return { value: result.durationMs, label: "Response time" };
    case "size":
      return { value: result.size, label: "Response size" };
    case "header":
      return {
        value: findHeaderValue(result.headers ?? {}, assertion.path ?? ""),
        label: `Header "${assertion.path ?? ""}"`,
      };
    case "body":
      return { value: result.body ?? "", label: "Body" };
    case "json": {
      try {
        const parsed = JSON.parse(result.body ?? "");
        return {
          value: resolveJsonPath(parsed, assertion.path ?? ""),
          label: `JSON ${assertion.path ?? "(root)"}`,
        };
      } catch {
        return { value: undefined, label: `JSON ${assertion.path ?? "(root)"}` };
      }
    }
    default:
      return { value: undefined, label: "Unknown" };
  }
}

function compare(
  value: unknown,
  comparator: Comparator,
  target: string
): { passed: boolean; error?: string } {
  const text = stringify(value);

  switch (comparator) {
    case "exists":
      return { passed: value !== undefined && value !== null };
    case "notExists":
      return { passed: value === undefined || value === null };
    case "equals":
      // Compare numerically when both sides look numeric, so "200" matches 200.
      if (typeof value === "number" && target.trim() !== "" && !Number.isNaN(Number(target))) {
        return { passed: value === Number(target) };
      }
      return { passed: text === target };
    case "notEquals":
      if (typeof value === "number" && target.trim() !== "" && !Number.isNaN(Number(target))) {
        return { passed: value !== Number(target) };
      }
      return { passed: text !== target };
    case "contains":
      return { passed: text.includes(target) };
    case "notContains":
      return { passed: !text.includes(target) };
    case "lessThan": {
      const left = Number(text);
      const right = Number(target);
      if (Number.isNaN(left) || Number.isNaN(right)) {
        return { passed: false, error: "Both values must be numeric" };
      }
      return { passed: left < right };
    }
    case "greaterThan": {
      const left = Number(text);
      const right = Number(target);
      if (Number.isNaN(left) || Number.isNaN(right)) {
        return { passed: false, error: "Both values must be numeric" };
      }
      return { passed: left > right };
    }
    case "matches":
      try {
        return { passed: new RegExp(target).test(text) };
      } catch {
        return { passed: false, error: "Invalid regular expression" };
      }
    default:
      return { passed: false, error: "Unknown comparator" };
  }
}

export function describeAssertion(assertion: Assertion): string {
  const source = SOURCES.find((s) => s.value === assertion.source);
  const comparator = COMPARATORS.find((c) => c.value === assertion.comparator);
  const subject =
    assertion.source === "header" || assertion.source === "json"
      ? `${source?.label} ${assertion.path ?? ""}`.trim()
      : source?.label ?? assertion.source;

  return comparator?.needsTarget
    ? `${subject} ${comparator.label} ${assertion.target}`
    : `${subject} ${comparator?.label ?? assertion.comparator}`;
}

export function runAssertions(
  assertions: Assertion[],
  result: ExecResult
): AssertionResult[] {
  return assertions
    .filter((a) => a.enabled !== false)
    .map((assertion) => {
      const { value, label } = extract(assertion, result);
      const { passed, error } = compare(value, assertion.comparator, assertion.target);

      return {
        id: assertion.id,
        passed,
        label: describeAssertion(assertion),
        actual: stringify(value) || "(empty)",
        error,
      };
    })
    .map((r) => ({ ...r, label: r.label || "Assertion" }));
}

export function summarize(results: AssertionResult[]): {
  passed: number;
  failed: number;
  total: number;
} {
  const passed = results.filter((r) => r.passed).length;
  return { passed, failed: results.length - passed, total: results.length };
}

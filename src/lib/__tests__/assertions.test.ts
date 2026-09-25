import { describe, expect, it } from "vitest";

import {
  describeAssertion,
  parseAssertions,
  resolveJsonPath,
  runAssertions,
  summarize,
  type Assertion,
} from "@/lib/assertions";
import type { ExecResult } from "@/lib/http";

const response: ExecResult = {
  ok: true,
  status: 200,
  statusText: "OK",
  headers: { "content-type": "application/json", "x-request-id": "abc" },
  body: JSON.stringify({ data: { items: [{ id: 7, name: "bob" }], total: 1 } }),
  contentType: "application/json",
  durationMs: 120,
  size: 64,
  via: "browser",
};

const one = (assertion: Partial<Assertion>) =>
  runAssertions(
    [
      {
        id: "a",
        source: "status",
        comparator: "equals",
        target: "200",
        enabled: true,
        ...assertion,
      } as Assertion,
    ],
    response
  )[0];

describe("resolveJsonPath", () => {
  const value = JSON.parse(response.body);

  it("walks objects and array indices", () => {
    expect(resolveJsonPath(value, "data.items[0].name")).toBe("bob");
    expect(resolveJsonPath(value, "data.total")).toBe(1);
  });

  it("returns undefined for a missing segment", () => {
    expect(resolveJsonPath(value, "data.nope.deep")).toBeUndefined();
  });

  it("returns the root for an empty path", () => {
    expect(resolveJsonPath(value, "")).toBe(value);
  });

  it("returns undefined for a non-numeric array index", () => {
    expect(resolveJsonPath(value, "data.items[x]")).toBeUndefined();
  });
});

describe("runAssertions", () => {
  it("compares a numeric source against a string target numerically", () => {
    expect(one({ source: "status", comparator: "equals", target: "200" }).passed).toBe(true);
    expect(one({ source: "status", comparator: "notEquals", target: "404" }).passed).toBe(true);
  });

  it("orders numbers", () => {
    expect(one({ source: "duration", comparator: "lessThan", target: "500" }).passed).toBe(true);
    expect(one({ source: "duration", comparator: "greaterThan", target: "500" }).passed).toBe(false);
  });

  it("looks headers up case-insensitively", () => {
    expect(
      one({ source: "header", path: "Content-Type", comparator: "contains", target: "json" })
        .passed
    ).toBe(true);
  });

  it("handles existence checks", () => {
    expect(one({ source: "header", path: "x-request-id", comparator: "exists", target: "" }).passed).toBe(true);
    expect(one({ source: "header", path: "x-absent", comparator: "notExists", target: "" }).passed).toBe(true);
    expect(one({ source: "json", path: "data.nope", comparator: "notExists", target: "" }).passed).toBe(true);
  });

  it("reads JSON fields by path", () => {
    expect(one({ source: "json", path: "data.items[0].id", comparator: "equals", target: "7" }).passed).toBe(true);
    expect(one({ source: "json", path: "data.items[0].name", comparator: "equals", target: "bob" }).passed).toBe(true);
  });

  it("matches the raw body against a regex", () => {
    expect(one({ source: "body", comparator: "matches", target: '"id":\\s*7' }).passed).toBe(true);
  });

  it("explains an invalid regex instead of just failing", () => {
    expect(one({ source: "body", comparator: "matches", target: "([a-" }).error).toBe(
      "Invalid regular expression"
    );
  });

  it("explains a non-numeric ordering comparison", () => {
    expect(one({ source: "body", comparator: "lessThan", target: "abc" }).error).toBe(
      "Both values must be numeric"
    );
  });

  it("treats an unparseable body as an absent JSON field", () => {
    const result = runAssertions(
      [{ id: "a", source: "json", path: "a.b", comparator: "notExists", target: "", enabled: true }],
      { ...response, body: "not json" }
    );
    expect(result[0].passed).toBe(true);
  });

  it("skips disabled assertions entirely", () => {
    expect(
      runAssertions(
        [{ id: "a", source: "status", comparator: "equals", target: "500", enabled: false }],
        response
      )
    ).toEqual([]);
  });

  it("reports the actual value for a failure", () => {
    const result = one({ source: "status", comparator: "equals", target: "404" });
    expect(result.passed).toBe(false);
    expect(result.actual).toBe("200");
  });
});

describe("parseAssertions", () => {
  it("fills in defaults and normalizes", () => {
    expect(parseAssertions('[{"source":"status","comparator":"equals","target":"200"}]')).toEqual([
      { id: "assertion-0", source: "status", comparator: "equals", target: "200", enabled: true, path: undefined },
    ]);
  });

  it("returns nothing for junk", () => {
    expect(parseAssertions("not json")).toEqual([]);
    expect(parseAssertions(null)).toEqual([]);
    expect(parseAssertions({})).toEqual([]);
  });
});

describe("summarize and describeAssertion", () => {
  it("counts passes and failures", () => {
    const results = runAssertions(
      [
        { id: "1", source: "status", comparator: "equals", target: "200", enabled: true },
        { id: "2", source: "status", comparator: "equals", target: "404", enabled: true },
      ],
      response
    );
    expect(summarize(results)).toEqual({ passed: 1, failed: 1, total: 2 });
  });

  it("describes an assertion in words", () => {
    expect(
      describeAssertion({ id: "1", source: "status", comparator: "equals", target: "200" })
    ).toBe("Status code equals 200");
    expect(
      describeAssertion({ id: "2", source: "header", path: "x-a", comparator: "exists", target: "" })
    ).toBe("Header x-a exists");
  });
});

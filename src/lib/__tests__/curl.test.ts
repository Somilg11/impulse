import { describe, expect, it } from "vitest";

import { looksLikeCurl, parseCurl } from "@/lib/curl";

describe("looksLikeCurl", () => {
  it("recognizes a command, with or without leading space", () => {
    expect(looksLikeCurl("curl https://a.test")).toBe(true);
    expect(looksLikeCurl("  CURL https://a.test")).toBe(true);
  });

  it("rejects a bare url", () => {
    expect(looksLikeCurl("https://a.test")).toBe(false);
    expect(looksLikeCurl("curling")).toBe(false);
  });
});

describe("parseCurl", () => {
  it("parses a realistic multi-line command", () => {
    const parsed = parseCurl(`curl -X POST 'https://api.test/v1/charges?limit=2' \\
      -H 'Content-Type: application/json' \\
      -H "Authorization: Bearer sk_123" \\
      -d '{"amount":2000}'`)!;

    expect(parsed.method).toBe("POST");
    expect(parsed.url).toBe("https://api.test/v1/charges");
    expect(parsed.parameters).toEqual([{ key: "limit", value: "2", enabled: true }]);
    expect(parsed.headers).toHaveLength(2);
    expect(parsed.body).toBe('{"amount":2000}');
    expect(parsed.bodyType).toBe("JSON");
  });

  it("infers POST when a body is present and no method was given", () => {
    expect(parseCurl("curl https://a.test -d 'a=1'")!.method).toBe("POST");
  });

  it("defaults to GET with no body", () => {
    expect(parseCurl("curl https://a.test")!.method).toBe("GET");
  });

  it("turns -u into basic auth", () => {
    expect(parseCurl("curl -u admin:s3cret https://a.test")!.auth).toEqual({
      type: "basic",
      username: "admin",
      password: "s3cret",
    });
  });

  it("ignores flags that do not change the request", () => {
    const parsed = parseCurl("curl -sSL --compressed -k -X DELETE https://a.test/1")!;
    expect(parsed.method).toBe("DELETE");
    expect(parsed.url).toBe("https://a.test/1");
  });

  it("skips the value of flags it deliberately drops", () => {
    const parsed = parseCurl("curl -o out.json https://a.test")!;
    expect(parsed.url).toBe("https://a.test");
  });

  it("reads -F as form-data", () => {
    const parsed = parseCurl("curl -F name=bob -F role=admin https://a.test")!;
    expect(parsed.bodyType).toBe("FORM_DATA");
    expect(JSON.parse(parsed.body!).map((f: { key: string }) => f.key)).toEqual([
      "name",
      "role",
    ]);
  });

  it("reads --data-urlencode as url-encoded fields", () => {
    const parsed = parseCurl("curl --data-urlencode 'q=a b' https://a.test")!;
    expect(parsed.bodyType).toBe("URL_ENCODED");
    expect(JSON.parse(parsed.body!)[0]).toEqual({ key: "q", value: "a b", enabled: true });
  });

  it("falls back to the body's shape when Content-Type is absent", () => {
    expect(parseCurl(`curl https://a.test -d '{"a":1}'`)!.bodyType).toBe("JSON");
    expect(parseCurl("curl https://a.test -d 'plain text'")!.bodyType).toBe("TEXT");
  });

  it("handles escaped quotes inside a double-quoted argument", () => {
    const parsed = parseCurl(`curl https://a.test -H "X-Note: say \\"hi\\""`)!;
    expect(parsed.headers[0]).toEqual({ key: "X-Note", value: 'say "hi"', enabled: true });
  });

  it("accepts --url instead of a positional url", () => {
    expect(parseCurl("curl --url https://a.test/x")!.url).toBe("https://a.test/x");
  });

  it("returns null for input that is not a curl command", () => {
    expect(parseCurl("https://a.test")).toBeNull();
    expect(parseCurl("")).toBeNull();
    expect(parseCurl("curl")).toBeNull();
  });
});

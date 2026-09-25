import { describe, expect, it } from "vitest";

import { applyAuth, describeAuth, parseAuth, type AuthConfig } from "@/lib/auth-schemes";

describe("parseAuth", () => {
  it("narrows each supported scheme", () => {
    expect(parseAuth({ type: "bearer", token: "t" })).toEqual({
      type: "bearer",
      token: "t",
    });
    expect(parseAuth({ type: "basic", username: "u", password: "p" })).toEqual({
      type: "basic",
      username: "u",
      password: "p",
    });
    expect(parseAuth({ type: "apiKey", key: "k", value: "v", in: "query" })).toEqual({
      type: "apiKey",
      key: "k",
      value: "v",
      in: "query",
    });
  });

  it("reads a JSON string", () => {
    expect(parseAuth('{"type":"bearer","token":"t"}')).toEqual({
      type: "bearer",
      token: "t",
    });
  });

  it("falls back to no auth for anything unrecognized", () => {
    expect(parseAuth(undefined).type).toBe("none");
    expect(parseAuth("").type).toBe("none");
    expect(parseAuth("garbage").type).toBe("none");
    expect(parseAuth({ type: "oauth9" }).type).toBe("none");
    expect(parseAuth(7).type).toBe("none");
  });

  it("defaults an apiKey to the header location", () => {
    expect(parseAuth({ type: "apiKey", key: "k", value: "v" })).toMatchObject({
      in: "header",
    });
  });
});

describe("applyAuth", () => {
  const empty = () => ({ headers: {} as Record<string, string>, params: {} as Record<string, string> });

  it("sets a bearer header", () => {
    const { headers } = applyAuth({ type: "bearer", token: "abc" }, {}, {});
    expect(headers.Authorization).toBe("Bearer abc");
  });

  it("ignores a blank bearer token", () => {
    const { headers } = applyAuth({ type: "bearer", token: "   " }, {}, {});
    expect(headers.Authorization).toBeUndefined();
  });

  it("base64-encodes basic credentials as UTF-8", () => {
    const { headers } = applyAuth(
      { type: "basic", username: "user", password: "pä55" },
      {},
      {}
    );
    expect(headers.Authorization).toBe(
      `Basic ${Buffer.from("user:pä55", "utf8").toString("base64")}`
    );
  });

  it("puts an api key in the header or the query as directed", () => {
    expect(
      applyAuth({ type: "apiKey", key: "X-Key", value: "v", in: "header" }, {}, {}).headers
    ).toEqual({ "X-Key": "v" });

    expect(
      applyAuth({ type: "apiKey", key: "api_key", value: "v", in: "query" }, {}, {}).params
    ).toEqual({ api_key: "v" });
  });

  it("never overwrites a header the user set by hand", () => {
    const existing = { Authorization: "Custom keep-me" };
    const { headers } = applyAuth({ type: "bearer", token: "abc" }, existing, {});
    expect(headers.Authorization).toBe("Custom keep-me");
  });

  it("matches an existing header case-insensitively", () => {
    const { headers } = applyAuth(
      { type: "bearer", token: "abc" },
      { authorization: "lowercase-wins" },
      {}
    );
    expect(headers).toEqual({ authorization: "lowercase-wins" });
  });

  it("does not mutate the inputs", () => {
    const { headers, params } = empty();
    applyAuth({ type: "bearer", token: "abc" }, headers, params);
    expect(headers).toEqual({});
    expect(params).toEqual({});
  });

  it("changes nothing for no auth", () => {
    const { headers, params } = applyAuth({ type: "none" }, { A: "1" }, { b: "2" });
    expect(headers).toEqual({ A: "1" });
    expect(params).toEqual({ b: "2" });
  });
});

describe("describeAuth", () => {
  it("summarizes each scheme", () => {
    const cases: [AuthConfig, string][] = [
      [{ type: "none" }, "No auth"],
      [{ type: "bearer", token: "t" }, "Bearer token"],
      [{ type: "bearer", token: "" }, "Bearer (empty)"],
      [{ type: "basic", username: "u", password: "" }, "Basic (u)"],
      [{ type: "apiKey", key: "K", value: "", in: "header" }, "API key (K)"],
    ];
    for (const [config, expected] of cases) {
      expect(describeAuth(config)).toBe(expected);
    }
  });
});

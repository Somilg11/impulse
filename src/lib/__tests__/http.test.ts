import { describe, expect, it } from "vitest";

import {
  applyParams,
  buildExecRequest,
  byteLength,
  findHeader,
  headersToObject,
  methodAllowsBody,
  toBodyString,
  toKeyValueMap,
} from "@/lib/http";

describe("toKeyValueMap", () => {
  it("reads the editor shape, honouring the enabled flag", () => {
    expect(
      toKeyValueMap(
        '[{"key":"Authorization","value":"Bearer x","enabled":true},' +
          '{"key":"X-Off","value":"1","enabled":false},' +
          '{"key":"","value":"blank"}]'
      )
    ).toEqual({ Authorization: "Bearer x" });
  });

  it("reads the importer shape", () => {
    expect(toKeyValueMap('{"Accept":"application/json"}')).toEqual({
      Accept: "application/json",
    });
  });

  it("accepts already-parsed values", () => {
    expect(toKeyValueMap([{ key: "a", value: "1" }])).toEqual({ a: "1" });
    expect(toKeyValueMap({ a: 1 })).toEqual({ a: "1" });
  });

  it("returns an empty map rather than throwing on junk", () => {
    expect(toKeyValueMap("")).toEqual({});
    expect(toKeyValueMap("not json")).toEqual({});
    expect(toKeyValueMap(null)).toEqual({});
    expect(toKeyValueMap(undefined)).toEqual({});
  });

  it("skips null values in object form", () => {
    expect(toKeyValueMap({ a: null, b: "1" })).toEqual({ b: "1" });
  });
});

describe("findHeader", () => {
  it("matches case-insensitively", () => {
    expect(findHeader({ "Content-Type": "application/json" }, "content-type")).toBe(
      "application/json"
    );
  });

  it("returns undefined when absent", () => {
    expect(findHeader({}, "accept")).toBeUndefined();
  });
});

describe("methodAllowsBody", () => {
  it("excludes GET and HEAD only", () => {
    expect(methodAllowsBody("GET")).toBe(false);
    expect(methodAllowsBody("head")).toBe(false);
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      expect(methodAllowsBody(method)).toBe(true);
    }
  });
});

describe("buildExecRequest", () => {
  it("infers application/json for a JSON body", () => {
    const request = buildExecRequest({
      method: "post",
      url: " https://a.test/x ",
      body: '{"a":1}',
    });
    expect(request.method).toBe("POST");
    expect(request.url).toBe("https://a.test/x");
    expect(request.headers["Content-Type"]).toBe("application/json");
  });

  it("infers text/plain for a non-JSON body", () => {
    const request = buildExecRequest({ method: "POST", url: "u", body: "hello" });
    expect(request.headers["Content-Type"]).toBe("text/plain;charset=UTF-8");
  });

  it("never overrides an explicit Content-Type", () => {
    const request = buildExecRequest({
      method: "POST",
      url: "u",
      body: "{}",
      headers: '[{"key":"content-type","value":"application/vnd.api+json"}]',
    });
    expect(request.headers["content-type"]).toBe("application/vnd.api+json");
    expect(request.headers["Content-Type"]).toBeUndefined();
  });

  it("drops the body for GET", () => {
    expect(buildExecRequest({ method: "GET", url: "u", body: '{"a":1}' }).body).toBeUndefined();
  });

  it("treats a whitespace-only body as absent", () => {
    expect(buildExecRequest({ method: "POST", url: "u", body: "   " }).body).toBeUndefined();
  });
});

describe("applyParams", () => {
  it("appends with ? when the url has no query", () => {
    expect(applyParams("https://a.test/x", { a: "1" })).toBe("https://a.test/x?a=1");
  });

  it("appends with & when it already does", () => {
    expect(applyParams("https://a.test/x?a=1", { b: "2" })).toBe("https://a.test/x?a=1&b=2");
  });

  it("returns the url untouched when there are no params", () => {
    expect(applyParams("https://a.test/x", {})).toBe("https://a.test/x");
  });

  it("encodes values", () => {
    expect(applyParams("u", { q: "a b&c" })).toBe("u?q=a+b%26c");
  });
});

describe("misc helpers", () => {
  it("measures byte length in UTF-8, not code units", () => {
    expect(byteLength("abc")).toBe(3);
    expect(byteLength("ä")).toBe(2);
  });

  it("stringifies stored bodies", () => {
    expect(toBodyString("x")).toBe("x");
    expect(toBodyString({ a: 1 })).toBe('{"a":1}');
    expect(toBodyString(null)).toBeUndefined();
    expect(toBodyString("")).toBeUndefined();
  });

  it("flattens a Headers instance", () => {
    const headers = new Headers({ "X-A": "1", "X-B": "2" });
    expect(headersToObject(headers)).toEqual({ "x-a": "1", "x-b": "2" });
  });
});

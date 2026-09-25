import { describe, expect, it } from "vitest";

import {
  exportFilename,
  serializeCollection,
  toImpulseCollection,
  toPostmanCollection,
  type ExportableCollection,
} from "@/lib/postman";

const tree: ExportableCollection = {
  name: "Payments",
  requests: [
    {
      name: "Create charge",
      method: "POST",
      url: "https://api.test/v1/charges",
      headers: '[{"key":"X-Trace","value":"1","enabled":true}]',
      parameters: '[{"key":"expand","value":"customer","enabled":true}]',
      body: '{"amount":2000}',
      bodyType: "JSON",
      auth: { type: "bearer", token: "sk_1" },
    },
  ],
  children: [{ name: "Refunds", requests: [], children: [] }],
};

describe("toPostmanCollection", () => {
  const document = toPostmanCollection(tree);

  it("declares the v2.1 schema", () => {
    expect(document.info.schema).toContain("v2.1.0");
    expect(document.info.name).toBe("Payments");
  });

  it("emits folders before requests", () => {
    expect(document.item[0]).toMatchObject({ name: "Refunds" });
    expect(document.item[1]).toMatchObject({ name: "Create charge" });
  });

  it("maps headers and query params to Postman's key/value form", () => {
    const request = (document.item[1] as { request: Record<string, unknown> }).request;
    expect(request.header).toEqual([{ key: "X-Trace", value: "1" }]);
    expect((request.url as { query: unknown }).query).toEqual([
      { key: "expand", value: "customer" },
    ]);
  });

  it("parses the url into host and path alongside the raw form", () => {
    const url = (document.item[1] as { request: { url: Record<string, unknown> } }).request.url;
    expect(url.raw).toBe("https://api.test/v1/charges");
    expect(url.host).toEqual(["api", "test"]);
    expect(url.path).toEqual(["v1", "charges"]);
  });

  it("falls back to the raw url when it contains variables", () => {
    const document = toPostmanCollection({
      name: "c",
      requests: [{ name: "r", method: "GET", url: "{{baseUrl}}/x" }],
    });
    const url = (document.item[0] as { request: { url: Record<string, unknown> } }).request.url;
    expect(url.raw).toBe("{{baseUrl}}/x");
    expect(url.host).toBeUndefined();
  });

  it("maps each auth scheme", () => {
    const bearer = (document.item[1] as { request: { auth: { type: string } } }).request.auth;
    expect(bearer.type).toBe("bearer");

    const basic = toPostmanCollection({
      name: "c",
      requests: [
        { name: "r", method: "GET", url: "u", auth: { type: "basic", username: "u", password: "p" } },
      ],
    });
    expect((basic.item[0] as { request: { auth: { type: string } } }).request.auth.type).toBe("basic");
  });

  it("omits auth entirely when there is none", () => {
    const document = toPostmanCollection({
      name: "c",
      requests: [{ name: "r", method: "GET", url: "u" }],
    });
    expect((document.item[0] as { request: Record<string, unknown> }).request.auth).toBeUndefined();
  });

  it("uses the right body mode per body type", () => {
    const modes = (bodyType: ExportableCollection["requests"][number]["bodyType"], body: unknown) => {
      const document = toPostmanCollection({
        name: "c",
        requests: [{ name: "r", method: "POST", url: "u", bodyType, body }],
      });
      return (document.item[0] as { request: { body?: { mode: string } } }).request.body?.mode;
    };

    expect(modes("JSON", "{}")).toBe("raw");
    expect(modes("FORM_DATA", [{ key: "a", value: "1" }])).toBe("formdata");
    expect(modes("URL_ENCODED", [{ key: "a", value: "1" }])).toBe("urlencoded");
    expect(modes("GRAPHQL", "{ a }")).toBe("graphql");
    expect(modes("NONE", "ignored")).toBeUndefined();
  });
});

describe("toImpulseCollection", () => {
  it("keeps the fields Postman has no place for", () => {
    const document = toImpulseCollection(tree);
    const request = document.collections[0] as {
      requests: { bodyType: string; auth: { type: string } }[];
    };
    expect(request.requests[0].bodyType).toBe("JSON");
    expect(request.requests[0].auth.type).toBe("bearer");
  });

  it("is tagged so the importer can recognize it", () => {
    expect(toImpulseCollection(tree).format).toBe("impulse-collection");
  });
});

describe("serializeCollection and exportFilename", () => {
  it("produces parseable JSON for both formats", () => {
    expect(() => JSON.parse(serializeCollection(tree, "postman"))).not.toThrow();
    expect(() => JSON.parse(serializeCollection(tree, "impulse"))).not.toThrow();
  });

  it("slugs the name and uses a format-appropriate extension", () => {
    expect(exportFilename("My API!", "postman")).toBe("my-api.postman_collection.json");
    expect(exportFilename("My API!", "impulse")).toBe("my-api.impulse.json");
  });

  it("falls back to a default name when the slug would be empty", () => {
    expect(exportFilename("!!!", "postman")).toBe("collection.postman_collection.json");
  });
});

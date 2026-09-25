import { describe, expect, it } from "vitest";

import {
  encodeBody,
  isFieldBody,
  monacoLanguageFor,
  parseBodyFields,
} from "@/lib/body-types";

describe("parseBodyFields", () => {
  it("reads a JSON string of field rows", () => {
    expect(parseBodyFields('[{"key":"a","value":"1"}]')).toEqual([
      { key: "a", value: "1", enabled: true },
    ]);
  });

  it("returns nothing for junk", () => {
    expect(parseBodyFields("nope")).toEqual([]);
    expect(parseBodyFields(null)).toEqual([]);
  });
});

describe("isFieldBody", () => {
  it("is true only for the grid-shaped types", () => {
    expect(isFieldBody("FORM_DATA")).toBe(true);
    expect(isFieldBody("URL_ENCODED")).toBe(true);
    expect(isFieldBody("JSON")).toBe(false);
  });
});

describe("monacoLanguageFor", () => {
  it("maps each text type to an editor language", () => {
    expect(monacoLanguageFor("JSON")).toBe("json");
    expect(monacoLanguageFor("XML")).toBe("xml");
    expect(monacoLanguageFor("GRAPHQL")).toBe("graphql");
    expect(monacoLanguageFor("TEXT")).toBe("plaintext");
  });
});

describe("encodeBody", () => {
  it("emits nothing for NONE", () => {
    expect(encodeBody("NONE", "ignored")).toEqual({});
  });

  it("emits nothing for an empty text body", () => {
    expect(encodeBody("JSON", "   ")).toEqual({});
  });

  it("passes JSON through with its content type", () => {
    expect(encodeBody("JSON", '{"a":1}')).toEqual({
      body: '{"a":1}',
      contentType: "application/json",
    });
  });

  it("url-encodes active fields only", () => {
    const encoded = encodeBody(
      "URL_ENCODED",
      '[{"key":"a","value":"1","enabled":true},{"key":"b","value":"2","enabled":false}]'
    );
    expect(encoded.body).toBe("a=1");
    expect(encoded.contentType).toBe("application/x-www-form-urlencoded;charset=UTF-8");
  });

  it("escapes url-encoded values", () => {
    expect(encodeBody("URL_ENCODED", [{ key: "q", value: "a b&c" }]).body).toBe(
      "q=a+b%26c"
    );
  });

  it("builds multipart with a boundary that matches the header", () => {
    const encoded = encodeBody("FORM_DATA", [{ key: "name", value: "bob" }]);
    const boundary = encoded.contentType?.split("boundary=")[1];
    expect(boundary).toBeTruthy();
    expect(encoded.body).toContain(`--${boundary}`);
    expect(encoded.body).toContain('Content-Disposition: form-data; name="name"');
    expect(encoded.body?.endsWith(`--${boundary}--\r\n`)).toBe(true);
  });

  it("emits nothing when every field is disabled", () => {
    expect(encodeBody("FORM_DATA", [{ key: "a", value: "1", enabled: false }])).toEqual({});
  });

  it("wraps a bare GraphQL query into the JSON envelope", () => {
    const encoded = encodeBody("GRAPHQL", "{ user { id } }");
    expect(JSON.parse(encoded.body!)).toEqual({ query: "{ user { id } }" });
    expect(encoded.contentType).toBe("application/json");
  });

  it("passes an existing GraphQL envelope through untouched", () => {
    const envelope = '{"query":"{ a }","variables":{"x":1}}';
    expect(encodeBody("GRAPHQL", envelope).body).toBe(envelope);
  });
});

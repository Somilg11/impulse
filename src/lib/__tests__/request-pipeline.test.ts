import { describe, expect, it } from "vitest";

import { composeRequest } from "@/lib/request-pipeline";

const vars = { baseUrl: "https://api.test", token: "sk_live_1", id: "42" };

describe("composeRequest", () => {
  it("resolves variables in the url", () => {
    const { request } = composeRequest(
      { method: "GET", url: "{{baseUrl}}/users/{{id}}" },
      vars
    );
    expect(request.url).toBe("https://api.test/users/42");
  });

  it("applies auth before substitution, so auth fields can use variables", () => {
    const { request } = composeRequest(
      { method: "GET", url: "u", auth: { type: "bearer", token: "{{token}}" } },
      vars
    );
    expect(request.headers.Authorization).toBe("Bearer sk_live_1");
  });

  it("reports missing variables and leaves them literal", () => {
    const { request, missingVariables } = composeRequest(
      { method: "GET", url: "{{nope}}/x" },
      vars
    );
    expect(request.url).toBe("{{nope}}/x");
    expect(missingVariables).toEqual(["nope"]);
  });

  it("collects missing names from every part of the request", () => {
    const { missingVariables } = composeRequest(
      {
        method: "POST",
        url: "{{a}}",
        headers: [{ key: "X", value: "{{b}}" }],
        parameters: [{ key: "q", value: "{{c}}" }],
        body: "{{d}}",
        bodyType: "TEXT",
      },
      {}
    );
    expect(missingVariables.sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("substitutes inside the body", () => {
    const { request } = composeRequest(
      { method: "POST", url: "u", bodyType: "JSON", body: '{"t":"{{token}}"}' },
      vars
    );
    expect(request.body).toBe('{"t":"sk_live_1"}');
  });

  it("substitutes inside form-data fields", () => {
    const { request } = composeRequest(
      {
        method: "POST",
        url: "u",
        bodyType: "FORM_DATA",
        body: [{ key: "t", value: "{{token}}" }],
      },
      vars
    );
    expect(request.body).toContain("sk_live_1");
  });

  it("puts an api key into the query when configured that way", () => {
    const { request } = composeRequest(
      {
        method: "GET",
        url: "u",
        auth: { type: "apiKey", key: "api_key", value: "v", in: "query" },
      },
      {}
    );
    expect(request.params.api_key).toBe("v");
  });

  it("lets a hand-set Authorization header beat the auth scheme", () => {
    const { request } = composeRequest(
      {
        method: "GET",
        url: "u",
        headers: [{ key: "Authorization", value: "Custom", enabled: true }],
        auth: { type: "bearer", token: "ignored" },
      },
      {}
    );
    expect(request.headers.Authorization).toBe("Custom");
  });

  it("drops the body on GET regardless of body type", () => {
    const { request } = composeRequest(
      { method: "GET", url: "u", bodyType: "JSON", body: '{"a":1}' },
      {}
    );
    expect(request.body).toBeUndefined();
  });

  it("defaults to JSON when no body type is stored", () => {
    const { request } = composeRequest({ method: "POST", url: "u", body: '{"a":1}' }, {});
    expect(request.headers["Content-Type"]).toBe("application/json");
  });

  it("uppercases the method and trims the url", () => {
    const { request } = composeRequest({ method: "post", url: "  u  " }, {});
    expect(request.method).toBe("POST");
    expect(request.url).toBe("u");
  });

  it("returns the parsed auth alongside the request", () => {
    const { auth } = composeRequest(
      { method: "GET", url: "u", auth: '{"type":"basic","username":"a","password":"b"}' },
      {}
    );
    expect(auth).toEqual({ type: "basic", username: "a", password: "b" });
  });
});

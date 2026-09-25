import { describe, expect, it } from "vitest";

import { CODE_TARGETS, generateCode } from "@/lib/codegen";
import type { ExecRequest } from "@/lib/http";

const request: ExecRequest = {
  method: "POST",
  url: "https://api.test/charges",
  headers: { "Content-Type": "application/json", Authorization: "Bearer sk_1" },
  params: { v: "1" },
  body: '{"amount":2000}',
};

describe("generateCode", () => {
  it("folds query params into the url for every target", () => {
    for (const target of CODE_TARGETS) {
      expect(generateCode(request, target.value)).toContain(
        "https://api.test/charges?v=1"
      );
    }
  });

  it("includes the headers for every target", () => {
    for (const target of CODE_TARGETS) {
      expect(generateCode(request, target.value)).toContain("Bearer sk_1");
    }
  });

  it("writes a curl command with method, headers and body", () => {
    const out = generateCode(request, "curl");
    expect(out).toContain("curl -X POST");
    expect(out).toContain("-H 'Authorization: Bearer sk_1'");
    expect(out).toContain(`-d '{"amount":2000}'`);
  });

  it("escapes single quotes safely for the shell", () => {
    const out = generateCode({ ...request, body: "it's" }, "curl");
    expect(out).toContain(`'it'\\''s'`);
  });

  it("writes valid-looking fetch", () => {
    const out = generateCode(request, "fetch");
    expect(out).toContain("await fetch(");
    expect(out).toContain('method: "POST"');
    expect(out).toContain('body: "{\\"amount\\":2000}"');
  });

  it("uses json= for a JSON body in python and data= otherwise", () => {
    expect(generateCode(request, "python")).toContain("json=payload");
    expect(generateCode({ ...request, body: "plain" }, "python")).toContain("data=payload");
  });

  it("uses a nil body in go when there is none", () => {
    const out = generateCode({ ...request, body: undefined }, "go");
    expect(out).toContain("nil)");
    expect(out).not.toContain("strings.NewReader");
  });

  it("parses a JSON body into an object for axios", () => {
    expect(generateCode(request, "axios")).toContain("data: {");
  });

  it("omits the body sections when there is no body", () => {
    const bodyless = { ...request, body: undefined };
    expect(generateCode(bodyless, "curl")).not.toContain("-d ");
    expect(generateCode(bodyless, "fetch")).not.toContain("body:");
  });
});

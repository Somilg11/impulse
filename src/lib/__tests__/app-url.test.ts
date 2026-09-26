import { afterEach, describe, expect, it } from "vitest";
import { absoluteUrl, appUrl, safeInternalPath } from "@/lib/app-url";

const original = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  if (original === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = original;
});

describe("appUrl", () => {
  it("strips a trailing slash", () => {
    // The deployed value carried one, which produced "//invite/<token>" in
    // generated links and duplicate entries in the sitemap.
    process.env.NEXT_PUBLIC_APP_URL = "https://impulse-api.vercel.app/";
    expect(appUrl()).toBe("https://impulse-api.vercel.app");
  });

  it("strips several trailing slashes", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com///";
    expect(appUrl()).toBe("https://example.com");
  });

  it("leaves a well-formed origin alone", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
    expect(appUrl()).toBe("https://example.com");
  });

  it("falls back to localhost when unset or blank", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(appUrl()).toBe("http://localhost:3000");

    process.env.NEXT_PUBLIC_APP_URL = "   ";
    expect(appUrl()).toBe("http://localhost:3000");
  });
});

describe("absoluteUrl", () => {
  it("joins without doubling the separator", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com/";
    expect(absoluteUrl("/invite/abc")).toBe("https://example.com/invite/abc");
    expect(absoluteUrl("invite/abc")).toBe("https://example.com/invite/abc");
  });

  it("never emits the string 'undefined' for an unset origin", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(absoluteUrl("/invite/abc")).not.toContain("undefined");
  });
});

describe("safeInternalPath", () => {
  it("keeps a same-origin path", () => {
    expect(safeInternalPath("/invite/abc")).toBe("/invite/abc");
    expect(safeInternalPath("/workspace?tab=1")).toBe("/workspace?tab=1");
  });

  it("falls back when absent", () => {
    expect(safeInternalPath(null)).toBe("/workspace");
    expect(safeInternalPath(undefined)).toBe("/workspace");
    expect(safeInternalPath("")).toBe("/workspace");
  });

  it("rejects a protocol-relative URL", () => {
    // A browser reads "//evil.example.com" as another origin, so this is the
    // open-redirect case that matters most.
    expect(safeInternalPath("//evil.example.com")).toBe("/workspace");
    expect(safeInternalPath("/\\evil.example.com")).toBe("/workspace");
  });

  it("rejects an absolute URL", () => {
    expect(safeInternalPath("https://evil.example.com")).toBe("/workspace");
    expect(safeInternalPath("http://evil.example.com/x")).toBe("/workspace");
    expect(safeInternalPath("javascript:alert(1)")).toBe("/workspace");
  });

  it("honours a caller-supplied fallback", () => {
    expect(safeInternalPath("https://evil.example.com", "/")).toBe("/");
  });
});

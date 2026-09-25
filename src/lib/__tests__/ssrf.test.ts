import { describe, expect, it } from "vitest";

import { assertUrlIsSafe, BlockedUrlError, isBlockedAddress } from "@/lib/ssrf";

/**
 * These double as security regression tests: each blocked range corresponds to
 * a way the server-side proxy could otherwise be turned into a gateway into the
 * host's private network.
 */
describe("isBlockedAddress", () => {
  const blocked = [
    "127.0.0.1", // loopback
    "127.1.2.3",
    "10.0.0.1", // RFC 1918
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254", // cloud metadata
    "0.0.0.0",
    "100.64.0.1", // carrier-grade NAT
    "224.0.0.1", // multicast
    "240.0.0.1", // reserved
    "::1", // IPv6 loopback
    "::",
    "fd00::1", // unique local
    "fe80::1", // link-local
    "::ffff:127.0.0.1", // IPv4-mapped loopback
  ];

  it.each(blocked)("blocks %s", (address) => {
    expect(isBlockedAddress(address)).toBe(true);
  });

  const allowed = ["8.8.8.8", "1.1.1.1", "93.184.216.34", "2606:4700::1111"];

  it.each(allowed)("allows %s", (address) => {
    expect(isBlockedAddress(address)).toBe(false);
  });

  it("refuses anything that is not an IP literal", () => {
    expect(isBlockedAddress("not-an-ip")).toBe(true);
  });

  it("blocks the boundaries of the 172.16/12 range but not outside it", () => {
    expect(isBlockedAddress("172.15.255.255")).toBe(false);
    expect(isBlockedAddress("172.16.0.0")).toBe(true);
    expect(isBlockedAddress("172.31.255.255")).toBe(true);
    expect(isBlockedAddress("172.32.0.0")).toBe(false);
  });
});

describe("assertUrlIsSafe", () => {
  it("rejects non-http protocols", async () => {
    await expect(assertUrlIsSafe("file:///etc/passwd")).rejects.toBeInstanceOf(
      BlockedUrlError
    );
    await expect(assertUrlIsSafe("gopher://a.test")).rejects.toThrow(/Unsupported protocol/);
  });

  it("rejects a malformed url", async () => {
    await expect(assertUrlIsSafe("not a url")).rejects.toThrow(/Invalid URL/);
  });

  it("rejects localhost by name", async () => {
    await expect(assertUrlIsSafe("http://localhost:3000")).rejects.toThrow(/localhost/);
    await expect(assertUrlIsSafe("http://app.localhost/")).rejects.toThrow(/localhost/);
  });

  it("rejects known cloud metadata hostnames", async () => {
    await expect(assertUrlIsSafe("http://metadata.google.internal/")).rejects.toThrow(
      /localhost/
    );
  });

  it("rejects a private IP literal", async () => {
    await expect(assertUrlIsSafe("http://169.254.169.254/latest/")).rejects.toThrow(
      /private address/
    );
    await expect(assertUrlIsSafe("http://[::1]/")).rejects.toThrow(/private address/);
  });

  it("allows a public IP literal", async () => {
    await expect(assertUrlIsSafe("https://8.8.8.8/")).resolves.toBeInstanceOf(URL);
  });

  it("honours the self-hosting escape hatch", async () => {
    const previous = process.env.IMPULSE_ALLOW_PRIVATE_HOSTS;
    process.env.IMPULSE_ALLOW_PRIVATE_HOSTS = "true";
    try {
      await expect(assertUrlIsSafe("http://localhost:3000")).resolves.toBeInstanceOf(URL);
    } finally {
      if (previous === undefined) delete process.env.IMPULSE_ALLOW_PRIVATE_HOSTS;
      else process.env.IMPULSE_ALLOW_PRIVATE_HOSTS = previous;
    }
  });
});

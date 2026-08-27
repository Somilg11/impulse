import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * SSRF guard for server-side request execution.
 *
 * Any endpoint that fetches a user-supplied URL from the server is, by default,
 * a proxy into the server's own network: cloud metadata endpoints, internal
 * services, and localhost admin ports all become reachable. Every server-side
 * fetch must pass through `assertUrlIsSafe` first.
 *
 * Self-hosters who deliberately want to reach private hosts (a local dev API on
 * the same machine as the server) can set IMPULSE_ALLOW_PRIVATE_HOSTS=true.
 *
 * Known residual risk: DNS rebinding. We resolve and validate the hostname, then
 * fetch by hostname, so a hostile resolver could return a public address for the
 * check and a private one for the connection. Closing that requires pinning the
 * connection to the validated IP via a custom dispatcher; the guard below stops
 * the common cases (direct IPs, localhost, metadata hostnames, redirects).
 */

export class BlockedUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlockedUrlError";
  }
}

function allowPrivateHosts(): boolean {
  return process.env.IMPULSE_ALLOW_PRIVATE_HOSTS === "true";
}

function ipv4ToInt(ip: string): number {
  return ip
    .split(".")
    .reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function inCidr(ip: string, cidr: string): boolean {
  const [range, bitsRaw] = cidr.split("/");
  const bits = Number(bitsRaw);
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(range) & mask);
}

const BLOCKED_V4 = [
  "0.0.0.0/8", // this network
  "10.0.0.0/8", // private
  "100.64.0.0/10", // carrier-grade NAT
  "127.0.0.0/8", // loopback
  "169.254.0.0/16", // link-local, incl. cloud metadata 169.254.169.254
  "172.16.0.0/12", // private
  "192.0.0.0/24", // IETF protocol assignments
  "192.0.2.0/24", // TEST-NET-1
  "192.168.0.0/16", // private
  "198.18.0.0/15", // benchmarking
  "198.51.100.0/24", // TEST-NET-2
  "203.0.113.0/24", // TEST-NET-3
  "224.0.0.0/4", // multicast
  "240.0.0.0/4", // reserved
];

export function isBlockedAddress(address: string): boolean {
  const version = isIP(address);

  if (version === 4) return BLOCKED_V4.some((cidr) => inCidr(address, cidr));

  if (version === 6) {
    const ip = address.toLowerCase();
    if (ip === "::" || ip === "::1") return true;
    // IPv4-mapped (::ffff:127.0.0.1) and IPv4-compatible addresses
    const mapped = ip.match(/^::(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isBlockedAddress(mapped[1]);
    // fc00::/7 unique local, fe80::/10 link-local
    if (/^f[cd]/.test(ip)) return true;
    if (/^fe[89ab]/.test(ip)) return true;
    return false;
  }

  return true; // not an IP literal we understand — refuse
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata",
  "metadata.google.internal",
  "metadata.goog",
]);

/**
 * Validate a user-supplied URL before the server fetches it.
 * Throws BlockedUrlError when the target is not safe to reach.
 */
export async function assertUrlIsSafe(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new BlockedUrlError("Invalid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new BlockedUrlError(`Unsupported protocol: ${url.protocol}`);
  }

  if (allowPrivateHosts()) return url;

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost")) {
    throw new BlockedUrlError(
      "Requests to localhost are blocked on the server. Use browser mode instead."
    );
  }

  if (isIP(hostname)) {
    if (isBlockedAddress(hostname)) {
      throw new BlockedUrlError(`Requests to private address ${hostname} are blocked`);
    }
    return url;
  }

  let addresses: { address: string }[];
  try {
    addresses = await lookup(hostname, { all: true });
  } catch {
    throw new BlockedUrlError(`Could not resolve host: ${hostname}`);
  }

  if (!addresses.length) {
    throw new BlockedUrlError(`Could not resolve host: ${hostname}`);
  }

  for (const { address } of addresses) {
    if (isBlockedAddress(address)) {
      throw new BlockedUrlError(
        `${hostname} resolves to a private address (${address}) and is blocked`
      );
    }
  }

  return url;
}

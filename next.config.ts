import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Content Security Policy.
 *
 * Two entries here are load-bearing and must not be tightened without
 * understanding what they enable:
 *
 * - `connect-src *` is REQUIRED. Browser execution mode sends requests from the
 *   user's own tab to arbitrary user-supplied APIs; restricting connect-src
 *   would break the core feature. The protection against abuse is that the
 *   request is the user's own, sent with `credentials: "omit"`.
 * - `'unsafe-eval'` is required by the Monaco editor, which compiles its
 *   tokenizers at runtime.
 *
 * `'unsafe-inline'` on script-src is Next.js's inline bootstrap. The upgrade
 * path is nonce-based CSP: generate a nonce in middleware, pass it through the
 * header, and drop 'unsafe-inline'. That is a deliberate follow-up, not an
 * oversight.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "connect-src *",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Clickjacking: frame-ancestors above is the modern control, this is the
  // fallback for older browsers.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Do not advertise the framework version to attackers scanning for known CVEs.
  poweredByHeader: false,

  // Emits a self-contained server bundle for a small production container.
  output: "standalone",

  images: {
    // OAuth avatars.
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Never let a proxied response be cached or indexed.
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;

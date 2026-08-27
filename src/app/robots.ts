import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Authenticated surfaces, the auth handler, and the proxy have nothing
      // useful to index and should never be crawled.
      disallow: ["/api/", "/workspace", "/workspace/", "/invite/", "/sign-in"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

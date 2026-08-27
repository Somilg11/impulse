import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { HotkeysProviders } from "@/components/hot-key-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const siteName = "Impulse";
const siteDescription =
  "A collaborative API client for teams. Test REST endpoints and WebSockets, share collections across workspaces, and send requests from your browser or through a hardened server proxy.";

export const metadata: Metadata = {
  // Required for Open Graph and canonical URLs to resolve to absolute paths.
  metadataBase: new URL(siteUrl),

  title: {
    default: `${siteName} — Collaborative API Client`,
    // Page-level titles render as "Workspace · Impulse".
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    "API client",
    "REST client",
    "Postman alternative",
    "API testing",
    "WebSocket debugger",
    "HTTP client",
    "developer tools",
  ],
  authors: [{ name: "Somil Gupta", url: "https://github.com/Somilg11" }],
  creator: "Somil Gupta",
  category: "developer tools",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    siteName,
    title: `${siteName} — Collaborative API Client`,
    description: siteDescription,
    url: siteUrl,
    locale: "en_US",
    images: [
      {
        url: "/preview.png",
        width: 1200,
        height: 630,
        alt: "The Impulse request playground",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: `${siteName} — Collaborative API Client`,
    description: siteDescription,
    images: ["/preview.png"],
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1117" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <HotkeysProviders>
              {children}
            </HotkeysProviders>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

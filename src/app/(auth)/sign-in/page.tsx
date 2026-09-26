"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, Github, Loader2 } from "lucide-react";

import { signIn } from "@/lib/auth-client";
import { safeInternalPath } from "@/lib/app-url";

type Provider = "github" | "google";

/** Google's mark, since lucide's Chrome icon is a browser, not the brand. */
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.84C6.71 7.29 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

const LoginPage = () => {
  const [pending, setPending] = useState<Provider | null>(null);
  const searchParams = useSearchParams();
  // Set when an invite link sent a signed-out visitor here; they return to the
  // invite once they have an account.
  const next = safeInternalPath(searchParams.get("next"));

  const start = (provider: Provider) => {
    // The redirect leaves the page, so this spinner is never cleared on success -
    // only on failure, where the catch restores the buttons.
    setPending(provider);
    signIn
      .social({ provider, callbackURL: next })
      .catch(() => setPending(null));
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-ink text-white antialiased [--tight:-0.035em]">
      {/* Back to the marketing site, positioned like a macOS window control */}
      <Link
        href="/"
        className="group absolute left-5 top-5 inline-flex items-center gap-1 text-[13px] text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Impulse
      </Link>

      <main className="flex flex-1 items-center justify-center px-5 py-20">
        <div className="w-full max-w-[22rem]">
          <div className="rise text-center">
            <h1 className="text-[32px] font-semibold leading-tight tracking-[var(--tight)]">
              Welcome back
            </h1>
            <p className="mt-2.5 text-[15px] text-zinc-500">
              Sign in to your workspace.
            </p>
          </div>

          <div
            className="rise mt-10 space-y-2.5"
            style={{ animationDelay: "80ms" }}
          >
            <button
              onClick={() => start("github")}
              disabled={pending !== null}
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-white text-[15px] font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending === "github" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Github className="h-[18px] w-[18px]" />
              )}
              Continue with GitHub
            </button>

            <button
              onClick={() => start("google")}
              disabled={pending !== null}
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-hairline-strong bg-white/[0.04] text-[15px] font-medium text-white transition-colors hover:bg-white/[0.08] disabled:opacity-50"
            >
              {pending === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleMark className="h-[18px] w-[18px]" />
              )}
              Continue with Google
            </button>
          </div>

          <p
            className="rise mt-8 text-center text-[12px] leading-relaxed text-zinc-600"
            style={{ animationDelay: "160ms" }}
          >
            A personal workspace is created automatically on your first sign-in.
          </p>
        </div>
      </main>

      <footer className="px-5 pb-8 text-center text-[12px] text-zinc-700">
        <Link href="/docs" className="transition-colors hover:text-zinc-500">
          Docs
        </Link>
        <span className="mx-3 text-zinc-800">·</span>
        <Link
          href="https://github.com/Somilg11/impulse"
          target="_blank"
          className="transition-colors hover:text-zinc-500"
        >
          GitHub
        </Link>
      </footer>
    </div>
  );
};

/**
 * useSearchParams needs a Suspense boundary, otherwise it opts the whole route
 * out of static rendering during the build.
 */
export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink" />}>
      <LoginPage />
    </Suspense>
  );
}

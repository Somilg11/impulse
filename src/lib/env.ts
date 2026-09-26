import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Environment validation.
 *
 * A missing secret should fail the process at startup with the variable's name,
 * not surface later as an opaque runtime error - a blank OAuth client id
 * otherwise shows up as a redirect loop on the sign-in page.
 */
export const env = createEnv({
    server: {
        // --- Database ------------------------------------------------------
        // Pooled connection for the app. Serverless hosts open a connection per
        // function instance, so this should be a pooler endpoint in production.
        DATABASE_URL: z.string().url(),
        // Direct connection for `prisma migrate` only; migrations take advisory
        // locks that do not survive a transaction pooler. Optional because the
        // running app never needs it.
        DIRECT_URL: z.string().url().optional(),

        // --- Auth ----------------------------------------------------------
        // Signs session cookies. A short secret is a weak secret, so the length
        // is enforced rather than merely required.
        BETTER_AUTH_SECRET: z.string().min(32),
        BETTER_AUTH_URL: z.string().url().optional(),

        GITHUB_CLIENT_ID: z.string().min(1),
        GITHUB_CLIENT_SECRET: z.string().min(1),
        GOOGLE_CLIENT_ID: z.string().min(1),
        GOOGLE_CLIENT_SECRET: z.string().min(1),

        // --- AI ------------------------------------------------------------
        // Optional: the app deploys and runs without it, and the two AI routes
        // answer 503 rather than the instance refusing to boot. The Google SDK
        // reads this from process.env itself; it is declared here so a typo is
        // caught at startup instead of at the first request.
        GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),

        // --- Proxy ---------------------------------------------------------
        // Lets proxy mode reach private/loopback addresses. Only enable when
        // the server runs on the same trusted machine as the APIs being tested
        // - on a shared deployment this turns the proxy into an SSRF hole.
        IMPULSE_ALLOW_PRIVATE_HOSTS: z.enum(["true", "false"]).optional(),
    },

    client: {
        // Public because invite links are built in the browser. Also anchors
        // Better Auth's callback URLs and decides whether session cookies get
        // the Secure flag, so it must be the real https origin in production.
        NEXT_PUBLIC_APP_URL: z.string().url(),
    },

    experimental__runtimeEnv: {
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    },

    /**
     * Docker image builds and CI runs compile the app without real secrets.
     * Setting SKIP_ENV_VALIDATION=1 lets those builds through; every other
     * environment still fails fast on a missing variable.
     */
    skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
});

/** Whether the AI-assisted endpoints can serve requests at all. */
export const isAiConfigured = () =>
    Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

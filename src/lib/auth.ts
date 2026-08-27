import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import db from "./db";
import { env } from "./env";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const auth = betterAuth({
    database: prismaAdapter(db, {
        provider: "postgresql",
    }),

    // Anchors callback URLs and decides whether cookies get the Secure flag
    // (derived from the protocol of this URL).
    baseURL: appUrl,

    /**
     * Origins allowed to initiate auth flows and receive redirects. Better Auth
     * validates callbackURL / redirectTo against this list, which is what stops
     * an open-redirect through the OAuth callback.
     */
    trustedOrigins: [appUrl],

    socialProviders: {
        github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
        },
        google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
    },

    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24,     // slide the expiry at most once a day
    },

    /**
     * Throttles the auth endpoints themselves. Better Auth enables this only in
     * production by default; turning it on explicitly means the limit is also
     * exercised in development instead of being discovered in production.
     *
     * Storage is in-memory, so each server instance keeps its own counters.
     * A horizontally scaled deployment should move this to the database or a
     * shared store - the same caveat as src/lib/rate-limit.ts.
     */
    rateLimit: {
        enabled: true,
        window: 60,
        max: 30,
    },
});

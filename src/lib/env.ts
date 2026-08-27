import {createEnv} from "@t3-oss/env-nextjs";
import {z} from "zod";

export const env = createEnv({
    server: {
        GITHUB_CLIENT_ID: z.string().min(1),
        GITHUB_CLIENT_SECRET: z.string().min(1),
        GOOGLE_CLIENT_ID: z.string().min(1),
        GOOGLE_CLIENT_SECRET: z.string().min(1),
        GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),

        // Lets proxy mode reach private/loopback addresses. Only enable when
        // the server runs on the same trusted machine as the APIs being tested
        // - on a shared deployment this turns the proxy into an SSRF hole.
        IMPULSE_ALLOW_PRIVATE_HOSTS: z.enum(["true", "false"]).optional(),
    },

    experimental__runtimeEnv: process.env,

    /**
     * Docker image builds and CI runs compile the app without real secrets.
     * Setting SKIP_ENV_VALIDATION=1 lets those builds through; every other
     * environment still fails fast on a missing variable.
     */
    skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
})
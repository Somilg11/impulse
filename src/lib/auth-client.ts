import { createAuthClient } from "better-auth/react";

/**
 * One client, no baseURL.
 *
 * Better Auth defaults to the origin the page was served from, which is the
 * correct target in every environment - localhost, a preview deployment, and a
 * custom domain - without configuration. It was previously pinned to
 * "http://localhost:3000", so in production the browser posted sign-out to a
 * host that was not the app: the request failed, the success callback never
 * ran, and the user stayed signed in with no error shown.
 *
 * There were also two clients in this file - `authClient` with the hardcoded
 * URL, and a second unconfigured one that `signIn` was exported from. Sign-in
 * therefore worked in production while sign-out did not, which is what made the
 * bug look inconsistent. Everything now comes from a single instance.
 */
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;

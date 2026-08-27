import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";

/**
 * Optimistic routing only: this checks for the presence of the session cookie
 * instead of making an HTTP round trip to /api/auth/get-session on every
 * navigation. Real authentication and authorization happen in the server
 * actions and route handlers (see src/lib/authz.ts).
 */
export function middleware(request: NextRequest) {
    const hasSession = Boolean(getSessionCookie(request));

    const isAuthPage = request.nextUrl.pathname.startsWith("/sign-in");
    const isWorkspacePage = request.nextUrl.pathname.startsWith("/workspace");

    if (isAuthPage && hasSession) {
        return NextResponse.redirect(new URL("/workspace", request.url));
    }

    if (isWorkspacePage && !hasSession) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/workspace/:path*", "/sign-in"],
};

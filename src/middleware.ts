import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const response = await fetch(new URL("/api/auth/get-session", request.url), {
        headers: {
            cookie: request.headers.get("cookie") || "",
        },
    });

    let session = null;
    if (response.ok) {
        session = await response.json().catch(() => null);
    }
    
    const isAuthPage = request.nextUrl.pathname.startsWith("/sign-in");
    const isWorkspacePage = request.nextUrl.pathname.startsWith("/workspace");

    if (isAuthPage && session?.user) {
        return NextResponse.redirect(new URL("/workspace", request.url));
    }

    if (isWorkspacePage && (!session || !session.user)) {
        return NextResponse.redirect(new URL("/", request.url));
    }
    
    return NextResponse.next();
}

export const config = {
    matcher: ["/workspace/:path*", "/sign-in"],
};

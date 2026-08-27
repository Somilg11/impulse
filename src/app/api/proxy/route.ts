import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/authz";
import { rateLimit } from "@/lib/rate-limit";
import { executeOnServer } from "@/lib/server-fetch";
import { METHODS, type ExecResult } from "@/lib/http";

/**
 * Proxy mode (Mode B).
 *
 * Executes a request from the server so the browser's CORS policy does not
 * block it. This endpoint is only safe because it is authenticated, rate
 * limited, and every target URL passes the SSRF guard in src/lib/ssrf.ts.
 *
 * Node runtime is required: the SSRF guard resolves DNS via node:dns.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  method: z.enum(METHODS),
  url: z.string().min(1).max(4096),
  headers: z.record(z.string(), z.string()).default({}),
  params: z.record(z.string(), z.string()).default({}),
  body: z.string().max(5 * 1024 * 1024).optional(),
});

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = rateLimit(`proxy:${user.id}`, 60, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many proxied requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let payload: z.infer<typeof payloadSchema>;
  try {
    payload = payloadSchema.parse(await request.json());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof z.ZodError ? "Invalid request payload" : "Invalid JSON" },
      { status: 400 }
    );
  }

  const result: ExecResult = await executeOnServer(payload);

  // Transport-level failures (blocked host, timeout, DNS) are reported as a
  // 200 with an `error` field so the client can render them next to a real
  // response instead of treating them as a proxy outage.
  return NextResponse.json(result);
}

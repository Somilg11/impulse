import { NextRequest, NextResponse } from 'next/server';
import { generateJsonBody } from '@/lib/ai-agents';
import { requireUser } from '@/lib/authz';
import { rateLimit } from '@/lib/rate-limit';
import { isAiConfigured } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    // The AI key is optional, so an instance deployed without one answers
    // honestly instead of failing inside the provider SDK.
    if (!isAiConfigured()) {
      return NextResponse.json(
        { error: 'AI suggestions are not configured on this deployment.' },
        { status: 503 }
      );
    }

    // Unauthenticated callers would otherwise burn the shared Gemini quota.
    const user = await requireUser();

    const limit = rateLimit(`ai:generate-json:${user.id}`, 20, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const { prompt, method, endpoint, context } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const result = await generateJsonBody({
      prompt,
      method,
      endpoint,
      context,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthzError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { suggestRequestName } from '@/lib/ai-agents';
import { requireUser } from '@/lib/authz';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    try {
        // Unauthenticated callers would otherwise burn the shared Gemini quota.
        const user = await requireUser();

        const limit = rateLimit(`ai:suggest-name:${user.id}`, 20, 60_000);
        if (!limit.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Try again shortly.' },
                { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
            );
        }

        const body = await request.json();
        const { workspaceName, method, url, description } = body;

        if (!workspaceName || !method) {
            return NextResponse.json(
                { error: 'Workspace name and method are required' },
                { status: 400 }
            );
        }

        const result = await suggestRequestName({
            workspaceName,
            method,
            url,
            description
        });

        if (!result.success) {
            const status = result.isQuotaError ? 429 : 500;
            return NextResponse.json(
                { error: result.error },
                { status }
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

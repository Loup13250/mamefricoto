import { NextResponse } from 'next/server';
import { SESSION_COOKIE, destroySession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function handleLogout(request) {
    const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
    if (sessionToken) {
        await destroySession(sessionToken).catch(() => {});
    }
    const response = NextResponse.redirect(new URL('/admin', request.url), 303);
    response.cookies.delete(SESSION_COOKIE);
    return response;
}

export async function POST(request) {
    return handleLogout(request);
}

export async function GET(request) {
    return handleLogout(request);
}

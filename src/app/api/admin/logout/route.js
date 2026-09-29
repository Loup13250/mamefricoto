import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    const response = NextResponse.redirect(new URL('/admin', request.url), 303);
    response.cookies.delete('admin_session');
    return response;
}

export async function GET(request) {
    const response = NextResponse.redirect(new URL('/admin', request.url), 303);
    response.cookies.delete('admin_session');
    return response;
}

import { NextResponse } from 'next/server';

export function proxy(request) {
    const { pathname } = request.nextUrl;

    // Protéger toutes les routes de l'espace administration (/admin/dashboard)
    if (pathname.startsWith('/admin/dashboard')) {
        const session = request.cookies.get('admin_session')?.value;
        if (!session || !/^[A-Za-z0-9_-]{43}$/.test(session)) {
            const loginUrl = new URL('/admin', request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/dashboard/:path*'],
};

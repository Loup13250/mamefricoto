import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
    SESSION_COOKIE,
    sessionCookieOptions,
    createSession,
    verifyPassword,
    hashPassword,
    clientIp,
    isRateLimited,
    registerHit,
    resetRateLimit,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function fail(error, status) {
    return NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
    try {
        let username = '';
        let password = '';

        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const body = await request.json();
            username = String(body.username ?? '').trim();
            password = String(body.password ?? '').trim();
        } else {
            const formData = await request.formData();
            username = String(formData.get('username') ?? '').trim();
            password = String(formData.get('password') ?? '').trim();
        }

        if (!username || !password) {
            return fail('Veuillez saisir votre identifiant et votre mot de passe.', 400);
        }

        const limitKey = `login:${clientIp(request.headers)}:${username.toLowerCase()}`;
        if (await isRateLimited(limitKey, MAX_ATTEMPTS, WINDOW_MS)) {
            return fail('Trop de tentatives. Réessayez dans quelques minutes.', 429);
        }

        const db = getDb();
        const user = await db.prepare('SELECT username, password FROM admin_users WHERE username = ?').get(username);
        const check = user ? await verifyPassword(password, user.password) : { ok: false };

        if (!user || !check.ok) {
            await registerHit(limitKey, WINDOW_MS);
            return fail('Identifiant ou mot de passe incorrect.', 401);
        }

        if (check.legacy) {
            await db
                .prepare('UPDATE admin_users SET password = ? WHERE username = ?')
                .run(await hashPassword(password), user.username);
        }

        await resetRateLimit(limitKey);
        const token = await createSession(user.username);

        const response = NextResponse.json(
            { success: true, redirect: '/admin/dashboard' },
            { headers: { 'Cache-Control': 'no-store' } }
        );
        response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
        return response;
    } catch (err) {
        console.error('API /api/admin/login error:', err);
        return fail('Erreur technique de connexion. Veuillez réessayer.', 500);
    }
}

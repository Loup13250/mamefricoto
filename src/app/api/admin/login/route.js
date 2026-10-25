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
import { logActivity } from '@/lib/logs';

export const dynamic = 'force-dynamic';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function fail(error, status) {
    return NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function describeBrowser(ua = '') {
    const os = /Windows/i.test(ua) ? 'Windows'
        : /iPhone|iPad|iOS/i.test(ua) ? 'iOS'
        : /Android/i.test(ua) ? 'Android'
        : /Mac OS X|Macintosh/i.test(ua) ? 'macOS'
        : /Linux/i.test(ua) ? 'Linux' : 'Appareil inconnu';
    const browser = /Edg\//i.test(ua) ? 'Edge'
        : /OPR\/|Opera/i.test(ua) ? 'Opera'
        : /Chrome\//i.test(ua) ? 'Chrome'
        : /Firefox\//i.test(ua) ? 'Firefox'
        : /Safari\//i.test(ua) ? 'Safari' : 'Navigateur inconnu';
    return `${browser} sur ${os}`;
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

        const ip = clientIp(request.headers);
        const browser = describeBrowser(request.headers.get('user-agent') || '');
        const limitKey = `login:${ip}:${username.toLowerCase()}`;
        if (await isRateLimited(limitKey, MAX_ATTEMPTS, WINDOW_MS)) {
            await logActivity({
                action: 'security',
                category: 'Connexions',
                summary: `Connexion bloquée : trop de tentatives pour « ${username.slice(0, 40)} »`,
                details: { identifiant: username.slice(0, 40), navigateur: browser, raison: 'Limite de 5 tentatives sur 15 minutes atteinte' },
                username: username.slice(0, 40),
                ip,
            });
            return fail('Trop de tentatives. Réessayez dans quelques minutes.', 429);
        }

        const db = getDb();
        const user = await db.prepare('SELECT username, password FROM admin_users WHERE username = ?').get(username);
        const check = user ? await verifyPassword(password, user.password) : { ok: false };

        if (!user || !check.ok) {
            await registerHit(limitKey, WINDOW_MS);
            await logActivity({
                action: 'login_failed',
                category: 'Connexions',
                summary: `Tentative de connexion échouée avec l'identifiant « ${username.slice(0, 40)} »`,
                details: { identifiant: username.slice(0, 40), navigateur: browser, raison: user ? 'Mot de passe incorrect' : 'Identifiant inconnu' },
                username: username.slice(0, 40),
                ip,
            });
            return fail('Identifiant ou mot de passe incorrect.', 401);
        }

        if (check.legacy) {
            await db
                .prepare('UPDATE admin_users SET password = ? WHERE username = ?')
                .run(await hashPassword(password), user.username);
        }

        await resetRateLimit(limitKey);
        const token = await createSession(user.username);
        await logActivity({
            action: 'login',
            category: 'Connexions',
            summary: `Connexion à l'administration réussie (${user.username})`,
            details: { navigateur: browser },
            username: user.username,
            ip,
        });

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

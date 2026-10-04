import crypto from 'crypto';
import { promisify } from 'util';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';

const scrypt = promisify(crypto.scrypt);

export const SESSION_COOKIE = 'admin_session';
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

let tablesReady = false;

async function ensureAuthTables() {
    if (tablesReady) return;
    await getDb().exec(`
        CREATE TABLE IF NOT EXISTS admin_sessions (
            token_hash TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            expires_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS rate_limits (
            key TEXT PRIMARY KEY,
            count INTEGER NOT NULL,
            window_start INTEGER NOT NULL
        );
    `);
    tablesReady = true;
}

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

export function hasSessionShape(token) {
    return typeof token === 'string' && TOKEN_PATTERN.test(token);
}

export function sessionCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_TTL_SECONDS,
        path: '/',
    };
}

/* Mots de passe */

export async function hashPassword(password) {
    const salt = crypto.randomBytes(16);
    const derived = await scrypt(password, salt, 64);
    return `scrypt$${salt.toString('base64')}$${derived.toString('base64')}`;
}

function safeEqual(a, b) {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Vérifie un mot de passe. Les anciens comptes en clair restent acceptés
 * (legacy: true) afin que l'appelant puisse les convertir en hash.
 */
export async function verifyPassword(password, stored) {
    if (typeof stored !== 'string' || !stored) return { ok: false, legacy: false };

    if (stored.startsWith('scrypt$')) {
        const [, saltB64, hashB64] = stored.split('$');
        if (!saltB64 || !hashB64) return { ok: false, legacy: false };
        const expected = Buffer.from(hashB64, 'base64');
        const derived = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length);
        return { ok: crypto.timingSafeEqual(derived, expected), legacy: false };
    }

    return { ok: safeEqual(password, stored), legacy: true };
}

/* Sessions */

export async function createSession(username) {
    await ensureAuthTables();
    const db = getDb();
    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;

    await db.prepare('DELETE FROM admin_sessions WHERE expires_at < ?').run(Date.now());
    await db
        .prepare('INSERT INTO admin_sessions (token_hash, username, expires_at) VALUES (?, ?, ?)')
        .run(hashToken(token), username, expiresAt);

    return token;
}

export async function verifySession(token) {
    if (!hasSessionShape(token)) return false;
    await ensureAuthTables();
    const row = await getDb()
        .prepare('SELECT expires_at FROM admin_sessions WHERE token_hash = ?')
        .get(hashToken(token));
    return Boolean(row) && Number(row.expires_at) > Date.now();
}

export async function destroySession(token) {
    if (!hasSessionShape(token)) return;
    await ensureAuthTables();
    await getDb().prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(hashToken(token));
}

export async function destroyAllSessions(username) {
    await ensureAuthTables();
    await getDb().prepare('DELETE FROM admin_sessions WHERE username = ?').run(username);
}

export async function getSessionUser(token) {
    if (!hasSessionShape(token)) return null;
    await ensureAuthTables();
    const row = await getDb()
        .prepare('SELECT username, expires_at FROM admin_sessions WHERE token_hash = ?')
        .get(hashToken(token));
    return row && Number(row.expires_at) > Date.now() ? row.username : null;
}

export async function isAdminRequest() {
    const store = await cookies();
    return verifySession(store.get(SESSION_COOKIE)?.value);
}

/* Limitation de débit */

export function clientIp(headers) {
    const forwarded = headers.get('x-forwarded-for');
    return (forwarded ? forwarded.split(',')[0] : headers.get('x-real-ip') || 'unknown').trim();
}

export async function isRateLimited(key, max, windowMs) {
    await ensureAuthTables();
    const row = await getDb().prepare('SELECT count, window_start FROM rate_limits WHERE key = ?').get(key);
    if (!row) return false;
    if (Date.now() - Number(row.window_start) > windowMs) return false;
    return Number(row.count) >= max;
}

export async function registerHit(key, windowMs) {
    await ensureAuthTables();
    const db = getDb();
    const now = Date.now();
    const row = await db.prepare('SELECT count, window_start FROM rate_limits WHERE key = ?').get(key);

    if (!row || now - Number(row.window_start) > windowMs) {
        await db
            .prepare('INSERT OR REPLACE INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)')
            .run(key, now);
        return;
    }
    await db.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').run(key);
}

export async function resetRateLimit(key) {
    await ensureAuthTables();
    await getDb().prepare('DELETE FROM rate_limits WHERE key = ?').run(key);
}

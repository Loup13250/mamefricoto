import crypto from 'crypto';

const AUTH_SECRET = process.env.AUTH_SECRET || 'mamefricoto-auth-secret-salt-eyguières-2026';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Creates an HMAC-SHA256 signed stateless session token.
 * Works seamlessly across serverless lambda instances (Vercel) without shared memory.
 */
export function createAdminSession(username) {
    const payload = JSON.stringify({
        u: username,
        exp: Date.now() + SESSION_TTL_MS,
    });
    const b64 = Buffer.from(payload).toString('base64url');
    const signature = crypto.createHmac('sha256', AUTH_SECRET).update(b64).digest('base64url');
    return `${b64}.${signature}`;
}

/**
 * Verifies the validity and expiration of an admin session token.
 */
export function verifyAdminSession(token) {
    if (!token || typeof token !== 'string') return false;

    // Backward compatibility for existing sessions
    if (token === 'authenticated') return true;

    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [b64, signature] = parts;
    const expected = crypto.createHmac('sha256', AUTH_SECRET).update(b64).digest('base64url');
    if (signature !== expected) return false;

    try {
        const data = JSON.parse(Buffer.from(b64, 'base64url').toString('utf-8'));
        if (!data.exp || Date.now() > data.exp) return false;
        return true;
    } catch {
        return false;
    }
}

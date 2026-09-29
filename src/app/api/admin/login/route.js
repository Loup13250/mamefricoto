import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        let username = '';
        let password = '';

        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const body = await request.json();
            username = (body.username || '').toString().trim();
            password = (body.password || '').toString().trim();
        } else {
            const formData = await request.formData();
            username = (formData.get('username') || '').toString().trim();
            password = (formData.get('password') || '').toString().trim();
        }

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Veuillez saisir votre identifiant et mot de passe.' },
                { status: 400 }
            );
        }

        const db = getDb();
        const user = await db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);

        if (user && user.password === password) {
            const response = NextResponse.json({ success: true, redirect: '/admin/dashboard' });

            response.cookies.set('admin_session', 'authenticated', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
            });

            return response;
        } else {
            return NextResponse.json(
                { error: 'Identifiant ou mot de passe incorrect.' },
                { status: 401 }
            );
        }
    } catch (err) {
        console.error('API /api/admin/login error:', err);
        return NextResponse.json(
            { error: 'Erreur technique de connexion : ' + (err.message || 'Erreur serveur') },
            { status: 500 }
        );
    }
}

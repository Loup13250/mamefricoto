import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SAFE_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/pdf',
]);

export async function GET(request, { params }) {
    try {
        const resolvedParams = await params;
        const id = resolvedParams?.id;
        if (!id || typeof id !== 'string' || id.includes('..') || id.includes('/')) {
            return new NextResponse('Not found', { status: 404 });
        }

        const db = getDb();
        const item = await db.prepare('SELECT mime_type, data FROM media_storage WHERE id = ?').get(id);

        if (!item || !item.data) {
            return new NextResponse('Media not found', { status: 404 });
        }

        let buffer;
        if (Buffer.isBuffer(item.data)) {
            buffer = item.data;
        } else if (item.data instanceof ArrayBuffer || item.data instanceof Uint8Array) {
            buffer = Buffer.from(item.data);
        } else if (typeof item.data === 'string') {
            const base64Data = item.data.replace(/^data:[^;]+;base64,/, '');
            buffer = Buffer.from(base64Data, 'base64');
        } else {
            buffer = Buffer.from(item.data);
        }

        const rawMime = (item.mime_type || 'image/jpeg').toLowerCase().split(';')[0].trim();
        const mimeType = SAFE_MIME_TYPES.has(rawMime) ? rawMime : 'application/octet-stream';

        const headers = {
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff',
            'Content-Security-Policy': "default-src 'none'; sandbox",
        };

        if (mimeType === 'application/pdf') {
            headers['Content-Disposition'] = 'inline; filename="document.pdf"';
        }

        return new NextResponse(buffer, { headers });
    } catch (err) {
        console.error('[Media API Error]:', err);
        return new NextResponse('Error loading media', { status: 500 });
    }
}

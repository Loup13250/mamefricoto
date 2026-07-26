import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
        const resolvedParams = await params;
        const id = resolvedParams?.id;
        if (!id) return new NextResponse('Not found', { status: 404 });

        const db = getDb();
        const item = await db.prepare('SELECT mime_type, data FROM media_storage WHERE id = ?').get(id);

        if (!item || !item.data) {
            return new NextResponse('Media not found', { status: 404 });
        }

        let buffer;
        if (typeof item.data === 'string') {
            const base64Data = item.data.replace(/^data:[^;]+;base64,/, '');
            buffer = Buffer.from(base64Data, 'base64');
        } else if (Buffer.isBuffer(item.data)) {
            buffer = item.data;
        } else {
            buffer = Buffer.from(item.data);
        }

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': item.mime_type || 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (err) {
        console.error('[Media API Error]:', err);
        return new NextResponse('Error loading media', { status: 500 });
    }
}

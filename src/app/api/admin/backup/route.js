import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');

    if (!session || session.value !== 'authenticated') {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    try {
        const db = getDb();

        const tables = [
            'site_info',
            'services',
            'weekly_menus',
            'weekly_menu_images',
            'gallery_posts',
            'carousel_images',
            'contact_messages',
            'media_storage'
        ];

        const backupData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: {}
        };

        for (const table of tables) {
            try {
                const rows = await db.prepare(`SELECT * FROM ${table}`).all();
                backupData.data[table] = rows;
            } catch (err) {
                console.warn(`Backup: could not export table ${table}`, err);
                backupData.data[table] = [];
            }
        }

        const dateStr = new Date().toISOString().split('T')[0];
        const jsonContent = JSON.stringify(backupData, null, 2);

        return new NextResponse(jsonContent, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="mamefricoto_backup_${dateStr}.json"`,
            },
        });
    } catch (err) {
        console.error('Failed to create backup:', err);
        return NextResponse.json({ error: 'Erreur lors de la création de la sauvegarde' }, { status: 500 });
    }
}

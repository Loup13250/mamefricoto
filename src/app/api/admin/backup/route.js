import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function encodeBinary(rows) {
    return rows.map((row) => {
        const data = row.data;
        if (data == null || typeof data === 'string') return row;
        return { ...row, data: Buffer.from(data).toString('base64'), data_encoding: 'base64' };
    });
}

export async function GET() {
    if (!(await isAdminRequest())) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    try {
        const db = getDb();

        const tables = [
            'site_info',
            'services',
            'pricing_documents',
            'fixed_prices',
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
                backupData.data[table] = table === 'media_storage' ? encodeBinary(rows) : rows;
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
                'Cache-Control': 'no-store',
                'Content-Disposition': `attachment; filename="mamefricoto_backup_${dateStr}.json"`,
            },
        });
    } catch (err) {
        console.error('Failed to create backup:', err);
        return NextResponse.json({ error: 'Erreur lors de la création de la sauvegarde' }, { status: 500 });
    }
}

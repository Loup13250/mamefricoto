import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db;

export function getDb() {
    if (db) return db;

    let dbPath = path.join(process.cwd(), 'database', 'mamefricoto.db');
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');

    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        const tempDbPath = path.join('/tmp', 'mamefricoto.db');
        if (!fs.existsSync(tempDbPath)) {
            try {
                const tempDir = path.dirname(tempDbPath);
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }

                if (fs.existsSync(dbPath)) {
                    fs.copyFileSync(dbPath, tempDbPath);
                }
            } catch (err) {
                console.error("Failed to copy database to /tmp:", err);
            }
        }
        dbPath = tempDbPath;
    } else {
        const targetDir = path.dirname(dbPath);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
    }

    try {
        db = new Database(dbPath);
        if (!process.env.VERCEL) {
            try {
                db.pragma('journal_mode = WAL');
            } catch (pragmaErr) {
                console.warn("Failed to set WAL journal mode:", pragmaErr);
            }
        }
    } catch (dbErr) {
        console.error("Failed to initialize database:", dbErr);
        throw dbErr;
    }

    if (fs.existsSync(schemaPath)) {
        try {
            const schema = fs.readFileSync(schemaPath, 'utf-8');
            db.exec(schema);

            // Safe column additions for existing DBs
            try { db.prepare("ALTER TABLE weekly_menus ADD COLUMN embed_url TEXT").run(); } catch {}
            try { db.prepare("ALTER TABLE gallery_posts ADD COLUMN media_type TEXT DEFAULT 'image'").run(); } catch {}
            try { db.prepare("ALTER TABLE contact_messages ADD COLUMN status TEXT DEFAULT 'nouveau'").run(); } catch {}
            try { db.prepare("ALTER TABLE contact_messages ADD COLUMN admin_notes TEXT DEFAULT ''").run(); } catch {}
        } catch (schemaErr) {
            console.error("Failed to run schema check:", schemaErr);
        }
    }

    // Auto-seed default content if tables are empty (especially on Vercel fresh deployment)
    try {
        const menuCount = db.prepare('SELECT COUNT(*) as count FROM weekly_menus').get()?.count || 0;
        if (menuCount === 0) {
            const res = db.prepare(`
                INSERT INTO weekly_menus (title, description, image_url, embed_url, is_current)
                VALUES (
                    'Menu du 15 au 18 Juillet',
                    'Découvrez le menu de la semaine de Mamé Fricoto : Tarte tatin aubergines & tomates, Cake au citron, Riz safran chorizo, Salade de lentilles, Tortilla froide...',
                    '/uploads/insta-menu-1.png',
                    'https://www.instagram.com/p/Dax0CDnjTLJ/',
                    1
                )
            `).run();

            const menuId = res.lastInsertRowid;
            const images = [
                '/uploads/insta-menu-1.png',
                '/uploads/insta-menu-2.png',
                '/uploads/insta-menu-3.png',
                '/uploads/insta-menu-4.png',
                '/uploads/insta-menu-5.png'
            ];
            const stmt = db.prepare('INSERT INTO weekly_menu_images (menu_id, image_url, display_order) VALUES (?, ?, ?)');
            images.forEach((img, idx) => stmt.run(menuId, img, idx + 1));
        }
    } catch (seedErr) {
        console.error("Failed to seed default weekly menu:", seedErr);
    }

    try {
        const galleryCount = db.prepare('SELECT COUNT(*) as count FROM gallery_posts').get()?.count || 0;
        if (galleryCount === 0) {
            const galleryStmt = db.prepare('INSERT INTO gallery_posts (title, caption, image_url, media_type, display_order) VALUES (?, ?, ?, ?, ?)');
            galleryStmt.run('Menu de la semaine', 'Formule complète & plats faits maison', '/uploads/insta-menu-1.png', 'image', 1);
            galleryStmt.run('Les plats du jour', 'Riz safran, salade de lentilles, tortilla', '/uploads/insta-menu-2.png', 'image', 2);
            galleryStmt.run('Les formules & tarifs', 'Plat seul 12€, Formule 15€/18€', '/uploads/insta-menu-3.png', 'image', 3);
            galleryStmt.run('En cuisine avec Mamé', 'Labo à domicile à Eyguières', '/uploads/insta-menu-5.png', 'image', 4);
        }
    } catch (gallerySeedErr) {
        console.error("Failed to seed default gallery:", gallerySeedErr);
    }

    try {
        const carouselCount = db.prepare('SELECT COUNT(*) as count FROM carousel_images').get()?.count || 0;
        if (carouselCount === 0) {
            const carouselStmt = db.prepare('INSERT INTO carousel_images (title, subtitle, image_url, display_order) VALUES (?, ?, ?, ?)');
            carouselStmt.run('Cuisine Familiale & Fait Maison', 'Livraison & Retrait à Eyguières', '/uploads/insta-menu-1.png', 1);
            carouselStmt.run('Plats Frais & Généreux', 'Préparés avec amour chaque jour', '/uploads/insta-menu-2.png', 2);
        }
    } catch (carouselSeedErr) {
        console.error("Failed to seed default carousel:", carouselSeedErr);
    }

    return db;
}

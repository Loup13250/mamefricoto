import path from 'path';
import fs from 'fs';

let dbWrapper;
let localDbInstance;
let lastCloudSyncTime = 0;
let localDataVersion = 0;

// Bucket de synchronisation cloud automatique pour Vercel Serverless
const CLOUD_KV_URL = 'https://kvdb.io/MF894372984712398/mamefricoto_db_v4';

async function fetchCloudDb() {
    try {
        const res = await fetch(CLOUD_KV_URL, { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            return data;
        }
    } catch (e) {
        console.error("[Cloud DB] Sync fetch error:", e);
    }
    return null;
}

async function saveCloudDb(data) {
    try {
        await fetch(CLOUD_KV_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            cache: 'no-store'
        });
    } catch (e) {
        console.error("[Cloud DB] Sync save error:", e);
    }
}

function exportDbTables(db) {
    try {
        return {
            updated_at: Date.now(),
            is_seeded: true,
            site_info: db.prepare('SELECT * FROM site_info').all(),
            weekly_menus: db.prepare('SELECT * FROM weekly_menus').all(),
            weekly_menu_images: db.prepare('SELECT * FROM weekly_menu_images').all(),
            contact_messages: db.prepare('SELECT * FROM contact_messages').all(),
            gallery_posts: db.prepare('SELECT * FROM gallery_posts').all(),
            carousel_images: db.prepare('SELECT * FROM carousel_images').all(),
        };
    } catch (e) {
        console.error("[Cloud DB] Export error:", e);
        return null;
    }
}

function importDbTables(db, data) {
    if (!data || typeof data !== 'object') return;
    try {
        db.exec('BEGIN TRANSACTION;');
        if (data.site_info && Array.isArray(data.site_info)) {
            db.exec('DELETE FROM site_info;');
            const stmt = db.prepare('INSERT OR REPLACE INTO site_info (key, value) VALUES (?, ?)');
            for (const row of data.site_info) {
                stmt.run(row.key, row.value);
            }
        }
        if (data.weekly_menus && Array.isArray(data.weekly_menus)) {
            db.exec('DELETE FROM weekly_menus;');
            const stmt = db.prepare('INSERT OR REPLACE INTO weekly_menus (id, title, description, image_url, embed_url, is_current, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
            for (const row of data.weekly_menus) {
                stmt.run(row.id, row.title, row.description, row.image_url, row.embed_url, row.is_current ? 1 : 0, row.created_at || new Date().toISOString());
            }
        }
        if (data.weekly_menu_images && Array.isArray(data.weekly_menu_images)) {
            db.exec('DELETE FROM weekly_menu_images;');
            const stmt = db.prepare('INSERT OR REPLACE INTO weekly_menu_images (id, menu_id, image_url, display_order) VALUES (?, ?, ?, ?)');
            for (const row of data.weekly_menu_images) {
                stmt.run(row.id, row.menu_id, row.image_url, row.display_order || 0);
            }
        }
        if (data.contact_messages && Array.isArray(data.contact_messages)) {
            db.exec('DELETE FROM contact_messages;');
            const stmt = db.prepare('INSERT OR REPLACE INTO contact_messages (id, name, email, phone, event_type, event_date, guests, message, is_read, status, admin_notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            for (const row of data.contact_messages) {
                stmt.run(row.id, row.name, row.email, row.phone, row.event_type, row.event_date, row.guests, row.message, row.is_read ? 1 : 0, row.status || 'nouveau', row.admin_notes || '', row.created_at || new Date().toISOString());
            }
        }
        if (data.gallery_posts && Array.isArray(data.gallery_posts)) {
            db.exec('DELETE FROM gallery_posts;');
            const stmt = db.prepare('INSERT OR REPLACE INTO gallery_posts (id, title, caption, image_url, media_type, display_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
            for (const row of data.gallery_posts) {
                stmt.run(row.id, row.title, row.caption, row.image_url, row.media_type || 'image', row.display_order || 0, row.created_at || new Date().toISOString());
            }
        }
        if (data.carousel_images && Array.isArray(data.carousel_images)) {
            db.exec('DELETE FROM carousel_images;');
            const stmt = db.prepare('INSERT OR REPLACE INTO carousel_images (id, title, subtitle, image_url, display_order) VALUES (?, ?, ?, ?, ?)');
            for (const row of data.carousel_images) {
                stmt.run(row.id, row.title, row.subtitle, row.image_url, row.display_order || 0);
            }
        }
        db.exec('COMMIT;');
        if (data.updated_at) localDataVersion = data.updated_at;
    } catch (err) {
        try { db.exec('ROLLBACK;'); } catch {}
        console.error("[Cloud DB] Import error:", err);
    }
}

async function syncVercelCloudState(db) {
    const isVercel = Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production');
    if (!isVercel) return;
    const now = Date.now();
    if (now - lastCloudSyncTime < 1500) return;
    lastCloudSyncTime = now;

    let cloudData = await fetchCloudDb();
    
    // Si le bucket cloud est vierge/absent, l'initialiser immédiatement avec les 4 prestations traiteur de départ
    if (!cloudData || !cloudData.is_seeded) {
        const seedData = exportDbTables(db);
        if (seedData) {
            await saveCloudDb(seedData);
            localDataVersion = seedData.updated_at;
        }
        return;
    }

    if (cloudData.updated_at && cloudData.updated_at > localDataVersion) {
        importDbTables(db, cloudData);
    }
}

async function persistVercelCloudState(db) {
    const isVercel = Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production');
    if (!isVercel) return;
    const data = exportDbTables(db);
    if (data) {
        localDataVersion = data.updated_at;
        lastCloudSyncTime = Date.now();
        await saveCloudDb(data);
    }
}

export function getDb() {
    if (dbWrapper) return dbWrapper;

    const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || process.env.DATABASE_URL;
    const tursoToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;

    if (tursoUrl && (tursoUrl.startsWith('libsql') || tursoUrl.startsWith('https'))) {
        try {
            const { createClient } = require('@libsql/client');
            const client = createClient({
                url: tursoUrl,
                authToken: tursoToken,
            });

            dbWrapper = {
                prepare(sql) {
                    return {
                        async all(...args) {
                            const flatArgs = args.flat();
                            const res = await client.execute({ sql, args: flatArgs });
                            return Array.from(res.rows);
                        },
                        async get(...args) {
                            const flatArgs = args.flat();
                            const res = await client.execute({ sql, args: flatArgs });
                            return res.rows[0] || undefined;
                        },
                        async run(...args) {
                            const flatArgs = args.flat();
                            const res = await client.execute({ sql, args: flatArgs });
                            return {
                                lastInsertRowid: res.lastInsertRowid ? Number(res.lastInsertRowid) : 0,
                                changes: res.rowsAffected
                            };
                        }
                    };
                },
                async exec(sql) {
                    await client.executeMultiple(sql);
                }
            };

            return dbWrapper;
        } catch (tursoErr) {
            console.error("Failed to initialize Turso client:", tursoErr);
        }
    }

    // Fallback SQLite local (better-sqlite3 avec Cloud KV Sync pour Vercel)
    const Database = require('better-sqlite3');
    let dbPath = path.join(process.cwd(), 'database', 'mamefricoto.db');
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');

    const isVercel = Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production');

    if (isVercel) {
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
        localDbInstance = new Database(dbPath);
        if (!isVercel) {
            try {
                localDbInstance.pragma('journal_mode = WAL');
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
            localDbInstance.exec(schema);

            try { localDbInstance.prepare("ALTER TABLE weekly_menus ADD COLUMN embed_url TEXT").run(); } catch {}
            try { localDbInstance.prepare("ALTER TABLE gallery_posts ADD COLUMN media_type TEXT DEFAULT 'image'").run(); } catch {}
            try { localDbInstance.prepare("ALTER TABLE contact_messages ADD COLUMN status TEXT DEFAULT 'nouveau'").run(); } catch {}
            try { localDbInstance.prepare("ALTER TABLE contact_messages ADD COLUMN admin_notes TEXT DEFAULT ''").run(); } catch {}
        } catch (schemaErr) {
            console.error("Failed to run schema check:", schemaErr);
        }
    }

    // Données par défaut initiales
    try {
        const menuCount = localDbInstance.prepare('SELECT COUNT(*) as count FROM weekly_menus').get()?.count || 0;
        if (menuCount === 0) {
            const res = localDbInstance.prepare(`
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
            const stmt = localDbInstance.prepare('INSERT INTO weekly_menu_images (menu_id, image_url, display_order) VALUES (?, ?, ?)');
            images.forEach((img, idx) => stmt.run(menuId, img, idx + 1));
        }
    } catch (seedErr) {
        console.error("Failed to seed default weekly menu:", seedErr);
    }

    try {
        const galleryCount = localDbInstance.prepare('SELECT COUNT(*) as count FROM gallery_posts').get()?.count || 0;
        if (galleryCount === 0) {
            const galleryStmt = localDbInstance.prepare('INSERT INTO gallery_posts (title, caption, image_url, media_type, display_order) VALUES (?, ?, ?, ?, ?)');
            galleryStmt.run('Menu de la semaine', 'Formule complète & plats faits maison', '/uploads/insta-menu-1.png', 'image', 1);
            galleryStmt.run('Les plats du jour', 'Riz safran, salade de lentilles, tortilla', '/uploads/insta-menu-2.png', 'image', 2);
            galleryStmt.run('Les formules & tarifs', 'Plat seul 12€, Formule 15€/18€', '/uploads/insta-menu-3.png', 'image', 3);
            galleryStmt.run('En cuisine avec Mamé', 'Labo à domicile à Eyguières', '/uploads/insta-menu-5.png', 'image', 4);
        }
    } catch (gallerySeedErr) {
        console.error("Failed to seed default gallery:", gallerySeedErr);
    }

    // Carrousel principal : 4 Prestations de Traiteur (Plat du Jour, Buffets Dînatoires, Événements Privés, Repas d'Entreprise)
    try {
        const carouselCount = localDbInstance.prepare('SELECT COUNT(*) as count FROM carousel_images').get()?.count || 0;
        if (carouselCount === 0) {
            const carouselStmt = localDbInstance.prepare('INSERT INTO carousel_images (title, subtitle, image_url, display_order) VALUES (?, ?, ?, ?)');
            carouselStmt.run(
                'Plat du Jour Fait Maison',
                'Un nouveau plat mijoté chaque jour avec des produits frais du marché · Eyguières',
                '/uploads/carousel-plat-du-jour.png',
                1
            );
            carouselStmt.run(
                'Buffets Dînatoires & Cocktails',
                'Bouchées raffinées, verrines et douceurs gourmandes pour vos soirées et réceptions',
                '/uploads/carousel-buffet-dinatoire.png',
                2
            );
            carouselStmt.run(
                'Événements Privés Sur Mesure',
                'Anniversaires, baptêmes, réunions de famille — un menu personnalisé d\'exception',
                '/uploads/carousel-evenements-prives.png',
                3
            );
            carouselStmt.run(
                'Repas d\'Entreprise & Séminaires',
                'Plateaux repas complets et déjeuners d\'équipe livrés dans vos locaux',
                '/uploads/carousel-repas-entreprise.png',
                4
            );
        }
    } catch (carouselSeedErr) {
        console.error("Failed to seed default carousel:", carouselSeedErr);
    }

    dbWrapper = {
        prepare(sql) {
            const stmt = localDbInstance.prepare(sql);
            return {
                async all(...args) {
                    await syncVercelCloudState(localDbInstance);
                    return stmt.all(...args);
                },
                async get(...args) {
                    await syncVercelCloudState(localDbInstance);
                    return stmt.get(...args);
                },
                async run(...args) {
                    await syncVercelCloudState(localDbInstance);
                    const res = stmt.run(...args);
                    if (res.changes > 0) {
                        await persistVercelCloudState(localDbInstance);
                    }
                    return res;
                }
            };
        },
        async exec(sql) {
            localDbInstance.exec(sql);
            await persistVercelCloudState(localDbInstance);
        }
    };

    return dbWrapper;
}

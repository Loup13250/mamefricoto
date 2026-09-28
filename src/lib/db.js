import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import { createClient } from '@libsql/client';

const require = createRequire(import.meta.url);

let dbWrapper;
let localDbInstance;

const DEFAULT_TURSO_URL = 'libsql://mamefricoto-db-loup13250.aws-eu-west-1.turso.io';
const DEFAULT_TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ5Mjc4ODMsImlkIjoiMDE5Zjk1ZmQtZDIwMS03ZjhkLTk2OGEtYmViNDUyYTYxYjVkIiwia2lkIjoiVWhSd2Q2N19CaUVoUTdudEd6WkdhQUdfZndpOEcyZldHeFppd2phOHhtbyIsInJpZCI6Ijg4ODY4NzYwLTIwYTgtNDBmOS05ZjIxLTdmMWViNWQwY2RhYyJ9.26o-n5GBlcsxqwBN8E8kdiG-g0aQQTBX4ttcE5BINf_onthFX-BWrkFbUdiAP029QRIxUvIH5d8RehRzhC8CDQ';

export function getDb() {
    if (dbWrapper) return dbWrapper;

    const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || process.env.DATABASE_URL || DEFAULT_TURSO_URL;
    const tursoToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || DEFAULT_TURSO_TOKEN;

    if (tursoUrl && (tursoUrl.startsWith('libsql') || tursoUrl.startsWith('https'))) {
        try {
            const client = createClient({
                url: tursoUrl,
                authToken: tursoToken,
            });

            let tablesEnsured = false;
            const ensureTables = async () => {
                if (tablesEnsured) return;
                try {
                    await Promise.allSettled([
                        client.execute(`CREATE TABLE IF NOT EXISTS media_storage (id TEXT PRIMARY KEY, mime_type TEXT NOT NULL, data BLOB NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`),
                        client.execute(`CREATE TABLE IF NOT EXISTS pricing_documents (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, title_en TEXT, description TEXT, description_en TEXT, file_url TEXT NOT NULL, file_url_en TEXT, file_type TEXT DEFAULT 'image', display_order INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`),
                        client.execute(`CREATE TABLE IF NOT EXISTS fixed_prices (id INTEGER PRIMARY KEY AUTOINCREMENT, category TEXT DEFAULT 'Repas', category_en TEXT DEFAULT 'Meals', name TEXT NOT NULL, name_en TEXT, price TEXT NOT NULL, price_en TEXT, details TEXT, details_en TEXT, badge TEXT, badge_en TEXT, display_order INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`),
                        client.execute(`ALTER TABLE weekly_menu_images ADD COLUMN lang TEXT DEFAULT 'fr'`),
                        client.execute(`ALTER TABLE weekly_menus ADD COLUMN image_url_en TEXT`),
                        client.execute(`ALTER TABLE services ADD COLUMN title_en TEXT`),
                        client.execute(`ALTER TABLE services ADD COLUMN description_en TEXT`),
                        client.execute(`ALTER TABLE services ADD COLUMN badge_en TEXT`),
                        client.execute(`ALTER TABLE weekly_menus ADD COLUMN title_en TEXT`),
                        client.execute(`ALTER TABLE weekly_menus ADD COLUMN description_en TEXT`),
                        client.execute(`ALTER TABLE carousel_images ADD COLUMN title_en TEXT`),
                        client.execute(`ALTER TABLE carousel_images ADD COLUMN subtitle_en TEXT`),
                        client.execute(`ALTER TABLE gallery_posts ADD COLUMN title_en TEXT`),
                        client.execute(`ALTER TABLE gallery_posts ADD COLUMN caption_en TEXT`)
                    ]);
                    tablesEnsured = true;
                } catch (err) {
                    tablesEnsured = true;
                }
            };

function toPlain(row) {
    if (!row || typeof row !== 'object') return row;
    const plain = {};
    for (const key of Object.keys(row)) {
        const val = row[key];
        // Preserve binary blobs (ArrayBuffer, Uint8Array, Buffer) — do NOT JSON-serialize them
        if (val instanceof ArrayBuffer || val instanceof Uint8Array || Buffer.isBuffer(val)) {
            plain[key] = val;
        } else if (typeof val === 'bigint') {
            plain[key] = Number(val);
        } else if (val !== null && val !== undefined && typeof val === 'object' && !Array.isArray(val)) {
            // Shallow-copy nested plain objects but guard against hidden binary types
            try {
                const j = JSON.stringify(val);
                plain[key] = j === '{}' ? val : JSON.parse(j);
            } catch {
                plain[key] = val;
            }
        } else {
            plain[key] = val;
        }
    }
    return plain;
}

            dbWrapper = {
                prepare(sql) {
                    return {
                        async all(...args) {
                            await ensureTables();
                            const flatArgs = args.flat();
                            const res = await client.execute({ sql, args: flatArgs });
                            return Array.from(res.rows).map(toPlain);
                        },
                        async get(...args) {
                            await ensureTables();
                            const flatArgs = args.flat();
                            const res = await client.execute({ sql, args: flatArgs });
                            return res.rows[0] ? toPlain(res.rows[0]) : undefined;
                        },
                        async run(...args) {
                            await ensureTables();
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
                    await ensureTables();
                    await client.executeMultiple(sql);
                }
            };

            return dbWrapper;
        } catch (tursoErr) {
            console.error("Failed to initialize Turso client:", tursoErr);
        }
    }

    // Fallback SQLite local (better-sqlite3) pour le développement hors-ligne
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
            try { localDbInstance.prepare("ALTER TABLE weekly_menus ADD COLUMN image_url_en TEXT").run(); } catch {}
            try { localDbInstance.prepare("ALTER TABLE weekly_menu_images ADD COLUMN lang TEXT DEFAULT 'fr'").run(); } catch {}
            try { localDbInstance.prepare("ALTER TABLE gallery_posts ADD COLUMN media_type TEXT DEFAULT 'image'").run(); } catch {}
            try { localDbInstance.prepare("ALTER TABLE contact_messages ADD COLUMN status TEXT DEFAULT 'nouveau'").run(); } catch {}
            try { localDbInstance.prepare("ALTER TABLE contact_messages ADD COLUMN admin_notes TEXT DEFAULT ''").run(); } catch {}
            try { localDbInstance.prepare("ALTER TABLE services ADD COLUMN title_en TEXT").run(); } catch {}
            try { localDbInstance.prepare("ALTER TABLE services ADD COLUMN description_en TEXT").run(); } catch {}
            try { localDbInstance.prepare("ALTER TABLE services ADD COLUMN badge_en TEXT").run(); } catch {}
            try { localDbInstance.prepare("ALTER TABLE weekly_menus ADD COLUMN title_en TEXT").run(); } catch {}
            try { localDbInstance.prepare("ALTER TABLE weekly_menus ADD COLUMN description_en TEXT").run(); } catch {}
            try { localDbInstance.prepare("ALTER TABLE carousel_images ADD COLUMN title_en TEXT").run(); } catch {}
            try { localDbInstance.prepare("ALTER TABLE carousel_images ADD COLUMN subtitle_en TEXT").run(); } catch {}
            try { localDbInstance.prepare("ALTER TABLE gallery_posts ADD COLUMN title_en TEXT").run(); } catch {}
            try { localDbInstance.prepare("ALTER TABLE gallery_posts ADD COLUMN caption_en TEXT").run(); } catch {}
            try {
                localDbInstance.exec(`
                    CREATE TABLE IF NOT EXISTS services (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        num TEXT,
                        title TEXT NOT NULL,
                        description TEXT NOT NULL,
                        badge TEXT,
                        display_order INTEGER DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                    CREATE TABLE IF NOT EXISTS media_storage (
                        id TEXT PRIMARY KEY,
                        mime_type TEXT NOT NULL,
                        data BLOB NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                `);
            } catch {}
        } catch (schemaErr) {
            console.error("Failed to run schema check:", schemaErr);
        }
    }

    dbWrapper = {
        prepare(sql) {
            const stmt = localDbInstance.prepare(sql);
            return {
                async all(...args) {
                    return stmt.all(...args).map(toPlain);
                },
                async get(...args) {
                    const row = stmt.get(...args);
                    return row ? toPlain(row) : undefined;
                },
                async run(...args) {
                    return stmt.run(...args);
                }
            };
        },
        async exec(sql) {
            localDbInstance.exec(sql);
        }
    };

    return dbWrapper;
}

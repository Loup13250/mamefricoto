import path from 'path';
import fs from 'fs';

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
            const { createClient } = require('@libsql/client');
            const client = createClient({
                url: tursoUrl,
                authToken: tursoToken,
            });

            let tableInitPromise = null;
            const ensureTables = async () => {
                if (!tableInitPromise) {
                    tableInitPromise = (async () => {
                        try {
                            await client.execute(`CREATE TABLE IF NOT EXISTS media_storage (id TEXT PRIMARY KEY, mime_type TEXT NOT NULL, data BLOB NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
                        } catch (err) {
                            console.error('Turso ensureTables error:', err);
                        }
                    })();
                }
                await tableInitPromise;
            };

            dbWrapper = {
                prepare(sql) {
                    return {
                        async all(...args) {
                            await ensureTables();
                            const flatArgs = args.flat();
                            const res = await client.execute({ sql, args: flatArgs });
                            return Array.from(res.rows);
                        },
                        async get(...args) {
                            await ensureTables();
                            const flatArgs = args.flat();
                            const res = await client.execute({ sql, args: flatArgs });
                            return res.rows[0] || undefined;
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
            try { localDbInstance.prepare("ALTER TABLE gallery_posts ADD COLUMN media_type TEXT DEFAULT 'image'").run(); } catch {}
            try { localDbInstance.prepare("ALTER TABLE contact_messages ADD COLUMN status TEXT DEFAULT 'nouveau'").run(); } catch {}
            try { localDbInstance.prepare("ALTER TABLE contact_messages ADD COLUMN admin_notes TEXT DEFAULT ''").run(); } catch {}
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
                    return stmt.all(...args);
                },
                async get(...args) {
                    return stmt.get(...args);
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

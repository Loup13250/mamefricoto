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
        try {
            db.pragma('journal_mode = WAL');
        } catch (pragmaErr) {
            console.warn("Failed to set WAL journal mode, falling back:", pragmaErr);
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
            try {
                db.prepare("ALTER TABLE weekly_menus ADD COLUMN embed_url TEXT").run();
            } catch {}
            try {
                db.prepare("ALTER TABLE gallery_posts ADD COLUMN media_type TEXT DEFAULT 'image'").run();
            } catch {}
        } catch (schemaErr) {
            console.error("Failed to run schema check:", schemaErr);
        }
    }

    return db;
}

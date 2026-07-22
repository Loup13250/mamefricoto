import { getDb } from './db';

// --- Site Info ---
export function getSiteInfo() {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM site_info').all();
    const info = {};
    for (const row of rows) {
        info[row.key] = row.value;
    }
    return info;
}

// --- Weekly Menus ---
export function getCurrentWeeklyMenu() {
    const db = getDb();
    return db.prepare('SELECT * FROM weekly_menus WHERE is_current = 1 ORDER BY created_at DESC LIMIT 1').get();
}

export function getAllWeeklyMenus() {
    const db = getDb();
    return db.prepare('SELECT * FROM weekly_menus ORDER BY created_at DESC').all();
}

// --- Carousel ---
export function getCarouselImages() {
    const db = getDb();
    return db.prepare('SELECT * FROM carousel_images ORDER BY display_order ASC').all();
}

// --- Articles ---
export function getArticles() {
    const db = getDb();
    return db.prepare('SELECT * FROM articles ORDER BY created_at DESC').all();
}

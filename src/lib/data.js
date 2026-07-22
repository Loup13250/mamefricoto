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
    const menu = db.prepare('SELECT * FROM weekly_menus WHERE is_current = 1 ORDER BY created_at DESC LIMIT 1').get();
    if (!menu) return null;

    const images = db.prepare('SELECT * FROM weekly_menu_images WHERE menu_id = ? ORDER BY display_order ASC, id ASC').all(menu.id);
    
    // If no extra images in relation table, map the main image_url as single image array
    if (images.length === 0 && menu.image_url) {
        return {
            ...menu,
            images: [{ id: 0, image_url: menu.image_url }]
        };
    }

    return {
        ...menu,
        images: images.length > 0 ? images : (menu.image_url ? [{ id: 0, image_url: menu.image_url }] : [])
    };
}

export function getAllWeeklyMenus() {
    const db = getDb();
    const menus = db.prepare('SELECT * FROM weekly_menus ORDER BY created_at DESC').all();
    return menus.map(menu => {
        const images = db.prepare('SELECT * FROM weekly_menu_images WHERE menu_id = ? ORDER BY display_order ASC, id ASC').all(menu.id);
        return {
            ...menu,
            images: images.length > 0 ? images : (menu.image_url ? [{ id: 0, image_url: menu.image_url }] : [])
        };
    });
}

// --- Contact Messages ---
export function getContactMessages() {
    const db = getDb();
    return db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
}

export function getUnreadMessageCount() {
    const db = getDb();
    const row = db.prepare('SELECT COUNT(*) as count FROM contact_messages WHERE is_read = 0').get();
    return row ? row.count : 0;
}

// --- Gallery Posts (Instagram Stories / Dish Photos) ---
export function getGalleryPosts() {
    const db = getDb();
    return db.prepare('SELECT * FROM gallery_posts ORDER BY display_order ASC, created_at DESC').all();
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

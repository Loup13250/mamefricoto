import { getDb } from './db';

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}

async function normalizeUrl(url) {
    if (!url || typeof url !== 'string') return url;
    if (url.startsWith('data:image/') || url.startsWith('data:video/')) {
        try {
            const db = getDb();
            const match = url.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
                const mimeType = match[1];
                const base64Data = match[2];
                const ext = mimeType.split('/')[1] || 'jpg';
                const mediaId = `legacy-${Math.abs(hashString(base64Data))}.${ext}`;
                
                try {
                    await db.prepare('INSERT OR IGNORE INTO media_storage (id, mime_type, data) VALUES (?, ?, ?)').run(mediaId, mimeType, base64Data);
                } catch (tableErr) {
                    try {
                        await db.exec(`CREATE TABLE IF NOT EXISTS media_storage (id TEXT PRIMARY KEY, mime_type TEXT NOT NULL, data BLOB NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
                        await db.prepare('INSERT OR IGNORE INTO media_storage (id, mime_type, data) VALUES (?, ?, ?)').run(mediaId, mimeType, base64Data);
                    } catch (e2) {}
                }
                return `/api/media/${mediaId}`;
            }
        } catch (e) {
            console.error('Error migrating Data URI to media_storage:', e);
        }
    }
    return url;
}

// --- Site Info ---
export async function getSiteInfo() {
    const db = getDb();
    const rows = await db.prepare('SELECT * FROM site_info').all();
    const info = {};
    for (const row of rows) {
        info[row.key] = await normalizeUrl(row.value);
    }
    return info;
}

// --- Weekly Menus ---
export async function getCurrentWeeklyMenu() {
    const db = getDb();
    const menu = await db.prepare('SELECT * FROM weekly_menus WHERE is_current = 1 ORDER BY created_at DESC LIMIT 1').get();
    if (!menu) return null;

    const rawImages = await db.prepare('SELECT * FROM weekly_menu_images WHERE menu_id = ? ORDER BY display_order ASC, id ASC').all(menu.id);
    const images = await Promise.all(rawImages.map(async img => ({
        ...img,
        image_url: await normalizeUrl(img.image_url)
    })));

    const mainImageUrl = await normalizeUrl(menu.image_url);

    return {
        ...menu,
        image_url: mainImageUrl,
        images: images.length > 0 ? images : (mainImageUrl ? [{ id: 0, image_url: mainImageUrl }] : [])
    };
}

export async function getAllWeeklyMenus() {
    const db = getDb();
    const menus = await db.prepare('SELECT * FROM weekly_menus ORDER BY created_at DESC').all();
    return Promise.all(menus.map(async menu => {
        const rawImages = await db.prepare('SELECT * FROM weekly_menu_images WHERE menu_id = ? ORDER BY display_order ASC, id ASC').all(menu.id);
        const images = await Promise.all(rawImages.map(async img => ({
            ...img,
            image_url: await normalizeUrl(img.image_url)
        })));
        const mainImageUrl = await normalizeUrl(menu.image_url);

        return {
            ...menu,
            image_url: mainImageUrl,
            images: images.length > 0 ? images : (mainImageUrl ? [{ id: 0, image_url: mainImageUrl }] : [])
        };
    }));
}

// --- Contact Messages ---
export async function getContactMessages() {
    const db = getDb();
    return await db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
}

export async function getUnreadMessageCount() {
    const db = getDb();
    const row = await db.prepare('SELECT COUNT(*) as count FROM contact_messages WHERE is_read = 0').get();
    return row ? row.count : 0;
}

// --- Gallery Posts (Instagram Stories / Dish Photos) ---
export async function getGalleryPosts() {
    const db = getDb();
    const posts = await db.prepare('SELECT * FROM gallery_posts ORDER BY display_order ASC, created_at DESC').all();
    return Promise.all(posts.map(async post => ({
        ...post,
        image_url: await normalizeUrl(post.image_url)
    })));
}

// --- Carousel ---
const DEFAULT_CAROUSEL_SLIDES = [
    { id: 1, image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=90&w=2560&auto=format&fit=crop', title: 'Cuisine Maison & Produits Frais', subtitle: 'Vos plats du jour mijotés et traiteur sur-mesure à Eyguières' },
    { id: 2, image_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=90&w=2560&auto=format&fit=crop', title: 'Buffets & Événements Sur-Mesure', subtitle: 'Formules gastronomiques pour vos mariages, anniversaires et cocktails' },
    { id: 3, image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=90&w=2560&auto=format&fit=crop', title: 'Savoir-Faire Artisanal', subtitle: 'Des recettes authentiques préparées chaque jour avec passion' }
];

export async function getCarouselImages() {
    const db = getDb();
    try {
        const slides = await db.prepare('SELECT * FROM carousel_images ORDER BY display_order ASC, id ASC').all();
        if (slides && slides.length > 0) {
            return Promise.all(slides.map(async slide => ({
                ...slide,
                image_url: await normalizeUrl(slide.image_url)
            })));
        }
    } catch {}
    return DEFAULT_CAROUSEL_SLIDES;
}

// --- Services / Prestations ---
const DEFAULT_SERVICES = [
    { id: 1, num: '01', title: 'Plats du Jour', description: 'Chaque jour, des plats mijotés frais. Commandez la veille ou le matin pour un repas livré ou à retirer.', badge: 'Quotidien' },
    { id: 2, num: '02', title: 'Événements', description: 'Anniversaires, mariages, baptêmes — un menu sur mesure adapté à votre nombre de convives.', badge: 'Sur-mesure' },
    { id: 3, num: '03', title: "Repas d'Entreprise", description: "Plateaux repas, buffets pour séminaires et déjeuners d'équipe. Des formules professionnelles.", badge: 'Pro' },
    { id: 4, num: '04', title: 'Buffets Dînatoires', description: 'Des mets élégants présentés en buffet pour vos soirées cocktails et réceptions.', badge: 'Cocktails' },
];

export async function getServices() {
    const db = getDb();
    try {
        let services = await db.prepare('SELECT * FROM services ORDER BY display_order ASC, id ASC').all();
        if (!services || services.length === 0) {
            for (let i = 0; i < DEFAULT_SERVICES.length; i++) {
                const s = DEFAULT_SERVICES[i];
                await db.prepare('INSERT INTO services (num, title, description, badge, display_order) VALUES (?, ?, ?, ?, ?)').run(
                    s.num, s.title, s.description, s.badge, i + 1
                );
            }
            services = await db.prepare('SELECT * FROM services ORDER BY display_order ASC, id ASC').all();
        }
        if (services && services.length > 0) {
            return services;
        }
    } catch (err) {
        console.error('getServices error:', err);
    }
    return DEFAULT_SERVICES;
}

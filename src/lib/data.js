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
    const images_fr = [];
    const images_en = [];

    for (const img of rawImages) {
        const normUrl = await normalizeUrl(img.image_url);
        const item = { ...img, image_url: normUrl, lang: img.lang === 'en' ? 'en' : 'fr' };
        if (img.lang === 'en') {
            images_en.push(item);
        } else {
            images_fr.push(item);
        }
    }

    const mainImageUrl = menu.image_url ? await normalizeUrl(menu.image_url) : (images_fr[0]?.image_url || null);
    const mainImageUrlEn = menu.image_url_en ? await normalizeUrl(menu.image_url_en) : (images_en[0]?.image_url || null);

    return {
        ...menu,
        image_url: mainImageUrl,
        image_url_en: mainImageUrlEn,
        images_fr,
        images_en,
        images: images_fr
    };
}

export async function getAllWeeklyMenus() {
    const db = getDb();
    const menus = await db.prepare('SELECT * FROM weekly_menus ORDER BY created_at DESC').all();
    return Promise.all(menus.map(async menu => {
        const rawImages = await db.prepare('SELECT * FROM weekly_menu_images WHERE menu_id = ? ORDER BY display_order ASC, id ASC').all(menu.id);
        const images_fr = [];
        const images_en = [];

        for (const img of rawImages) {
            const normUrl = await normalizeUrl(img.image_url);
            const item = { ...img, image_url: normUrl, lang: img.lang === 'en' ? 'en' : 'fr' };
            if (img.lang === 'en') {
                images_en.push(item);
            } else {
                images_fr.push(item);
            }
        }

        const mainImageUrl = menu.image_url ? await normalizeUrl(menu.image_url) : (images_fr[0]?.image_url || null);
        const mainImageUrlEn = menu.image_url_en ? await normalizeUrl(menu.image_url_en) : (images_en[0]?.image_url || null);

        return {
            ...menu,
            image_url: mainImageUrl,
            image_url_en: mainImageUrlEn,
            images_fr,
            images_en,
            images: images_fr
        };
    }));
}

// --- Contact Messages ---
export async function getContactMessages() {
    const db = getDb();
    const rows = await db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
    return (rows || []).map(r => ({
        id: Number(r.id),
        name: r.name ? String(r.name) : '',
        email: r.email ? String(r.email) : '',
        phone: r.phone ? String(r.phone) : '',
        event_type: r.event_type ? String(r.event_type) : '',
        event_date: r.event_date ? String(r.event_date) : '',
        guests: r.guests ? String(r.guests) : '',
        message: r.message ? String(r.message) : '',
        is_read: Number(r.is_read) || 0,
        created_at: r.created_at ? String(r.created_at) : '',
        status: r.status ? String(r.status) : 'nouveau',
        admin_notes: r.admin_notes ? String(r.admin_notes) : ''
    }));
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
                image_url: await normalizeUrl(slide.image_url),
                mobile_image_url: slide.mobile_image_url ? await normalizeUrl(slide.mobile_image_url) : null,
            })));
        }
    } catch {}
    return DEFAULT_CAROUSEL_SLIDES;
}

// --- Services / Prestations ---
const DEFAULT_SERVICES = [
    { id: 1, num: '01', title: 'Plats du Jour', description: 'Chaque jour, des plats mijotés frais. Commandez la veille ou le matin pour un repas livré ou à retirer.', badge: 'Quotidien' },
    { id: 2, num: '02', title: 'Événements', description: 'Anniversaires, mariages, baptêmes : un menu sur mesure adapté à votre nombre de convives.', badge: 'Sur-mesure' },
    { id: 3, num: '03', title: "Repas d'Entreprise", description: "Plateaux repas, buffets pour séminaires et déjeuners d'équipe. Des formules professionnelles.", badge: 'Pro' },
    { id: 4, num: '04', title: 'Buffets Dînatoires', description: 'Des mets élégants présentés en buffet pour vos soirées cocktails et réceptions.', badge: 'Cocktails' },
];

export async function getServices() {
    const db = getDb();
    try {
        const services = await db.prepare('SELECT * FROM services ORDER BY display_order ASC, id ASC').all();
        if (services && services.length > 0) {
            return services.map(s => ({ ...s }));
        }
    } catch (err) {
        console.error('getServices error:', err);
    }
    return DEFAULT_SERVICES;
}

// --- Pricing Documents (PDFs & Images) ---
export async function getPricingDocuments() {
    const db = getDb();
    try {
        const docs = await db.prepare('SELECT * FROM pricing_documents ORDER BY display_order ASC, id ASC').all();
        if (docs && docs.length > 0) {
            return Promise.all(docs.map(async doc => {
                const normFileUrl = await normalizeUrl(doc.file_url);
                const normFileUrlEn = doc.file_url_en ? await normalizeUrl(doc.file_url_en) : null;

                let images_fr = [];
                let images_en = [];

                try {
                    const rawImages = await db.prepare('SELECT * FROM pricing_document_images WHERE doc_id = ? ORDER BY display_order ASC, id ASC').all(doc.id);
                    for (const img of rawImages) {
                        const nUrl = await normalizeUrl(img.image_url);
                        const item = { ...img, image_url: nUrl, lang: img.lang === 'en' ? 'en' : 'fr' };
                        if (img.lang === 'en') {
                            images_en.push(item);
                        } else {
                            images_fr.push(item);
                        }
                    }
                } catch (e) {
                    // Table might be initializing
                }

                // If no subtable images and this is an image type, populate from primary URLs
                if (images_fr.length === 0 && doc.file_type !== 'pdf' && normFileUrl) {
                    images_fr.push({ id: `legacy-${doc.id}-fr`, image_url: normFileUrl, lang: 'fr', display_order: 1 });
                }
                if (images_en.length === 0 && doc.file_type !== 'pdf' && normFileUrlEn) {
                    images_en.push({ id: `legacy-${doc.id}-en`, image_url: normFileUrlEn, lang: 'en', display_order: 1 });
                }

                return {
                    ...doc,
                    file_url: normFileUrl,
                    file_url_en: normFileUrlEn,
                    images_fr,
                    images_en,
                    images: images_fr
                };
            }));
        }
    } catch (err) {
        console.error('getPricingDocuments error:', err);
    }
    return [];
}

// --- Fixed Meal Prices ---
export async function getFixedPrices() {
    const db = getDb();
    try {
        const prices = await db.prepare('SELECT * FROM fixed_prices ORDER BY display_order ASC, id ASC').all();
        if (prices && prices.length > 0) {
            return prices.map(p => ({ ...p }));
        }
    } catch (err) {
        console.error('getFixedPrices error:', err);
    }
    return [];
}

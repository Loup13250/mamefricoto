'use server';

import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { sendContactNotification } from '@/lib/email';
import { cookies, headers } from 'next/headers';
import fs from 'fs';
import path from 'path';
import {
    isAdminRequest,
    destroySession,
    SESSION_COOKIE,
    hashPassword,
    verifyPassword,
    getSessionUser,
    isRateLimited,
    registerHit,
    clientIp,
} from '@/lib/auth';
import {
    CUSTOM_TEXTS_KEY,
    CUSTOM_TEXT_MAX_LENGTH,
    parseCustomTexts,
    isEditableTextKey,
} from '@/lib/siteTexts';
import { logActivity } from '@/lib/logs';

// --- OUTIL D'AUTHENTIFICATION ---
export async function verifyAdminAuth() {
    return isAdminRequest();
}

export async function requireAdminAuth() {
    const isAuthenticated = await verifyAdminAuth();
    if (!isAuthenticated) {
        throw new Error('Non autorisé. Veuillez vous connecter.');
    }
}

function extractId(idOrFormData) {
    if (!idOrFormData) return null;
    if (typeof idOrFormData === 'object' && typeof idOrFormData.get === 'function') {
        const val = idOrFormData.get('id');
        return val ? parseInt(val, 10) : null;
    }
    return parseInt(idOrFormData, 10);
}

// --- ACTIONS D'AUTHENTIFICATION ---
export async function adminLogout() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (token) {
        const user = await getSessionUser(token).catch(() => null);
        const reqHeaders = await headers();
        await logActivity({
            action: 'logout',
            category: 'Connexions',
            summary: `Déconnexion de l'administration (${user || 'Admin'})`,
            username: user || 'Admin',
            ip: clientIp(reqHeaders),
        });
        await destroySession(token).catch(() => {});
    }
    cookieStore.delete(SESSION_COOKIE);
    redirect('/admin');
}

export async function changeAdminPassword(currentPassword, newPassword) {
    await requireAdminAuth();
    if (!newPassword || newPassword.length < 8) {
        return { error: 'Le nouveau mot de passe doit comporter au moins 8 caractères.' };
    }
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const username = await getSessionUser(token);
    if (!username) return { error: 'Session invalide.' };

    const db = getDb();
    const user = await db.prepare('SELECT password FROM admin_users WHERE username = ?').get(username);
    if (!user) return { error: 'Utilisateur introuvable.' };

    const check = await verifyPassword(currentPassword, user.password);
    if (!check.ok) {
        return { error: 'Mot de passe actuel incorrect.' };
    }

    const newHashed = await hashPassword(newPassword);
    await db.prepare('UPDATE admin_users SET password = ? WHERE username = ?').run(newHashed, username);

    await logActivity({
        action: 'security',
        category: 'Administration',
        summary: `Modification du mot de passe administrateur pour "${username}"`,
        username
    });

    return { success: true, message: 'Mot de passe mis à jour avec succès.' };
}

// --- ENVOI SÉCURISÉ DE FICHIERS ---
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.mov', '.jfif', '.heic', '.heif', '.avif', '.bmp', '.pdf']);

async function saveUploadedFile(file) {
    if (!file || typeof file === 'string' || !file.name || file.size === 0) return null;

    const isVercel = Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production');
    const maxSize = isVercel ? 4.5 * 1024 * 1024 : 50 * 1024 * 1024;

    if (file.size > maxSize) {
        throw new Error("Le fichier sélectionné est trop volumineux (max 4.5 Mo). Veuillez choisir un fichier plus léger.");
    }

    let ext = path.extname(file.name || '').toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
        if (file.type && file.type.startsWith('image/') && !file.type.includes('svg')) {
            ext = '.webp';
        } else if (file.type && file.type.startsWith('video/')) {
            ext = '.mp4';
        } else if (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')) {
            ext = '.pdf';
        } else {
            ext = '.jpg';
        }
    }

    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif',
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.mov': 'video/quicktime',
            '.pdf': 'application/pdf',
        };
        const mimeType = file.type || mimeTypes[ext] || (ext === '.pdf' ? 'application/pdf' : 'image/jpeg');

        // Stockage dans media_storage pour éviter d'alourdir le HTML avec de grosses URL de données (Data URI)
        const mediaId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
        const db = getDb();
        await db.prepare('INSERT INTO media_storage (id, mime_type, data) VALUES (?, ?, ?)').run(mediaId, mimeType, buffer);
        return `/api/media/${mediaId}`;
    } catch (err) {
        console.error("Erreur enregistrement fichier :", err);
        throw new Error(err.message || "Impossible d'enregistrer le fichier.");
    }
}

function deleteLocalFileIfPresent(imageUrl) {
    if (!imageUrl || typeof imageUrl !== 'string') return;
    if (imageUrl.startsWith('/uploads/')) {
        const localPath = path.join(process.cwd(), 'public', imageUrl);
        if (fs.existsSync(localPath)) {
            try {
                fs.unlinkSync(localPath);
            } catch (err) {
                console.error("Erreur suppression fichier local :", err);
            }
        }
    }
}

const DEFAULT_MENU_IMAGES = [
    '/uploads/insta-menu-1.png',
    '/uploads/insta-menu-2.png',
    '/uploads/insta-menu-3.png',
    '/uploads/insta-menu-4.png',
    '/uploads/insta-menu-5.png'
];

// --- INFORMATIONS ET PARAMÈTRES DU SITE ---
export async function updateSiteInfo(formData) {
    await requireAdminAuth();
    const db = getDb();

    const fields = [
        'contact_email', 'notification_email', 'phone', 'address', 'address_en', 'hours', 'hours_en',
        'instagram', 'facebook', 'google_reviews', 'about_text', 'about_text_en',
        'tagline', 'tagline_en', 'formspree_url', 'smtp_pass', 'resend_api_key'
    ];

    const stmt = db.prepare(`
        INSERT INTO site_info (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    const updatedKeys = [];
    for (const field of fields) {
        const val = formData.get(field);
        if (val !== null && val !== undefined) {
            await stmt.run(field, val.toString().trim());
            updatedKeys.push(field);
        }
    }

    const logoFile = formData.get('logo_file');
    const siteIconFile = formData.get('site_icon_file');
    const aboutFile = formData.get('about_file');

    if (logoFile && logoFile.size > 0) {
        const logoUrl = await saveUploadedFile(logoFile);
        if (logoUrl) {
            await stmt.run('logo', logoUrl);
            await logActivity({
                action: 'update',
                category: 'Logo & Paramètres',
                summary: 'Mise à jour du logo principal (barre de navigation)',
                details: { url: logoUrl, fileName: logoFile.name }
            });
        }
    }

    if (siteIconFile && siteIconFile.size > 0) {
        const iconUrl = await saveUploadedFile(siteIconFile);
        if (iconUrl) {
            await stmt.run('site_icon', iconUrl);
            await logActivity({
                action: 'update',
                category: 'Logo & Paramètres',
                summary: "Mise à jour du favicon / icône d'onglet navigateur",
                details: { url: iconUrl, fileName: siteIconFile.name }
            });
        }
    }

    if (aboutFile && aboutFile.size > 0) {
        const aboutUrl = await saveUploadedFile(aboutFile);
        if (aboutUrl) {
            await stmt.run('about_image', aboutUrl);
            await logActivity({
                action: 'update',
                category: 'À Propos',
                summary: 'Changement de la photo principale À Propos',
                details: { url: aboutUrl }
            });
        }
    }

    if (updatedKeys.length > 0) {
        await logActivity({
            action: 'update',
            category: 'Logo & Paramètres',
            summary: `Mise à jour des coordonnées et paramètres (${updatedKeys.length} champs)`,
            details: { fields: updatedKeys }
        });
    }

    revalidatePath('/', 'layout');
    revalidatePath('/');
    revalidatePath('/contact');
    revalidatePath('/a-propos');
    revalidatePath('/tarifs');
    revalidatePath('/galerie');
    revalidatePath('/realisations');
    revalidatePath('/admin/dashboard/settings');
    return { success: true };
}

export async function updateSiteLogo(formData) {
    try {
        await requireAdminAuth();
        const file = formData.get('logo_file');
        if (!file || file.size === 0) return { error: 'Aucun fichier de logo fourni.' };

        const db = getDb();
        const logoUrl = await saveUploadedFile(file);
        if (!logoUrl) return { error: "Erreur lors de l'enregistrement du logo." };

        await db.prepare(`
            INSERT INTO site_info (key, value) VALUES ('logo', ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `).run(logoUrl);

        await logActivity({
            action: 'update',
            category: 'Logo & Paramètres',
            summary: 'Changement du logo principal de navigation',
            details: { url: logoUrl, fileName: file.name, size: file.size }
        });

        revalidatePath('/', 'layout');
        revalidatePath('/');
        revalidatePath('/admin/dashboard/settings');
        return { success: true, url: logoUrl };
    } catch (err) {
        console.error('updateSiteLogo error:', err);
        return { error: err.message || 'Erreur lors de la mise à jour du logo.' };
    }
}

export async function updateSiteIcon(formData) {
    try {
        await requireAdminAuth();
        const file = formData.get('site_icon_file');
        if (!file || file.size === 0) return { error: "Aucun fichier d'icône fourni." };

        const db = getDb();
        const iconUrl = await saveUploadedFile(file);
        if (!iconUrl) return { error: "Erreur lors de l'enregistrement de l'icône." };

        await db.prepare(`
            INSERT INTO site_info (key, value) VALUES ('site_icon', ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `).run(iconUrl);

        await logActivity({
            action: 'update',
            category: 'Logo & Paramètres',
            summary: "Changement de l'icône d'onglet navigateur (favicon)",
            details: { url: iconUrl, fileName: file.name, size: file.size }
        });

        revalidatePath('/', 'layout');
        revalidatePath('/');
        revalidatePath('/admin/dashboard/settings');
        return { success: true, url: iconUrl };
    } catch (err) {
        console.error('updateSiteIcon error:', err);
        return { error: err.message || "Erreur lors de la mise à jour de l'icône." };
    }
}

export async function clearActivityLogs() {
    try {
        await requireAdminAuth();
        const db = getDb();
        await db.prepare('DELETE FROM activity_logs').run();
        await logActivity({
            action: 'delete',
            category: 'Administration',
            summary: "Réinitialisation complète du journal d'activité",
        });
        revalidatePath('/admin/dashboard/logs');
        return { success: true };
    } catch (err) {
        console.error('clearActivityLogs error:', err);
        return { error: err.message || 'Erreur lors de la suppression des logs.' };
    }
}

export async function seedSampleGalleryPosts() {
    try {
        await requireAdminAuth();
        const db = getDb();

        const samples = [
            {
                title: 'Buffet Cocktail Événementiel',
                title_en: 'Event Cocktail Buffet',
                caption: 'Assortiment de bouchées salées, navettes artisanales et verrines fraîches préparées avec passion.',
                caption_en: 'Assortment of savory bites, handcrafted finger foods, and fresh verrines crafted with passion.',
                image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200&auto=format&fit=crop',
                display_order: 1,
            },
            {
                title: 'Plat Mijoté Traditionnel',
                title_en: 'Traditional Slow-Cooked Dish',
                caption: 'Nos plats du jour mijotent doucement dès le matin avec des produits frais et locaux.',
                caption_en: 'Our daily specials simmer gently from dawn with fresh local ingredients.',
                image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop',
                display_order: 2,
            },
            {
                title: 'Douceurs & Desserts Maison',
                title_en: 'Homemade Sweets & Desserts',
                caption: 'Tartes de saison, gâteaux au citron et créations gourmandes pour sublimer vos réceptions.',
                caption_en: 'Seasonal tarts, lemon cakes, and gourmet creations to enhance your celebrations.',
                image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200&auto=format&fit=crop',
                display_order: 3,
            }
        ];

        for (const post of samples) {
            await db.prepare(`
                INSERT INTO gallery_posts (title, title_en, caption, caption_en, image_url, thumbnail_url, media_type, display_order)
                VALUES (?, ?, ?, ?, ?, ?, 'image', ?)
            `).run(post.title, post.title_en, post.caption, post.caption_en, post.image_url, post.image_url, post.display_order);
        }

        await logActivity({
            action: 'add',
            category: 'Galerie',
            summary: "Restauration de 3 photos culinaires d'exemple dans la galerie",
            details: { count: samples.length }
        });

        revalidatePath('/galerie');
        revalidatePath('/realisations');
        revalidatePath('/admin/dashboard/galerie');
        return { success: true };
    } catch (err) {
        console.error('seedSampleGalleryPosts error:', err);
        return { error: err.message || "Erreur lors de l'ajout des photos d'exemple." };
    }
}

// --- TEXTES DU SITE (FR / EN) ---
// updates = { fr: { 'about.authTitle': 'Mon texte' | null }, en: { ... } }
// Une valeur vide ou null supprime la surcharge (retour au texte d'origine).
export async function saveSiteTexts(updates) {
    try {
        await requireAdminAuth();
        if (!updates || typeof updates !== 'object') return { error: 'Données invalides.' };

        const db = getDb();
        const row = await db.prepare('SELECT value FROM site_info WHERE key = ?').get(CUSTOM_TEXTS_KEY);
        const current = parseCustomTexts(row?.value);

        for (const lang of ['fr', 'en']) {
            const langUpdates = updates[lang];
            if (!langUpdates || typeof langUpdates !== 'object') continue;
            for (const [key, rawVal] of Object.entries(langUpdates)) {
                if (!isEditableTextKey(key)) continue;
                const val = typeof rawVal === 'string' ? rawVal.trim() : '';
                if (!val) {
                    delete current[lang][key];
                } else {
                    current[lang][key] = val.slice(0, CUSTOM_TEXT_MAX_LENGTH);
                }
            }
        }

        await db.prepare(`
            INSERT INTO site_info (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `).run(CUSTOM_TEXTS_KEY, JSON.stringify(current));

        // Synchronisation bidirectionnelle du slogan / accroche courte
        const stmtInfo = db.prepare(`
            INSERT INTO site_info (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `);
        if (updates.fr && ('about.pageTagline' in updates.fr || 'footer.tagline' in updates.fr)) {
            const newTagline = updates.fr['about.pageTagline'] ?? updates.fr['footer.tagline'];
            if (newTagline) await stmtInfo.run('tagline', newTagline);
        }
        if (updates.en && ('about.pageTagline' in updates.en || 'footer.tagline' in updates.en)) {
            const newTaglineEn = updates.en['about.pageTagline'] ?? updates.en['footer.tagline'];
            if (newTaglineEn) await stmtInfo.run('tagline_en', newTaglineEn);
        }

        await logActivity({
            action: 'update',
            category: 'Textes du site',
            summary: 'Mise à jour des textes édités du site (FR / EN)',
        });

        revalidatePath('/', 'layout');
        revalidatePath('/');
        revalidatePath('/a-propos');
        revalidatePath('/admin/dashboard/textes');
        revalidatePath('/admin/dashboard/a-propos');
        revalidatePath('/admin/dashboard/settings');
        return { success: true };
    } catch (err) {
        console.error('[saveSiteTexts Error]:', err);
        return { error: err.message || "Impossible d'enregistrer les textes." };
    }
}

// --- MENU DE LA SEMAINE ---
export async function addWeeklyMenu(formData) {
    try {
        await requireAdminAuth();
        const title = (formData.get('title') || '').toString().trim();
        const title_en = (formData.get('title_en') || '').toString().trim();
        const description = (formData.get('description') || '').toString().trim();
        const description_en = (formData.get('description_en') || '').toString().trim();
        const is_current = formData.get('is_current') === 'on' ? 1 : 0;

        if (!title) {
            return { error: 'Veuillez saisir un titre pour le menu.' };
        }

        const files_fr = formData.getAll('image_files_fr').length > 0 ? formData.getAll('image_files_fr') : formData.getAll('image_files');
        const files_en = formData.getAll('image_files_en');

        const uploadedUrlsFr = [];
        for (const file of files_fr) {
            if (file && file.size > 0) {
                const url = await saveUploadedFile(file);
                if (url) uploadedUrlsFr.push(url);
            }
        }

        const uploadedUrlsEn = [];
        for (const file of files_en) {
            if (file && file.size > 0) {
                const url = await saveUploadedFile(file);
                if (url) uploadedUrlsEn.push(url);
            }
        }

        const imagesFrToAttach = uploadedUrlsFr.length > 0 ? uploadedUrlsFr : DEFAULT_MENU_IMAGES;
        const mainImageUrl = imagesFrToAttach[0];
        const mainImageUrlEn = uploadedUrlsEn.length > 0 ? uploadedUrlsEn[0] : null;

        const db = getDb();

        if (is_current) {
            await db.prepare('UPDATE weekly_menus SET is_current = 0').run();
        }

        const result = await db.prepare('INSERT INTO weekly_menus (title, title_en, description, description_en, image_url, image_url_en, embed_url, is_current) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
            title, title_en, description, description_en, mainImageUrl, mainImageUrlEn, '', is_current
        );
        const menuId = result.lastInsertRowid;

        const stmt = db.prepare('INSERT INTO weekly_menu_images (menu_id, image_url, display_order, lang) VALUES (?, ?, ?, ?)');
        for (let idx = 0; idx < imagesFrToAttach.length; idx++) {
            await stmt.run(menuId, imagesFrToAttach[idx], idx + 1, 'fr');
        }
        for (let idx = 0; idx < uploadedUrlsEn.length; idx++) {
            await stmt.run(menuId, uploadedUrlsEn[idx], idx + 1, 'en');
        }

        // Nettoyage automatique : ne conserver que les 3 derniers menus
        const allMenus = await db.prepare('SELECT id FROM weekly_menus ORDER BY created_at DESC').all();
        if (allMenus.length > 3) {
            const menusToDelete = allMenus.slice(3);
            for (const oldMenu of menusToDelete) {
                const images = await db.prepare('SELECT image_url FROM weekly_menu_images WHERE menu_id = ?').all(oldMenu.id);
                images.forEach(img => deleteLocalFileIfPresent(img.image_url));
                await db.prepare('DELETE FROM weekly_menu_images WHERE menu_id = ?').run(oldMenu.id);
                await db.prepare('DELETE FROM weekly_menus WHERE id = ?').run(oldMenu.id);
            }
        }

        revalidatePath('/');
        revalidatePath('/admin/dashboard/menu-semaine');

        await logActivity({
            action: 'add',
            category: 'Menu Semaine',
            summary: `Ajout du menu de la semaine : "${title}"`,
            details: { title, is_current }
        });

        return { success: true };
    } catch (err) {
        console.error('[addWeeklyMenu Error]:', err);
        return { error: err.message || 'Une erreur est survenue lors de l\'enregistrement du menu.' };
    }
}

export async function editWeeklyMenu(formData) {
    try {
        await requireAdminAuth();
        const id = extractId(formData);
        if (!id) return { error: 'ID invalide' };

        const title = (formData.get('title') || '').toString().trim();
        const title_en = (formData.get('title_en') || '').toString().trim();
        const description = (formData.get('description') || '').toString().trim();
        const description_en = (formData.get('description_en') || '').toString().trim();
        const is_current = formData.get('is_current') === 'on' ? 1 : 0;

        if (!title) {
            return { error: 'Veuillez saisir un titre pour le menu.' };
        }

        const files_fr = formData.getAll('image_files_fr').length > 0 ? formData.getAll('image_files_fr') : formData.getAll('image_files');
        const files_en = formData.getAll('image_files_en');

        const uploadedUrlsFr = [];
        for (const file of files_fr) {
            if (file && file.size > 0) {
                const url = await saveUploadedFile(file);
                if (url) uploadedUrlsFr.push(url);
            }
        }

        const uploadedUrlsEn = [];
        for (const file of files_en) {
            if (file && file.size > 0) {
                const url = await saveUploadedFile(file);
                if (url) uploadedUrlsEn.push(url);
            }
        }

        const db = getDb();
        const existing = await db.prepare('SELECT * FROM weekly_menus WHERE id = ?').get(id);
        if (!existing) return { error: 'Menu introuvable' };

        if (is_current) {
            await db.prepare('UPDATE weekly_menus SET is_current = 0').run();
        }

        // Migre l'ancienne image unique vers weekly_menu_images si la sous-table est vide, avant d'ajouter les nouvelles
        const existingFrCount = (await db.prepare("SELECT COUNT(*) as count FROM weekly_menu_images WHERE menu_id = ? AND (lang = 'fr' OR lang IS NULL)").get(id))?.count || 0;
        if (existingFrCount === 0 && existing.image_url) {
            await db.prepare("INSERT INTO weekly_menu_images (menu_id, image_url, display_order, lang) VALUES (?, ?, 1, 'fr')").run(id, existing.image_url);
        }

        const existingEnCount = (await db.prepare("SELECT COUNT(*) as count FROM weekly_menu_images WHERE menu_id = ? AND lang = 'en'").get(id))?.count || 0;
        if (existingEnCount === 0 && existing.image_url_en) {
            await db.prepare("INSERT INTO weekly_menu_images (menu_id, image_url, display_order, lang) VALUES (?, ?, 1, 'en')").run(id, existing.image_url_en);
        }

        // Ajoute les nouvelles images FR si elles ont été envoyées
        if (uploadedUrlsFr.length > 0) {
            const highestOrderRow = await db.prepare("SELECT MAX(display_order) as max_order FROM weekly_menu_images WHERE menu_id = ? AND (lang = 'fr' OR lang IS NULL)").get(id);
            let startOrder = (highestOrderRow?.max_order || 0) + 1;
            const stmt = db.prepare("INSERT INTO weekly_menu_images (menu_id, image_url, display_order, lang) VALUES (?, ?, ?, 'fr')");
            for (const url of uploadedUrlsFr) {
                await stmt.run(id, url, startOrder++);
            }
        }

        // Ajoute les nouvelles images EN si elles ont été envoyées
        if (uploadedUrlsEn.length > 0) {
            const highestOrderRow = await db.prepare("SELECT MAX(display_order) as max_order FROM weekly_menu_images WHERE menu_id = ? AND lang = 'en'").get(id);
            let startOrder = (highestOrderRow?.max_order || 0) + 1;
            const stmt = db.prepare("INSERT INTO weekly_menu_images (menu_id, image_url, display_order, lang) VALUES (?, ?, ?, 'en')");
            for (const url of uploadedUrlsEn) {
                await stmt.run(id, url, startOrder++);
            }
        }

        // Synchronise les URL principales avec la première image de chaque langue
        const firstFr = await db.prepare("SELECT image_url FROM weekly_menu_images WHERE menu_id = ? AND (lang = 'fr' OR lang IS NULL) ORDER BY display_order ASC, id ASC LIMIT 1").get(id);
        const firstEn = await db.prepare("SELECT image_url FROM weekly_menu_images WHERE menu_id = ? AND lang = 'en' ORDER BY display_order ASC, id ASC LIMIT 1").get(id);

        const mainImageUrl = firstFr?.image_url || null;
        const mainImageUrlEn = firstEn?.image_url || null;

        await db.prepare('UPDATE weekly_menus SET title=?, title_en=?, description=?, description_en=?, image_url=?, image_url_en=?, is_current=? WHERE id=?').run(
            title, title_en, description, description_en, mainImageUrl, mainImageUrlEn, is_current, id
        );

        await logActivity({
            action: 'update',
            category: 'Menu Semaine',
            summary: `Modification du menu : "${title}" (ID #${id})`,
            details: { id, title, is_current }
        });

        revalidatePath('/');
        revalidatePath('/admin/dashboard/menu-semaine');
        return { success: true };
    } catch (err) {
        console.error('[editWeeklyMenu Error]:', err);
        return { error: err.message || 'Une erreur est survenue lors de la modification du menu.' };
    }
}

export async function deleteWeeklyMenu(idOrFormData) {
    try {
        await requireAdminAuth();
        const id = extractId(idOrFormData);
        if (!id) return { error: 'ID invalide' };

        const db = getDb();
        const menu = await db.prepare('SELECT title FROM weekly_menus WHERE id = ?').get(id);
        const images = await db.prepare('SELECT image_url FROM weekly_menu_images WHERE menu_id = ?').all(id);
        images.forEach(img => deleteLocalFileIfPresent(img.image_url));

        await db.prepare('DELETE FROM weekly_menu_images WHERE menu_id = ?').run(id);
        await db.prepare('DELETE FROM weekly_menus WHERE id = ?').run(id);

        await logActivity({
            action: 'delete',
            category: 'Menu Semaine',
            summary: `Suppression du menu de la semaine : "${menu?.title || 'Sans titre'}" (ID #${id})`,
            details: { id, title: menu?.title }
        });

        revalidatePath('/');
        revalidatePath('/admin/dashboard/menu-semaine');
        return { success: true };
    } catch (err) {
        console.error('[deleteWeeklyMenu Error]:', err);
        return { error: err.message || 'Une erreur est survenue lors de la suppression du menu.' };
    }
}

export async function toggleWeeklyMenuCurrent(idOrFormData) {
    try {
        await requireAdminAuth();
        const id = extractId(idOrFormData);
        if (!id) return { error: 'ID invalide' };

        const db = getDb();
        const menu = await db.prepare('SELECT title FROM weekly_menus WHERE id = ?').get(id);
        await db.prepare('UPDATE weekly_menus SET is_current = 0').run();
        await db.prepare('UPDATE weekly_menus SET is_current = 1 WHERE id = ?').run(id);

        await logActivity({
            action: 'toggle',
            category: 'Menu Semaine',
            summary: `Mise en avant du menu : "${menu?.title || 'Sans titre'}" comme menu actif`,
            details: { id, title: menu?.title }
        });

        revalidatePath('/');
        revalidatePath('/admin/dashboard/menu-semaine');
        return { success: true };
    } catch (err) {
        console.error('[toggleWeeklyMenuCurrent Error]:', err);
        return { error: err.message || 'Une erreur est survenue.' };
    }
}

// --- CARROUSEL D'ACCUEIL ---
export async function addCarouselImage(formData) {
    try {
        await requireAdminAuth();
        const title = (formData.get('title') || '').toString().trim();
        const title_en = (formData.get('title_en') || '').toString().trim();
        const subtitle = (formData.get('subtitle') || '').toString().trim();
        const subtitle_en = (formData.get('subtitle_en') || '').toString().trim();
        let display_order = parseInt(formData.get('display_order') || '0', 10);
        const fit_mode = (formData.get('fit_mode') || 'cover').toString().trim();
        const file = formData.get('image_file');
        const mobileFile = formData.get('mobile_image_file');

        let image_url = (formData.get('image_url') || '').toString().trim();
        if (file && file.size > 0) {
            const uploaded = await saveUploadedFile(file);
            if (uploaded) image_url = uploaded;
        }

        let mobile_image_url = (formData.get('mobile_image_url') || '').toString().trim();
        if (mobileFile && mobileFile.size > 0) {
            const uploadedMobile = await saveUploadedFile(mobileFile);
            if (uploadedMobile) mobile_image_url = uploadedMobile;
        }

        if (!image_url) {
            return { error: 'Veuillez sélectionner au moins une photo principale pour grand écran.' };
        }

        const db = getDb();
        if (!display_order) {
            // Nouvelle photo : placée à la fin du carrousel (plusieurs imports successifs gardent leur ordre)
            const last = await db.prepare('SELECT MAX(display_order) as max_order FROM carousel_images').get();
            display_order = (Number(last?.max_order) || 0) + 1;
        }
        await db.prepare('INSERT INTO carousel_images (image_url, mobile_image_url, title, title_en, subtitle, subtitle_en, fit_mode, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(image_url, mobile_image_url || null, title, title_en, subtitle, subtitle_en, fit_mode, display_order);

        revalidatePath('/');
        revalidatePath('/admin/dashboard/carousel');

        await logActivity({
            action: 'add',
            category: 'Carrousel Bannière',
            summary: `Ajout d'une diapositive au carrousel : "${title || 'Sans titre'}"`,
            details: { title, fit_mode, image_url }
        });

        return { success: true };
    } catch (err) {
        console.error('addCarouselImage error:', err);
        return { error: err.message || "Erreur lors de l'ajout de la photo." };
    }
}

export async function deleteCarouselImage(idOrFormData) {
    try {
        await requireAdminAuth();
        const id = extractId(idOrFormData);
        if (!id) return { error: 'ID invalide' };

        const db = getDb();
        const img = await db.prepare('SELECT title, image_url, mobile_image_url FROM carousel_images WHERE id = ?').get(id);
        if (img) {
            deleteLocalFileIfPresent(img.image_url);
            deleteLocalFileIfPresent(img.mobile_image_url);
        }

        await db.prepare('DELETE FROM carousel_images WHERE id = ?').run(id);

        await logActivity({
            action: 'delete',
            category: 'Carrousel Bannière',
            summary: `Suppression de la diapositive : "${img?.title || 'Sans titre'}" (ID #${id})`,
            details: { id, title: img?.title }
        });

        revalidatePath('/');
        revalidatePath('/admin/dashboard/carousel');
        return { success: true };
    } catch (err) {
        console.error('deleteCarouselImage error:', err);
        return { error: err.message || 'Erreur lors de la suppression.' };
    }
}

export async function editCarouselImage(formData) {
    try {
        await requireAdminAuth();
        const id = parseInt(formData.get('id') || '0', 10);
        if (!id) return { error: 'ID de la photo invalide' };

        const title = (formData.get('title') || '').toString().trim();
        const title_en = (formData.get('title_en') || '').toString().trim();
        const subtitle = (formData.get('subtitle') || '').toString().trim();
        const subtitle_en = (formData.get('subtitle_en') || '').toString().trim();
        let display_order = parseInt(formData.get('display_order') || '0', 10);
        const fit_mode = (formData.get('fit_mode') || 'cover').toString().trim();
        const file = formData.get('image_file');
        const mobileFile = formData.get('mobile_image_file');
        const removeMobile = formData.get('remove_mobile_image') === '1';

        let image_url = (formData.get('image_url') || '').toString().trim();
        let mobile_image_url = (formData.get('mobile_image_url') || '').toString().trim();

        const db = getDb();
        const existing = await db.prepare('SELECT image_url, mobile_image_url, fit_mode, display_order FROM carousel_images WHERE id = ?').get(id);
        if (!existing) return { error: 'Photo du carrousel introuvable' };
        if (!display_order) display_order = existing.display_order || 1;

        if (file && file.size > 0) {
            const uploaded = await saveUploadedFile(file);
            if (uploaded) image_url = uploaded;
        }

        if (!image_url) {
            image_url = existing.image_url;
        }

        if (removeMobile) {
            mobile_image_url = null;
        } else if (mobileFile && mobileFile.size > 0) {
            const uploadedMobile = await saveUploadedFile(mobileFile);
            if (uploadedMobile) mobile_image_url = uploadedMobile;
        } else if (!mobile_image_url) {
            mobile_image_url = existing.mobile_image_url;
        }

        await db.prepare(`
            UPDATE carousel_images
            SET title = ?, title_en = ?, subtitle = ?, subtitle_en = ?, image_url = ?, mobile_image_url = ?, fit_mode = ?, display_order = ?
            WHERE id = ?
        `).run(title, title_en, subtitle, subtitle_en, image_url, mobile_image_url, fit_mode, display_order, id);

        await logActivity({
            action: 'update',
            category: 'Carrousel Bannière',
            summary: `Modification de la diapositive : "${title || 'Sans titre'}" (ID #${id})`,
            details: { id, title, fit_mode }
        });

        revalidatePath('/');
        revalidatePath('/admin/dashboard/carousel');
        return { success: true };
    } catch (err) {
        console.error('editCarouselImage error:', err);
        return { error: err.message || 'Erreur lors de la modification de la bannière.' };
    }
}

export async function reorderCarouselImage(idOrFormData, direction) {
    try {
        await requireAdminAuth();
        const id = extractId(idOrFormData);
        if (!id) return { error: 'ID invalide' };

        const db = getDb();
        const images = await db.prepare('SELECT id, display_order FROM carousel_images ORDER BY display_order ASC, id ASC').all();
        const index = images.findIndex(img => img.id === id);
        if (index === -1) return { error: 'Photo du carrousel introuvable' };

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= images.length) return { success: true };

        const [moved] = images.splice(index, 1);
        images.splice(targetIndex, 0, moved);

        const stmt = db.prepare('UPDATE carousel_images SET display_order = ? WHERE id = ?');
        for (let i = 0; i < images.length; i++) {
            await stmt.run(i + 1, images[i].id);
        }

        revalidatePath('/');
        revalidatePath('/admin/dashboard/carousel');
        return { success: true };
    } catch (err) {
        console.error('reorderCarouselImage error:', err);
        return { error: err.message || 'Erreur lors de la réorganisation du carrousel.' };
    }
}

// --- GALERIE ---
export async function addGalleryPost(formData) {
    try {
        await requireAdminAuth();
        const title = (formData.get('title') || '').toString().trim();
        const title_en = (formData.get('title_en') || '').toString().trim();
        const caption = (formData.get('caption') || '').toString().trim();
        const caption_en = (formData.get('caption_en') || '').toString().trim();
        let media_type = (formData.get('media_type') || 'image').toString().trim();
        const image_url_text = (formData.get('image_url') || '').toString().trim();
        const file = formData.get('image_file');

        let image_url = image_url_text;
        let thumbnail_url = '';
        if (file && file.size > 0) {
            if (file.type && file.type.startsWith('video/')) {
                media_type = 'video';
            }
            const uploaded = await saveUploadedFile(file);
            if (uploaded) image_url = uploaded;
        }

        const thumbFile = formData.get('thumbnail_file');
        if (thumbFile && thumbFile.size > 0) {
            const uploadedThumb = await saveUploadedFile(thumbFile);
            if (uploadedThumb) thumbnail_url = uploadedThumb;
        }
        if (!thumbnail_url) thumbnail_url = image_url;

        if (!image_url) {
            return { error: 'Veuillez sélectionner un fichier ou coller une URL' };
        }

        const db = getDb();
        await db.prepare('UPDATE gallery_posts SET display_order = display_order + 1').run();
        await db.prepare('INSERT INTO gallery_posts (title, title_en, caption, caption_en, image_url, thumbnail_url, media_type, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, 1)').run(
            title, title_en, caption, caption_en, image_url, thumbnail_url, media_type
        );

        // Nettoyage automatique : limiter la galerie aux 30 plus récentes
        const allPosts = await db.prepare('SELECT id, image_url, thumbnail_url FROM gallery_posts ORDER BY created_at DESC').all();
        if (allPosts.length > 30) {
            const postsToDelete = allPosts.slice(30);
            for (const oldPost of postsToDelete) {
                deleteLocalFileIfPresent(oldPost.image_url);
                if (oldPost.thumbnail_url && oldPost.thumbnail_url !== oldPost.image_url) {
                    deleteLocalFileIfPresent(oldPost.thumbnail_url);
                }
                await db.prepare('DELETE FROM gallery_posts WHERE id = ?').run(oldPost.id);
            }
        }

        revalidatePath('/');
        revalidatePath('/realisations');
        revalidatePath('/galerie');
        revalidatePath('/admin/dashboard/galerie');

        await logActivity({
            action: 'add',
            category: 'Galerie',
            summary: `Ajout d'une ${media_type === 'video' ? 'vidéo' : 'photo'} dans la galerie : "${title || 'Sans titre'}"`,
            details: { title, media_type, image_url }
        });

        return { success: true };
    } catch (err) {
        console.error('[Gallery] Erreur :', err);
        return { error: err.message || 'Une erreur est survenue lors de la publication.' };
    }
}

export async function editGalleryPost(formData) {
    try {
        await requireAdminAuth();
        const id = extractId(formData);
        if (!id) return { error: 'ID invalide' };

        const title = (formData.get('title') || '').toString().trim();
        const title_en = (formData.get('title_en') || '').toString().trim();
        const caption = (formData.get('caption') || '').toString().trim();
        const caption_en = (formData.get('caption_en') || '').toString().trim();

        const db = getDb();
        const file = formData.get('image_file');
        const thumbFile = formData.get('thumbnail_file');
        let newImageUrl = null;
        let newThumbUrl = null;

        if (file && file.size > 0) {
            const uploaded = await saveUploadedFile(file);
            if (uploaded) {
                newImageUrl = uploaded;
                const oldPost = await db.prepare('SELECT image_url FROM gallery_posts WHERE id = ?').get(id);
                if (oldPost) deleteLocalFileIfPresent(oldPost.image_url);
                await db.prepare('UPDATE gallery_posts SET image_url = ? WHERE id = ?').run(uploaded, id);
            }
        }

        if (thumbFile && thumbFile.size > 0) {
            const uploadedThumb = await saveUploadedFile(thumbFile);
            if (uploadedThumb) {
                newThumbUrl = uploadedThumb;
                const oldPost = await db.prepare('SELECT thumbnail_url, image_url FROM gallery_posts WHERE id = ?').get(id);
                if (oldPost && oldPost.thumbnail_url && oldPost.thumbnail_url !== oldPost.image_url) {
                    deleteLocalFileIfPresent(oldPost.thumbnail_url);
                }
                await db.prepare('UPDATE gallery_posts SET thumbnail_url = ? WHERE id = ?').run(uploadedThumb, id);
            }
        }

        if (formData.has('title') || formData.has('caption')) {
            await db.prepare('UPDATE gallery_posts SET title = ?, title_en = ?, caption = ?, caption_en = ? WHERE id = ?').run(
                title, title_en, caption, caption_en, id
            );
        }

        await logActivity({
            action: 'update',
            category: 'Galerie',
            summary: `Modification d'une publication de la galerie : "${title || 'Sans titre'}" (ID #${id})`,
            details: { id, title, newImageUrl: Boolean(newImageUrl), newThumbUrl: Boolean(newThumbUrl) }
        });

        revalidatePath('/');
        revalidatePath('/realisations');
        revalidatePath('/galerie');
        revalidatePath('/admin/dashboard/galerie');
        return { success: true, image_url: newImageUrl, thumbnail_url: newThumbUrl };
    } catch (err) {
        console.error('[Gallery Edit] Erreur :', err);
        return { error: err.message || 'Erreur lors de la mise à jour.' };
    }
}

export async function deleteGalleryPost(idOrFormData) {
    await requireAdminAuth();
    const id = extractId(idOrFormData);
    if (!id) return { error: 'ID invalide' };

    const db = getDb();
    const post = await db.prepare('SELECT title, image_url, thumbnail_url FROM gallery_posts WHERE id = ?').get(id);
    if (post) {
        deleteLocalFileIfPresent(post.image_url);
        if (post.thumbnail_url && post.thumbnail_url !== post.image_url) {
            deleteLocalFileIfPresent(post.thumbnail_url);
        }
    }

    await db.prepare('DELETE FROM gallery_posts WHERE id = ?').run(id);

    await logActivity({
        action: 'delete',
        category: 'Galerie',
        summary: `Suppression d'une photo/vidéo de la galerie : "${post?.title || 'Sans titre'}" (ID #${id})`,
        details: { id, title: post?.title, image_url: post?.image_url }
    });

    revalidatePath('/');
    revalidatePath('/realisations');
    revalidatePath('/galerie');
    revalidatePath('/admin/dashboard/galerie');
    return { success: true };
}

export async function moveGalleryPostPosition(idOrFormData, targetPosition) {
    await requireAdminAuth();
    const id = extractId(idOrFormData);
    const targetPos = parseInt(targetPosition, 10);
    if (!id || isNaN(targetPos) || targetPos < 1) return { error: 'Paramètres invalides' };

    const db = getDb();
    const posts = await db.prepare('SELECT id, display_order FROM gallery_posts ORDER BY display_order ASC, created_at DESC').all();
    const currentIndex = posts.findIndex(p => p.id === id);
    if (currentIndex === -1) return { error: 'Photo introuvable' };

    const targetIndex = Math.max(0, Math.min(posts.length - 1, targetPos - 1));
    if (currentIndex === targetIndex) return { success: true };

    const [moved] = posts.splice(currentIndex, 1);
    posts.splice(targetIndex, 0, moved);

    const stmt = db.prepare('UPDATE gallery_posts SET display_order = ? WHERE id = ?');
    for (let i = 0; i < posts.length; i++) {
        await stmt.run(i + 1, posts[i].id);
    }

    revalidatePath('/');
    revalidatePath('/realisations');
    revalidatePath('/galerie');
    revalidatePath('/admin/dashboard/galerie');
    return { success: true };
}

export async function reorderGalleryPost(idOrFormData, direction) {
    await requireAdminAuth();
    const id = extractId(idOrFormData);
    if (!id) return { error: 'ID invalide' };

    const db = getDb();
    const posts = await db.prepare('SELECT id FROM gallery_posts ORDER BY display_order ASC, created_at DESC').all();
    const currentIndex = posts.findIndex(p => p.id === id);
    if (currentIndex === -1) return { error: 'Photo introuvable' };

    const targetPos = direction === 'up' ? currentIndex : currentIndex + 2; // position cible (à partir de 1)
    if (targetPos < 1 || targetPos > posts.length) return { success: true };

    return moveGalleryPostPosition(id, targetPos);
}

// --- FORMULAIRE DE CONTACT ET DEVIS (PUBLIC) ---
export async function submitContactForm(formData) {
    const headerStore = await headers();
    const ip = clientIp(headerStore);
    const limitKey = `contact:${ip}`;
    if (await isRateLimited(limitKey, 5, 10 * 60 * 1000)) {
        return { error: 'Trop de messages envoyés récemment. Merci de patienter quelques minutes avant de renouveler votre demande.' };
    }

    // 1. Vérification anti-spam (champ piège)
    const honeypot = (formData.get('_hp_check') || '').toString().trim();
    if (honeypot) {
        // Réponse de succès silencieuse pour tromper les robots sans rien enregistrer en base
        return { success: true, message: 'Votre demande a bien été envoyée.' };
    }

    const name = (formData.get('name') || '').toString().trim();
    const email = (formData.get('email') || '').toString().trim();
    const phone = (formData.get('phone') || '').toString().trim();
    const event_type = (formData.get('event_type') || '').toString().trim();
    const guests = (formData.get('guests') || '').toString().trim();
    const event_date = (formData.get('event_date') || '').toString().trim();
    const message = (formData.get('message') || '').toString().trim();

    // 2. Validation Nom
    if (!name || name.length < 2) {
        return { error: 'Veuillez renseigner votre nom complet (au moins 2 caractères).' };
    }
    if (name.length > 100) {
        return { error: 'Le nom est trop long (maximum 100 caractères).' };
    }

    // 3. Validation Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!email || !emailRegex.test(email) || email.length > 150) {
        return { error: 'Veuillez saisir une adresse email valide (ex : nom@domaine.fr).' };
    }

    // 4. Validation Téléphone (si renseigné)
    if (phone) {
        // Rejeter formellement si l'utilisateur a écrit du texte / des lettres
        if (/[a-zA-Z]/.test(phone)) {
            return { error: 'Le champ téléphone ne doit pas contenir de texte. Veuillez saisir un numéro valide (ex : 06 12 34 56 78).' };
        }
        // Autoriser uniquement chiffres, espaces, tirets, points, parenthèses, et préfixe +
        if (!/^(\+?[0-9\s().-]{8,25})$/.test(phone)) {
            return { error: 'Format de téléphone invalide. Veuillez saisir un numéro valide (ex : 06 12 34 56 78 ou +33 6 12 34 56 78).' };
        }
        const pureDigits = phone.replace(/\D/g, '');
        if (pureDigits.length < 8 || pureDigits.length > 15) {
            return { error: 'Le numéro de téléphone doit comporter entre 8 et 15 chiffres.' };
        }
    }

    // 5. Validation Nombre de convives (si renseigné)
    if (guests) {
        const guestNum = parseInt(guests, 10);
        if (isNaN(guestNum) || guestNum <= 0 || guestNum > 5000) {
            return { error: 'Veuillez indiquer un nombre de convives valide (entre 1 et 5 000).' };
        }
        if (/[a-zA-Z]/.test(guests) && !/^\d+\s*(personnes|pers|pax|invités|guests)?$/i.test(guests)) {
            return { error: 'Veuillez indiquer un nombre de convives valide (ex : 20).' };
        }
    }

    // 6. Validation Date de l'événement (si renseignée)
    if (event_date) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date)) {
            return { error: 'Format de date invalide.' };
        }
        const todayStr = new Date().toISOString().split('T')[0];
        if (event_date < todayStr) {
            return { error: 'La date souhaitée ne peut pas être une date déjà passée.' };
        }
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 5);
        const maxDateStr = maxDate.toISOString().split('T')[0];
        if (event_date > maxDateStr) {
            return { error: 'La date souhaitée est trop éloignée dans le futur.' };
        }
    }

    // 7. Validation Message
    if (!message || message.length < 5) {
        return { error: 'Veuillez écrire un message détaillant votre demande (au moins 5 caractères).' };
    }
    if (message.length > 5000) {
        return { error: 'Votre message est trop volumineux (maximum 5 000 caractères).' };
    }

    const db = getDb();
    await db.prepare(`
        INSERT INTO contact_messages (name, email, phone, event_type, guests, event_date, message)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, email, phone, event_type, guests, event_date, message);

    await registerHit(limitKey, 10 * 60 * 1000);

    revalidatePath('/admin/dashboard/messages');

    sendContactNotification({ name, email, phone, event_type, guests, event_date, message }).catch(
        (err) => console.error('[Email] Erreur inattendue notification :', err)
    );

    return { success: true, message: 'Votre demande a bien été envoyée. Mamé Fricoto vous recontactera rapidement !' };
}

export async function markMessageRead(idOrFormData) {
    await requireAdminAuth();
    const id = extractId(idOrFormData);
    if (!id) return { error: 'ID invalide' };

    const db = getDb();
    await db.prepare("UPDATE contact_messages SET is_read = 1, status = 'en_cours' WHERE id = ?").run(id);
    revalidatePath('/admin/dashboard/messages');
    revalidatePath('/admin/dashboard');
    return { success: true };
}

export async function deleteMessage(idOrFormData) {
    await requireAdminAuth();
    const id = extractId(idOrFormData);
    if (!id) return { error: 'ID invalide' };

    const db = getDb();
    await db.prepare('DELETE FROM contact_messages WHERE id = ?').run(id);
    revalidatePath('/admin/dashboard/messages');
    return { success: true };
}

export async function updateMessageStatus(id, status) {
    await requireAdminAuth();
    if (!id) return { error: 'ID invalide' };
    const validStatuses = ['nouveau', 'en_cours', 'effectue', 'annule'];
    if (!validStatuses.includes(status)) return { error: 'Statut invalide' };

    const isRead = status === 'nouveau' ? 0 : 1;
    const db = getDb();
    await db.prepare('UPDATE contact_messages SET status = ?, is_read = ? WHERE id = ?').run(status, isRead, id);
    revalidatePath('/admin/dashboard/messages');
    revalidatePath('/admin/dashboard');
    return { success: true };
}

export async function updateMessageNotes(id, notes) {
    await requireAdminAuth();
    if (!id) return { error: 'ID invalide' };

    const db = getDb();
    await db.prepare('UPDATE contact_messages SET admin_notes = ? WHERE id = ?').run(notes || '', id);
    revalidatePath('/admin/dashboard/messages');
    return { success: true };
}


export async function deleteWeeklyMenuImage(imageId) {
    try {
        await requireAdminAuth();
        const db = getDb();
        const img = await db.prepare('SELECT * FROM weekly_menu_images WHERE id = ?').get(imageId);
        if (!img) return { error: 'Image non trouvée' };

        deleteLocalFileIfPresent(img.image_url);
        await db.prepare('DELETE FROM weekly_menu_images WHERE id = ?').run(imageId);

        const isEn = img.lang === 'en';
        const remaining = isEn
            ? await db.prepare("SELECT id, image_url FROM weekly_menu_images WHERE menu_id = ? AND lang = 'en' ORDER BY display_order ASC, id ASC").all(img.menu_id)
            : await db.prepare("SELECT id, image_url FROM weekly_menu_images WHERE menu_id = ? AND (lang = 'fr' OR lang IS NULL) ORDER BY display_order ASC, id ASC").all(img.menu_id);

        const stmt = db.prepare('UPDATE weekly_menu_images SET display_order = ? WHERE id = ?');
        for (let i = 0; i < remaining.length; i++) {
            await stmt.run(i + 1, remaining[i].id);
        }

        if (isEn) {
            const nextUrlEn = remaining.length > 0 ? remaining[0].image_url : null;
            await db.prepare('UPDATE weekly_menus SET image_url_en = ? WHERE id = ?').run(nextUrlEn, img.menu_id);
        } else {
            const nextUrl = remaining.length > 0 ? remaining[0].image_url : null;
            await db.prepare('UPDATE weekly_menus SET image_url = ? WHERE id = ?').run(nextUrl, img.menu_id);
        }

        revalidatePath('/');
        revalidatePath('/admin/dashboard/menu-semaine');
        return { success: true };
    } catch (err) {
        console.error('[deleteWeeklyMenuImage Error]:', err);
        return { error: err.message || 'Une erreur est survenue lors de la suppression de l\'image.' };
    }
}

export async function deleteWeeklyMenuImages(imageIds) {
    try {
        await requireAdminAuth();
        if (!Array.isArray(imageIds) || imageIds.length === 0) return { error: 'Aucune image sélectionnée.' };
        const db = getDb();
        
        const affectedMenuIds = new Set();
        for (const imgId of imageIds) {
            const img = await db.prepare('SELECT * FROM weekly_menu_images WHERE id = ?').get(imgId);
            if (img) {
                affectedMenuIds.add(img.menu_id);
                deleteLocalFileIfPresent(img.image_url);
                await db.prepare('DELETE FROM weekly_menu_images WHERE id = ?').run(imgId);
            }
        }

        for (const menuId of affectedMenuIds) {
            // Réordonne et synchronise la version FR
            const remainingFr = await db.prepare("SELECT id, image_url FROM weekly_menu_images WHERE menu_id = ? AND (lang = 'fr' OR lang IS NULL) ORDER BY display_order ASC, id ASC").all(menuId);
            const stmtFr = db.prepare('UPDATE weekly_menu_images SET display_order = ? WHERE id = ?');
            for (let i = 0; i < remainingFr.length; i++) {
                await stmtFr.run(i + 1, remainingFr[i].id);
            }
            const nextUrlFr = remainingFr.length > 0 ? remainingFr[0].image_url : null;
            await db.prepare('UPDATE weekly_menus SET image_url = ? WHERE id = ?').run(nextUrlFr, menuId);

            // Réordonne et synchronise la version EN
            const remainingEn = await db.prepare("SELECT id, image_url FROM weekly_menu_images WHERE menu_id = ? AND lang = 'en' ORDER BY display_order ASC, id ASC").all(menuId);
            const stmtEn = db.prepare('UPDATE weekly_menu_images SET display_order = ? WHERE id = ?');
            for (let i = 0; i < remainingEn.length; i++) {
                await stmtEn.run(i + 1, remainingEn[i].id);
            }
            const nextUrlEn = remainingEn.length > 0 ? remainingEn[0].image_url : null;
            await db.prepare('UPDATE weekly_menus SET image_url_en = ? WHERE id = ?').run(nextUrlEn, menuId);
        }

        revalidatePath('/');
        revalidatePath('/admin/dashboard/menu-semaine');
        return { success: true };
    } catch (err) {
        console.error('[deleteWeeklyMenuImages Error]:', err);
        return { error: err.message || 'Une erreur est survenue lors de la suppression des images.' };
    }
}

export async function reorderWeeklyMenuImage(imageId, direction) {
    try {
        await requireAdminAuth();
        const db = getDb();
        const img = await db.prepare('SELECT * FROM weekly_menu_images WHERE id = ?').get(imageId);
        if (!img) return { error: 'Image non trouvée' };

        const isEn = img.lang === 'en';
        const images = isEn
            ? await db.prepare("SELECT id, display_order FROM weekly_menu_images WHERE menu_id = ? AND lang = 'en' ORDER BY display_order ASC, id ASC").all(img.menu_id)
            : await db.prepare("SELECT id, display_order FROM weekly_menu_images WHERE menu_id = ? AND (lang = 'fr' OR lang IS NULL) ORDER BY display_order ASC, id ASC").all(img.menu_id);

        const index = images.findIndex(i => i.id === imageId);
        if (index === -1) return { error: 'Image non trouvée' };

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= images.length) return { success: true };

        const [moved] = images.splice(index, 1);
        images.splice(targetIndex, 0, moved);

        const stmt = db.prepare('UPDATE weekly_menu_images SET display_order = ? WHERE id = ?');
        for (let i = 0; i < images.length; i++) {
            await stmt.run(i + 1, images[i].id);
        }

        const updatedImages = isEn
            ? await db.prepare("SELECT image_url FROM weekly_menu_images WHERE menu_id = ? AND lang = 'en' ORDER BY display_order ASC, id ASC").all(img.menu_id)
            : await db.prepare("SELECT image_url FROM weekly_menu_images WHERE menu_id = ? AND (lang = 'fr' OR lang IS NULL) ORDER BY display_order ASC, id ASC").all(img.menu_id);

        if (isEn) {
            if (updatedImages.length > 0) {
                await db.prepare('UPDATE weekly_menus SET image_url_en = ? WHERE id = ?').run(updatedImages[0].image_url, img.menu_id);
            }
        } else {
            if (updatedImages.length > 0) {
                await db.prepare('UPDATE weekly_menus SET image_url = ? WHERE id = ?').run(updatedImages[0].image_url, img.menu_id);
            }
        }

        revalidatePath('/');
        revalidatePath('/admin/dashboard/menu-semaine');
        return { success: true };
    } catch (err) {
        console.error('[reorderWeeklyMenuImage Error]:', err);
        return { error: err.message || 'Une erreur est survenue lors de la réorganisation.' };
    }
}

export async function replaceWeeklyMenuImage(imageId, formData) {
    try {
        await requireAdminAuth();
        const file = formData.get('image_file');
        if (!file || file.size === 0) return { error: 'Aucun fichier reçu' };
        const db = getDb();
        const img = await db.prepare('SELECT * FROM weekly_menu_images WHERE id = ?').get(imageId);
        if (!img) return { error: 'Image non trouvée' };

        const newUrl = await saveUploadedFile(file);
        if (!newUrl) return { error: 'Échec de l’enregistrement du fichier' };

        deleteLocalFileIfPresent(img.image_url);
        await db.prepare('UPDATE weekly_menu_images SET image_url = ? WHERE id = ?').run(newUrl, imageId);

        const isEn = img.lang === 'en';
        const first = isEn
            ? await db.prepare("SELECT id FROM weekly_menu_images WHERE menu_id = ? AND lang = 'en' ORDER BY display_order ASC, id ASC LIMIT 1").get(img.menu_id)
            : await db.prepare("SELECT id FROM weekly_menu_images WHERE menu_id = ? AND (lang = 'fr' OR lang IS NULL) ORDER BY display_order ASC, id ASC LIMIT 1").get(img.menu_id);

        if (first?.id === imageId) {
            if (isEn) {
                await db.prepare('UPDATE weekly_menus SET image_url_en = ? WHERE id = ?').run(newUrl, img.menu_id);
            } else {
                await db.prepare('UPDATE weekly_menus SET image_url = ? WHERE id = ?').run(newUrl, img.menu_id);
            }
        }

        revalidatePath('/');
        revalidatePath('/admin/dashboard/menu-semaine');
        return { success: true, image_url: newUrl };
    } catch (err) {
        console.error('[replaceWeeklyMenuImage Error]:', err);
        return { error: err.message || 'Erreur lors du recadrage de l’image.' };
    }
}

// --- PRESTATIONS ---
export async function addService(formData) {
    try {
        await requireAdminAuth();
        const title = (formData.get('title') || '').toString().trim();
        const title_en = (formData.get('title_en') || '').toString().trim();
        const description = (formData.get('description') || '').toString().trim();
        const description_en = (formData.get('description_en') || '').toString().trim();
        const badge = (formData.get('badge') || '').toString().trim();
        const badge_en = (formData.get('badge_en') || '').toString().trim();
        const num = (formData.get('num') || '').toString().trim();

        if (!title || !description) {
            return { error: 'Veuillez remplir le titre et la description.' };
        }

        const db = getDb();
        const maxRow = await db.prepare('SELECT MAX(display_order) as maxOrder FROM services').get();
        const nextOrder = (maxRow?.maxOrder || 0) + 1;

        const formattedNum = num || (nextOrder < 10 ? `0${nextOrder}` : `${nextOrder}`);

        await db.prepare('INSERT INTO services (num, title, title_en, description, description_en, badge, badge_en, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
            formattedNum, title, title_en, description, description_en, badge, badge_en, nextOrder
        );

        revalidatePath('/');
        revalidatePath('/a-propos');
        revalidatePath('/tarifs');
        revalidatePath('/admin/dashboard/a-propos');
        revalidatePath('/admin/dashboard/prestations');

        await logActivity({
            action: 'add',
            category: 'Prestations',
            summary: `Ajout d'une prestation : "${title}"`,
            details: { title, num: formattedNum, badge }
        });

        return { success: true };
    } catch (err) {
        console.error('[addService Error]:', err);
        return { error: err.message || 'Une erreur est survenue lors de l\'ajout de la prestation.' };
    }
}

export async function editService(formData) {
    try {
        await requireAdminAuth();
        const id = extractId(formData);
        if (!id) return { error: 'ID invalide' };

        const title = (formData.get('title') || '').toString().trim();
        const title_en = (formData.get('title_en') || '').toString().trim();
        const description = (formData.get('description') || '').toString().trim();
        const description_en = (formData.get('description_en') || '').toString().trim();
        const badge = (formData.get('badge') || '').toString().trim();
        const badge_en = (formData.get('badge_en') || '').toString().trim();
        const num = (formData.get('num') || '').toString().trim();

        if (!title || !description) {
            return { error: 'Veuillez remplir le titre et la description.' };
        }

        const db = getDb();
        await db.prepare('UPDATE services SET num = ?, title = ?, title_en = ?, description = ?, description_en = ?, badge = ?, badge_en = ? WHERE id = ?').run(
            num, title, title_en, description, description_en, badge, badge_en, id
        );

        await logActivity({
            action: 'update',
            category: 'Prestations',
            summary: `Modification de la prestation : "${title}" (ID #${id})`,
            details: { id, title, num }
        });

        revalidatePath('/');
        revalidatePath('/a-propos');
        revalidatePath('/tarifs');
        revalidatePath('/admin/dashboard/a-propos');
        revalidatePath('/admin/dashboard/prestations');
        return { success: true };
    } catch (err) {
        console.error('[editService Error]:', err);
        return { error: err.message || 'Une erreur est survenue lors de la modification de la prestation.' };
    }
}

export async function deleteService(idOrFormData) {
    try {
        await requireAdminAuth();
        const id = extractId(idOrFormData);
        if (!id) return { error: 'ID invalide' };

        const db = getDb();
        const srv = await db.prepare('SELECT title FROM services WHERE id = ?').get(id);
        await db.prepare('DELETE FROM services WHERE id = ?').run(id);

        await logActivity({
            action: 'delete',
            category: 'Prestations',
            summary: `Suppression de la prestation : "${srv?.title || 'Sans titre'}" (ID #${id})`,
            details: { id, title: srv?.title }
        });

        revalidatePath('/');
        revalidatePath('/a-propos');
        revalidatePath('/tarifs');
        revalidatePath('/admin/dashboard/a-propos');
        revalidatePath('/admin/dashboard/prestations');
        return { success: true };
    } catch (err) {
        console.error('[deleteService Error]:', err);
        return { error: err.message || 'Une erreur est survenue lors de la suppression de la prestation.' };
    }
}

export async function reorderService(id, direction) {
    try {
        await requireAdminAuth();
        const targetId = Number(id);
        const db = getDb();
        const services = await db.prepare('SELECT id FROM services ORDER BY display_order ASC, id ASC').all();
        const index = services.findIndex(s => Number(s.id) === targetId);
        if (index === -1) return { error: 'Prestation non trouvée' };

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= services.length) return { success: true };

        const temp = services[index];
        services[index] = services[targetIndex];
        services[targetIndex] = temp;

        const stmt = db.prepare('UPDATE services SET display_order = ? WHERE id = ?');
        for (let i = 0; i < services.length; i++) {
            await stmt.run(i + 1, services[i].id);
        }

        revalidatePath('/');
        revalidatePath('/a-propos');
        revalidatePath('/tarifs');
        revalidatePath('/admin/dashboard/a-propos');
        revalidatePath('/admin/dashboard/prestations');
        return { success: true };
    } catch (err) {
        console.error('[reorderService Error]:', err);
        return { error: err.message || 'Une erreur est survenue.' };
    }
}

// --- À PROPOS (HISTOIRE & IMAGE) ---
export async function updateAboutInfo(formData) {
    try {
        await requireAdminAuth();
        const db = getDb();

        const about_text = (formData.get('about_text') || '').toString().trim();
        const about_text_en = (formData.get('about_text_en') || '').toString().trim();
        const tagline = (formData.get('tagline') || '').toString().trim();
        const tagline_en = (formData.get('tagline_en') || '').toString().trim();

        const stmt = db.prepare(`
            INSERT INTO site_info (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `);

        if (formData.has('about_text')) await stmt.run('about_text', (formData.get('about_text') || '').toString().trim());
        if (formData.has('about_text_en')) await stmt.run('about_text_en', (formData.get('about_text_en') || '').toString().trim());
        if (formData.has('tagline')) await stmt.run('tagline', tagline);
        if (formData.has('tagline_en')) await stmt.run('tagline_en', tagline_en);

        // Synchronisation bidirectionnelle vers custom_texts (pour que /admin/dashboard/textes affiche immédiatement les mêmes valeurs)
        if (formData.has('tagline') || formData.has('tagline_en')) {
            const textsRow = await db.prepare('SELECT value FROM site_info WHERE key = ?').get(CUSTOM_TEXTS_KEY);
            const custom = parseCustomTexts(textsRow?.value);
            if (formData.has('tagline')) {
                if (tagline) {
                    custom.fr['about.pageTagline'] = tagline;
                    custom.fr['footer.tagline'] = tagline;
                } else {
                    delete custom.fr['about.pageTagline'];
                    delete custom.fr['footer.tagline'];
                }
            }
            if (formData.has('tagline_en')) {
                if (tagline_en) {
                    custom.en['about.pageTagline'] = tagline_en;
                    custom.en['footer.tagline'] = tagline_en;
                } else {
                    delete custom.en['about.pageTagline'];
                    delete custom.en['footer.tagline'];
                }
            }
            await stmt.run(CUSTOM_TEXTS_KEY, JSON.stringify(custom));
        }

        const aboutFile = formData.get('about_file');
        if (aboutFile && aboutFile.size > 0) {
            const aboutUrl = await saveUploadedFile(aboutFile);
            if (aboutUrl) await stmt.run('about_image', aboutUrl);
        }

        await logActivity({
            action: 'update',
            category: 'À Propos',
            summary: "Mise à jour des textes et de la photo de la page À Propos",
            details: { hasNewImage: Boolean(aboutFile && aboutFile.size > 0) }
        });

        revalidatePath('/', 'layout');
        revalidatePath('/');
        revalidatePath('/a-propos');
        revalidatePath('/admin/dashboard/a-propos');
        revalidatePath('/admin/dashboard/textes');
        revalidatePath('/admin/dashboard/settings');
        return { success: true };
    } catch (err) {
        console.error('[updateAboutInfo Error]:', err);
        return { error: err.message || 'Une erreur est survenue lors de l\'enregistrement des informations À Propos.' };
    }
}

// --- DOCUMENTS TARIFAIRES (TARIFS MULTI-IMAGES ET PDF) ---
export async function addPricingDocument(formData) {
    try {
        await requireAdminAuth();
        const title = (formData.get('title') || '').toString().trim();
        const title_en = (formData.get('title_en') || '').toString().trim();
        const description = (formData.get('description') || '').toString().trim();
        const description_en = (formData.get('description_en') || '').toString().trim();
        const file_type_param = (formData.get('file_type') || '').toString().trim();

        if (!title) {
            return { error: 'Veuillez saisir un titre pour la carte / grille tarifaire.' };
        }

        const files_fr = formData.getAll('image_files_fr').length > 0 ? formData.getAll('image_files_fr') : formData.getAll('image_files');
        const files_en = formData.getAll('image_files_en');
        const singlePdfFr = formData.get('file_fr');
        const singlePdfEn = formData.get('file_en');

        const uploadedUrlsFr = [];
        const uploadedUrlsEn = [];

        const isPdf = file_type_param === 'pdf' || (singlePdfFr && singlePdfFr.size > 0 && singlePdfFr.name?.toLowerCase().endsWith('.pdf'));

        if (isPdf) {
            if (singlePdfFr && singlePdfFr.size > 0) {
                const u = await saveUploadedFile(singlePdfFr);
                if (u) uploadedUrlsFr.push(u);
            }
            if (singlePdfEn && singlePdfEn.size > 0) {
                const u = await saveUploadedFile(singlePdfEn);
                if (u) uploadedUrlsEn.push(u);
            }
        } else {
            // Plusieurs images FR
            for (const file of files_fr) {
                if (file && file.size > 0) {
                    const u = await saveUploadedFile(file);
                    if (u) uploadedUrlsFr.push(u);
                }
            }
            // Plusieurs images EN
            for (const file of files_en) {
                if (file && file.size > 0) {
                    const u = await saveUploadedFile(file);
                    if (u) uploadedUrlsEn.push(u);
                }
            }
        }

        if (uploadedUrlsFr.length === 0) {
            return { error: 'Veuillez téléverser au moins une image ou un document PDF de tarif.' };
        }

        const mainUrlFr = uploadedUrlsFr[0];
        const mainUrlEn = uploadedUrlsEn.length > 0 ? uploadedUrlsEn[0] : null;
        const file_type = isPdf ? 'pdf' : 'image';

        const db = getDb();
        const maxRow = await db.prepare('SELECT MAX(display_order) as maxOrder FROM pricing_documents').get();
        const nextOrder = (maxRow?.maxOrder || 0) + 1;

        const result = await db.prepare(`
            INSERT INTO pricing_documents (title, title_en, description, description_en, file_url, file_url_en, file_type, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(title, title_en, description, description_en, mainUrlFr, mainUrlEn, file_type, nextOrder);
        const docId = result.lastInsertRowid;

        // Si c'est une collection d'images, remplit la sous-table pricing_document_images
        if (!isPdf) {
            const stmt = db.prepare("INSERT INTO pricing_document_images (doc_id, image_url, display_order, lang) VALUES (?, ?, ?, ?)");
            for (let i = 0; i < uploadedUrlsFr.length; i++) {
                await stmt.run(docId, uploadedUrlsFr[i], i + 1, 'fr');
            }
            for (let i = 0; i < uploadedUrlsEn.length; i++) {
                await stmt.run(docId, uploadedUrlsEn[i], i + 1, 'en');
            }
        }

        revalidatePath('/tarifs');
        revalidatePath('/admin/dashboard/tarifs');
        revalidatePath('/admin/dashboard/prestations');

        await logActivity({
            action: 'add',
            category: 'Tarifs & Cartes',
            summary: `Ajout d'une carte/tarif : "${title}" (${file_type === 'pdf' ? 'PDF' : 'Images'})`,
            details: { title, file_type }
        });

        return { success: true };
    } catch (err) {
        console.error('[addPricingDocument Error]:', err);
        return { error: err.message || 'Une erreur est survenue lors de l\'enregistrement du tarif.' };
    }
}

export async function editPricingDocument(formData) {
    try {
        await requireAdminAuth();
        const id = extractId(formData);
        if (!id) return { error: 'ID manquant' };

        const title = (formData.get('title') || '').toString().trim();
        const title_en = (formData.get('title_en') || '').toString().trim();
        const description = (formData.get('description') || '').toString().trim();
        const description_en = (formData.get('description_en') || '').toString().trim();

        if (!title) {
            return { error: 'Veuillez saisir un titre pour le tarif.' };
        }

        const db = getDb();
        const existing = await db.prepare('SELECT * FROM pricing_documents WHERE id = ?').get(id);
        if (!existing) return { error: 'Document introuvable' };

        const files_fr = formData.getAll('image_files_fr').length > 0 ? formData.getAll('image_files_fr') : formData.getAll('image_files');
        const files_en = formData.getAll('image_files_en');
        const singlePdfFr = formData.get('file_fr');
        const singlePdfEn = formData.get('file_en');

        let mainFileUrl = existing.file_url;
        let mainFileUrlEn = existing.file_url_en;

        const isPdf = existing.file_type === 'pdf' || (singlePdfFr && singlePdfFr.size > 0 && singlePdfFr.name?.toLowerCase().endsWith('.pdf'));

        if (isPdf) {
            if (singlePdfFr && singlePdfFr.size > 0) {
                mainFileUrl = await saveUploadedFile(singlePdfFr);
            }
            if (singlePdfEn && singlePdfEn.size > 0) {
                mainFileUrlEn = await saveUploadedFile(singlePdfEn);
            }
        } else {
            // Migre les anciennes images uniques vers pricing_document_images si la sous-table est vide, avant d'ajouter les nouvelles
            const existingFrCount = (await db.prepare("SELECT COUNT(*) as count FROM pricing_document_images WHERE doc_id = ? AND (lang = 'fr' OR lang IS NULL)").get(id))?.count || 0;
            if (existingFrCount === 0 && existing.file_url && existing.file_type !== 'pdf') {
                await db.prepare("INSERT INTO pricing_document_images (doc_id, image_url, display_order, lang) VALUES (?, ?, 1, 'fr')").run(id, existing.file_url);
            }

            const existingEnCount = (await db.prepare("SELECT COUNT(*) as count FROM pricing_document_images WHERE doc_id = ? AND lang = 'en'").get(id))?.count || 0;
            if (existingEnCount === 0 && existing.file_url_en && existing.file_type !== 'pdf') {
                await db.prepare("INSERT INTO pricing_document_images (doc_id, image_url, display_order, lang) VALUES (?, ?, 1, 'en')").run(id, existing.file_url_en);
            }

            // Envoie les nouvelles images FR
            const newFrUrls = [];
            for (const f of files_fr) {
                if (f && f.size > 0) {
                    const u = await saveUploadedFile(f);
                    if (u) newFrUrls.push(u);
                }
            }
            if (newFrUrls.length > 0) {
                const maxOrderRow = await db.prepare("SELECT MAX(display_order) as max_order FROM pricing_document_images WHERE doc_id = ? AND (lang = 'fr' OR lang IS NULL)").get(id);
                let startOrder = (maxOrderRow?.max_order || 0) + 1;
                const stmt = db.prepare("INSERT INTO pricing_document_images (doc_id, image_url, display_order, lang) VALUES (?, ?, ?, 'fr')");
                for (const url of newFrUrls) {
                    await stmt.run(id, url, startOrder++);
                }
            }

            // Envoie les nouvelles images EN
            const newEnUrls = [];
            for (const f of files_en) {
                if (f && f.size > 0) {
                    const u = await saveUploadedFile(f);
                    if (u) newEnUrls.push(u);
                }
            }
            if (newEnUrls.length > 0) {
                const maxOrderRow = await db.prepare("SELECT MAX(display_order) as max_order FROM pricing_document_images WHERE doc_id = ? AND lang = 'en'").get(id);
                let startOrder = (maxOrderRow?.max_order || 0) + 1;
                const stmt = db.prepare("INSERT INTO pricing_document_images (doc_id, image_url, display_order, lang) VALUES (?, ?, ?, 'en')");
                for (const url of newEnUrls) {
                    await stmt.run(id, url, startOrder++);
                }
            }

            // Synchronise les URL principales avec la première image de chaque langue
            const firstFr = await db.prepare("SELECT image_url FROM pricing_document_images WHERE doc_id = ? AND (lang = 'fr' OR lang IS NULL) ORDER BY display_order ASC, id ASC LIMIT 1").get(id);
            const firstEn = await db.prepare("SELECT image_url FROM pricing_document_images WHERE doc_id = ? AND lang = 'en' ORDER BY display_order ASC, id ASC LIMIT 1").get(id);

            if (firstFr) mainFileUrl = firstFr.image_url;
            if (firstEn) mainFileUrlEn = firstEn.image_url;
        }

        await db.prepare(`
            UPDATE pricing_documents
            SET title = ?, title_en = ?, description = ?, description_en = ?, file_url = ?, file_url_en = ?
            WHERE id = ?
        `).run(title, title_en, description, description_en, mainFileUrl, mainFileUrlEn, id);

        await logActivity({
            action: 'update',
            category: 'Tarifs & Cartes',
            summary: `Modification d'une carte/tarif : "${title}" (ID #${id})`,
            details: { id, title }
        });

        revalidatePath('/tarifs');
        revalidatePath('/admin/dashboard/tarifs');
        revalidatePath('/admin/dashboard/prestations');
        return { success: true };
    } catch (err) {
        console.error('[editPricingDocument Error]:', err);
        return { error: err.message || 'Une erreur est survenue lors de la modification du tarif.' };
    }
}

export async function deletePricingDocument(idOrFormData) {
    try {
        await requireAdminAuth();
        const id = extractId(idOrFormData);
        if (!id) return { error: 'ID invalide' };

        const db = getDb();
        const doc = await db.prepare('SELECT title FROM pricing_documents WHERE id = ?').get(id);
        try {
            const subImages = await db.prepare('SELECT image_url FROM pricing_document_images WHERE doc_id = ?').all(id);
            subImages.forEach(img => deleteLocalFileIfPresent(img.image_url));
            await db.prepare('DELETE FROM pricing_document_images WHERE doc_id = ?').run(id);
        } catch {}

        await db.prepare('DELETE FROM pricing_documents WHERE id = ?').run(id);

        await logActivity({
            action: 'delete',
            category: 'Tarifs & Cartes',
            summary: `Suppression de la carte/tarif : "${doc?.title || 'Sans titre'}" (ID #${id})`,
            details: { id, title: doc?.title }
        });

        revalidatePath('/tarifs');
        revalidatePath('/admin/dashboard/tarifs');
        revalidatePath('/admin/dashboard/prestations');
        return { success: true };
    } catch (err) {
        console.error('[deletePricingDocument Error]:', err);
        return { error: err.message || 'Une erreur est survenue lors de la suppression.' };
    }
}

export async function reorderPricingDocument(id, direction) {
    try {
        await requireAdminAuth();
        const db = getDb();
        const docs = await db.prepare('SELECT id, display_order FROM pricing_documents ORDER BY display_order ASC, id ASC').all();
        const index = docs.findIndex(d => d.id === id);
        if (index === -1) return { error: 'Document introuvable' };

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= docs.length) return { success: true };

        const [moved] = docs.splice(index, 1);
        docs.splice(targetIndex, 0, moved);

        const stmt = db.prepare('UPDATE pricing_documents SET display_order = ? WHERE id = ?');
        for (let i = 0; i < docs.length; i++) {
            await stmt.run(i + 1, docs[i].id);
        }

        revalidatePath('/tarifs');
        revalidatePath('/admin/dashboard/tarifs');
        revalidatePath('/admin/dashboard/prestations');
        return { success: true };
    } catch (err) {
        console.error('[reorderPricingDocument Error]:', err);
        return { error: err.message || 'Une erreur est survenue.' };
    }
}

export async function deletePricingDocumentImage(imageId) {
    try {
        await requireAdminAuth();
        const db = getDb();

        // Gère l'identifiant historique virtuel s'il est fourni
        if (typeof imageId === 'string' && imageId.startsWith('legacy-')) {
            const parts = imageId.split('-');
            const docId = parseInt(parts[1], 10);
            const lang = parts[2];
            if (docId) {
                if (lang === 'en') {
                    await db.prepare('UPDATE pricing_documents SET file_url_en = NULL WHERE id = ?').run(docId);
                } else {
                    await db.prepare('UPDATE pricing_documents SET file_url = NULL WHERE id = ?').run(docId);
                }
                revalidatePath('/tarifs');
                revalidatePath('/admin/dashboard/tarifs');
                revalidatePath('/admin/dashboard/prestations');
                return { success: true };
            }
        }

        const img = await db.prepare('SELECT * FROM pricing_document_images WHERE id = ?').get(imageId);
        if (!img) return { error: 'Image non trouvée' };

        deleteLocalFileIfPresent(img.image_url);
        await db.prepare('DELETE FROM pricing_document_images WHERE id = ?').run(imageId);

        const isEn = img.lang === 'en';
        const remaining = isEn
            ? await db.prepare("SELECT id, image_url FROM pricing_document_images WHERE doc_id = ? AND lang = 'en' ORDER BY display_order ASC, id ASC").all(img.doc_id)
            : await db.prepare("SELECT id, image_url FROM pricing_document_images WHERE doc_id = ? AND (lang = 'fr' OR lang IS NULL) ORDER BY display_order ASC, id ASC").all(img.doc_id);

        const stmt = db.prepare('UPDATE pricing_document_images SET display_order = ? WHERE id = ?');
        for (let i = 0; i < remaining.length; i++) {
            await stmt.run(i + 1, remaining[i].id);
        }

        if (isEn) {
            const nextUrlEn = remaining.length > 0 ? remaining[0].image_url : null;
            await db.prepare('UPDATE pricing_documents SET file_url_en = ? WHERE id = ?').run(nextUrlEn, img.doc_id);
        } else {
            const nextUrl = remaining.length > 0 ? remaining[0].image_url : null;
            await db.prepare('UPDATE pricing_documents SET file_url = ? WHERE id = ?').run(nextUrl, img.doc_id);
        }

        revalidatePath('/tarifs');
        revalidatePath('/admin/dashboard/tarifs');
        revalidatePath('/admin/dashboard/prestations');
        return { success: true };
    } catch (err) {
        console.error('[deletePricingDocumentImage Error]:', err);
        return { error: err.message || 'Une erreur est survenue lors de la suppression de l\'image.' };
    }
}

export async function deletePricingDocumentImages(imageIds) {
    try {
        await requireAdminAuth();
        if (!Array.isArray(imageIds) || imageIds.length === 0) return { error: 'Aucune image sélectionnée.' };
        const db = getDb();

        const affectedDocIds = new Set();
        for (const imgId of imageIds) {
            if (typeof imgId === 'string' && imgId.startsWith('legacy-')) {
                const parts = imgId.split('-');
                const docId = parseInt(parts[1], 10);
                const lang = parts[2];
                if (docId) {
                    affectedDocIds.add(docId);
                    if (lang === 'en') {
                        await db.prepare('UPDATE pricing_documents SET file_url_en = NULL WHERE id = ?').run(docId);
                    } else {
                        await db.prepare('UPDATE pricing_documents SET file_url = NULL WHERE id = ?').run(docId);
                    }
                }
                continue;
            }

            const img = await db.prepare('SELECT * FROM pricing_document_images WHERE id = ?').get(imgId);
            if (img) {
                affectedDocIds.add(img.doc_id);
                deleteLocalFileIfPresent(img.image_url);
                await db.prepare('DELETE FROM pricing_document_images WHERE id = ?').run(imgId);
            }
        }

        for (const docId of affectedDocIds) {
            // Réordonne et synchronise la version FR
            const remainingFr = await db.prepare("SELECT id, image_url FROM pricing_document_images WHERE doc_id = ? AND (lang = 'fr' OR lang IS NULL) ORDER BY display_order ASC, id ASC").all(docId);
            const stmtFr = db.prepare('UPDATE pricing_document_images SET display_order = ? WHERE id = ?');
            for (let i = 0; i < remainingFr.length; i++) {
                await stmtFr.run(i + 1, remainingFr[i].id);
            }
            const nextUrlFr = remainingFr.length > 0 ? remainingFr[0].image_url : null;
            await db.prepare('UPDATE pricing_documents SET file_url = ? WHERE id = ?').run(nextUrlFr, docId);

            // Réordonne et synchronise la version EN
            const remainingEn = await db.prepare("SELECT id, image_url FROM pricing_document_images WHERE doc_id = ? AND lang = 'en' ORDER BY display_order ASC, id ASC").all(docId);
            const stmtEn = db.prepare('UPDATE pricing_document_images SET display_order = ? WHERE id = ?');
            for (let i = 0; i < remainingEn.length; i++) {
                await stmtEn.run(i + 1, remainingEn[i].id);
            }
            const nextUrlEn = remainingEn.length > 0 ? remainingEn[0].image_url : null;
            await db.prepare('UPDATE pricing_documents SET file_url_en = ? WHERE id = ?').run(nextUrlEn, docId);
        }

        revalidatePath('/tarifs');
        revalidatePath('/admin/dashboard/tarifs');
        revalidatePath('/admin/dashboard/prestations');
        return { success: true };
    } catch (err) {
        console.error('[deletePricingDocumentImages Error]:', err);
        return { error: err.message || 'Une erreur est survenue lors de la suppression des images.' };
    }
}

export async function reorderPricingDocumentImage(imageId, direction) {
    try {
        await requireAdminAuth();
        const db = getDb();
        const img = await db.prepare('SELECT * FROM pricing_document_images WHERE id = ?').get(imageId);
        if (!img) return { error: 'Image non trouvée' };

        const isEn = img.lang === 'en';
        const images = isEn
            ? await db.prepare("SELECT id, display_order FROM pricing_document_images WHERE doc_id = ? AND lang = 'en' ORDER BY display_order ASC, id ASC").all(img.doc_id)
            : await db.prepare("SELECT id, display_order FROM pricing_document_images WHERE doc_id = ? AND (lang = 'fr' OR lang IS NULL) ORDER BY display_order ASC, id ASC").all(img.doc_id);

        const index = images.findIndex(i => i.id === imageId);
        if (index === -1) return { error: 'Image non trouvée' };

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= images.length) return { success: true };

        const [moved] = images.splice(index, 1);
        images.splice(targetIndex, 0, moved);

        const stmt = db.prepare('UPDATE pricing_document_images SET display_order = ? WHERE id = ?');
        for (let i = 0; i < images.length; i++) {
            await stmt.run(i + 1, images[i].id);
        }

        const updatedImages = isEn
            ? await db.prepare("SELECT image_url FROM pricing_document_images WHERE doc_id = ? AND lang = 'en' ORDER BY display_order ASC, id ASC").all(img.doc_id)
            : await db.prepare("SELECT image_url FROM pricing_document_images WHERE doc_id = ? AND (lang = 'fr' OR lang IS NULL) ORDER BY display_order ASC, id ASC").all(img.doc_id);

        if (isEn) {
            if (updatedImages.length > 0) {
                await db.prepare('UPDATE pricing_documents SET file_url_en = ? WHERE id = ?').run(updatedImages[0].image_url, img.doc_id);
            }
        } else {
            if (updatedImages.length > 0) {
                await db.prepare('UPDATE pricing_documents SET file_url = ? WHERE id = ?').run(updatedImages[0].image_url, img.doc_id);
            }
        }

        revalidatePath('/tarifs');
        revalidatePath('/admin/dashboard/tarifs');
        revalidatePath('/admin/dashboard/prestations');
        return { success: true };
    } catch (err) {
        console.error('[reorderPricingDocumentImage Error]:', err);
        return { error: err.message || 'Une erreur est survenue lors de la réorganisation.' };
    }
}

export async function replacePricingDocumentImage(imageId, formData) {
    try {
        await requireAdminAuth();
        const file = formData.get('image_file');
        if (!file || file.size === 0) return { error: 'Aucun fichier reçu' };
        const db = getDb();

        // Gère l'ancien format d'identifiant 'legacy-${docId}-${lang}'
        if (typeof imageId === 'string' && imageId.startsWith('legacy-')) {
            const parts = imageId.split('-');
            const docId = parseInt(parts[1], 10);
            const lang = parts[2];
            if (docId) {
                const newUrl = await saveUploadedFile(file);
                if (!newUrl) return { error: 'Échec de l’enregistrement' };
                const doc = await db.prepare('SELECT file_url, file_url_en FROM pricing_documents WHERE id = ?').get(docId);
                if (lang === 'en') {
                    if (doc?.file_url_en) deleteLocalFileIfPresent(doc.file_url_en);
                    await db.prepare('UPDATE pricing_documents SET file_url_en = ? WHERE id = ?').run(newUrl, docId);
                } else {
                    if (doc?.file_url) deleteLocalFileIfPresent(doc.file_url);
                    await db.prepare('UPDATE pricing_documents SET file_url = ? WHERE id = ?').run(newUrl, docId);
                }
                revalidatePath('/tarifs');
                revalidatePath('/admin/dashboard/tarifs');
                revalidatePath('/admin/dashboard/prestations');
                return { success: true, image_url: newUrl };
            }
        }

        const img = await db.prepare('SELECT * FROM pricing_document_images WHERE id = ?').get(imageId);
        if (!img) return { error: 'Image non trouvée' };

        const newUrl = await saveUploadedFile(file);
        if (!newUrl) return { error: 'Échec de l’enregistrement du fichier' };

        deleteLocalFileIfPresent(img.image_url);
        await db.prepare('UPDATE pricing_document_images SET image_url = ? WHERE id = ?').run(newUrl, imageId);

        const isEn = img.lang === 'en';
        const first = isEn
            ? await db.prepare("SELECT id FROM pricing_document_images WHERE doc_id = ? AND lang = 'en' ORDER BY display_order ASC, id ASC LIMIT 1").get(img.doc_id)
            : await db.prepare("SELECT id FROM pricing_document_images WHERE doc_id = ? AND (lang = 'fr' OR lang IS NULL) ORDER BY display_order ASC, id ASC LIMIT 1").get(img.doc_id);

        if (first?.id === imageId) {
            if (isEn) {
                await db.prepare('UPDATE pricing_documents SET file_url_en = ? WHERE id = ?').run(newUrl, img.doc_id);
            } else {
                await db.prepare('UPDATE pricing_documents SET file_url = ? WHERE id = ?').run(newUrl, img.doc_id);
            }
        }

        revalidatePath('/tarifs');
        revalidatePath('/admin/dashboard/tarifs');
        revalidatePath('/admin/dashboard/prestations');
        return { success: true, image_url: newUrl };
    } catch (err) {
        console.error('[replacePricingDocumentImage Error]:', err);
        return { error: err.message || 'Erreur lors du recadrage de l’image.' };
    }
}

// --- PRIX DES REPAS FIXES ---
export async function addFixedPrice(formData) {
    await requireAdminAuth();
    const name = (formData.get('name') || '').toString().trim();
    const name_en = (formData.get('name_en') || '').toString().trim();
    const price = (formData.get('price') || '').toString().trim();
    const price_en = (formData.get('price_en') || '').toString().trim();
    const details = (formData.get('details') || '').toString().trim();
    const details_en = (formData.get('details_en') || '').toString().trim();
    const badge = (formData.get('badge') || '').toString().trim();
    const badge_en = (formData.get('badge_en') || '').toString().trim();
    const category = (formData.get('category') || 'Repas').toString().trim();
    const category_en = (formData.get('category_en') || 'Meals').toString().trim();

    if (!name || !price) {
        return { error: 'Veuillez saisir le nom de la formule et son prix.' };
    }

    const db = getDb();
    const maxRow = await db.prepare('SELECT MAX(display_order) as maxOrder FROM fixed_prices').get();
    const nextOrder = (maxRow?.maxOrder || 0) + 1;

    await db.prepare(`
        INSERT INTO fixed_prices (name, name_en, price, price_en, details, details_en, badge, badge_en, category, category_en, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, name_en, price, price_en || price, details, details_en, badge, badge_en, category, category_en, nextOrder);

    await logActivity({
        action: 'add',
        category: 'Tarifs Repas',
        summary: `Ajout du tarif repas : "${name}" (${price})`,
        details: { name, price, category }
    });

    revalidatePath('/tarifs');
    revalidatePath('/admin/dashboard/prestations');
    return { success: true };
}

export async function editFixedPrice(formData) {
    await requireAdminAuth();
    const id = extractId(formData);
    if (!id) return { error: 'ID manquant' };

    const name = (formData.get('name') || '').toString().trim();
    const name_en = (formData.get('name_en') || '').toString().trim();
    const price = (formData.get('price') || '').toString().trim();
    const price_en = (formData.get('price_en') || '').toString().trim();
    const details = (formData.get('details') || '').toString().trim();
    const details_en = (formData.get('details_en') || '').toString().trim();
    const badge = (formData.get('badge') || '').toString().trim();
    const badge_en = (formData.get('badge_en') || '').toString().trim();
    const category = (formData.get('category') || 'Repas').toString().trim();
    const category_en = (formData.get('category_en') || 'Meals').toString().trim();

    if (!name || !price) {
        return { error: 'Veuillez saisir le nom de la formule et son prix.' };
    }

    const db = getDb();
    await db.prepare(`
        UPDATE fixed_prices
        SET name = ?, name_en = ?, price = ?, price_en = ?, details = ?, details_en = ?, badge = ?, badge_en = ?, category = ?, category_en = ?
        WHERE id = ?
    `).run(name, name_en, price, price_en || price, details, details_en, badge, badge_en, category, category_en, id);

    await logActivity({
        action: 'update',
        category: 'Tarifs Repas',
        summary: `Modification du tarif repas : "${name}" (ID #${id})`,
        details: { id, name, price }
    });

    revalidatePath('/tarifs');
    revalidatePath('/admin/dashboard/prestations');
    return { success: true };
}

export async function deleteFixedPrice(idOrFormData) {
    await requireAdminAuth();
    const id = extractId(idOrFormData);
    if (!id) return { error: 'ID invalide' };

    const db = getDb();
    const priceRow = await db.prepare('SELECT name FROM fixed_prices WHERE id = ?').get(id);
    await db.prepare('DELETE FROM fixed_prices WHERE id = ?').run(id);

    await logActivity({
        action: 'delete',
        category: 'Tarifs Repas',
        summary: `Suppression du tarif repas : "${priceRow?.name || 'Sans nom'}" (ID #${id})`,
        details: { id, name: priceRow?.name }
    });

    revalidatePath('/tarifs');
    revalidatePath('/admin/dashboard/prestations');
    return { success: true };
}

export async function reorderFixedPrice(id, direction) {
    await requireAdminAuth();
    const db = getDb();
    const prices = await db.prepare('SELECT id, display_order FROM fixed_prices ORDER BY display_order ASC, id ASC').all();
    const index = prices.findIndex(p => p.id === id);
    if (index === -1) return { error: 'Tarif introuvable' };

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= prices.length) return { success: true };

    const [moved] = prices.splice(index, 1);
    prices.splice(targetIndex, 0, moved);

    const stmt = db.prepare('UPDATE fixed_prices SET display_order = ? WHERE id = ?');
    for (let i = 0; i < prices.length; i++) {
        await stmt.run(i + 1, prices[i].id);
    }

    revalidatePath('/tarifs');
    revalidatePath('/admin/dashboard/prestations');
    return { success: true };
}

// --- SAUVEGARDE ET RESTAURATION DE LA BASE ---
export async function restoreDatabaseFromBackup(formData) {
    await requireAdminAuth();
    const backupFile = formData.get('backup_file');
    if (!backupFile || backupFile.size === 0) {
        return { error: 'Veuillez sélectionner un fichier de sauvegarde JSON.' };
    }

    try {
        const text = await backupFile.text();
        const backup = JSON.parse(text);

        if (!backup.data) {
            return { error: 'Fichier de sauvegarde invalide.' };
        }

        const db = getDb();

        if (Array.isArray(backup.data.site_info) && backup.data.site_info.length > 0) {
            for (const item of backup.data.site_info) {
                await db.prepare(`
                    INSERT INTO site_info (key, value) VALUES (?, ?)
                    ON CONFLICT(key) DO UPDATE SET value = excluded.value
                `).run(item.key, item.value);
            }
        }

        if (Array.isArray(backup.data.services) && backup.data.services.length > 0) {
            await db.prepare('DELETE FROM services').run();
            for (const s of backup.data.services) {
                await db.prepare('INSERT INTO services (id, num, title, title_en, description, description_en, badge, badge_en, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
                    s.id, s.num, s.title, s.title_en || '', s.description, s.description_en || '', s.badge || '', s.badge_en || '', s.display_order
                );
            }
        }

        if (Array.isArray(backup.data.weekly_menus) && backup.data.weekly_menus.length > 0) {
            await db.prepare('DELETE FROM weekly_menu_images').run();
            await db.prepare('DELETE FROM weekly_menus').run();
            for (const m of backup.data.weekly_menus) {
                await db.prepare('INSERT INTO weekly_menus (id, title, title_en, description, description_en, image_url, embed_url, is_current) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
                    m.id, m.title, m.title_en || '', m.description, m.description_en || '', m.image_url, m.embed_url || '', m.is_current ? 1 : 0
                );
            }
            if (Array.isArray(backup.data.weekly_menu_images)) {
                for (const img of backup.data.weekly_menu_images) {
                    await db.prepare('INSERT INTO weekly_menu_images (id, menu_id, image_url, display_order) VALUES (?, ?, ?, ?)').run(
                        img.id, img.menu_id, img.image_url, img.display_order
                    );
                }
            }
        }

        if (Array.isArray(backup.data.gallery_posts) && backup.data.gallery_posts.length > 0) {
            await db.prepare('DELETE FROM gallery_posts').run();
            for (const post of backup.data.gallery_posts) {
                await db.prepare('INSERT INTO gallery_posts (id, title, title_en, caption, caption_en, image_url, media_type, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
                    post.id, post.title, post.title_en || '', post.caption, post.caption_en || '', post.image_url, post.media_type || 'image', post.display_order
                );
            }
        }

        if (Array.isArray(backup.data.carousel_images) && backup.data.carousel_images.length > 0) {
            await db.prepare('DELETE FROM carousel_images').run();
            for (const c of backup.data.carousel_images) {
                await db.prepare('INSERT INTO carousel_images (id, title, title_en, subtitle, subtitle_en, image_url, mobile_image_url, fit_mode, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
                    c.id, c.title, c.title_en || '', c.subtitle, c.subtitle_en || '', c.image_url, c.mobile_image_url || null, c.fit_mode || 'cover', c.display_order
                );
            }
        }

        if (Array.isArray(backup.data.media_storage) && backup.data.media_storage.length > 0) {
            for (const m of backup.data.media_storage) {
                try {
                    await db.prepare('INSERT OR REPLACE INTO media_storage (id, mime_type, data) VALUES (?, ?, ?)').run(
                        m.id, m.mime_type, m.data
                    );
                } catch {}
            }
        }

        await logActivity({
            action: 'restore',
            category: 'Administration',
            summary: "Restauration complète de la base de données depuis une sauvegarde",
            details: { fileName: backupFile.name, size: backupFile.size }
        });

        revalidatePath('/', 'layout');
        revalidatePath('/');
        revalidatePath('/a-propos');
        revalidatePath('/contact');
        revalidatePath('/admin/dashboard');
        revalidatePath('/admin/dashboard/settings');
        revalidatePath('/admin/dashboard/prestations');
        revalidatePath('/admin/dashboard/menu-semaine');
        revalidatePath('/admin/dashboard/galerie');
        revalidatePath('/admin/dashboard/carousel');

        return { success: true };
    } catch (err) {
        console.error('Failed to restore backup:', err);
        return { error: 'Erreur lors de la restauration: ' + err.message };
    }
}


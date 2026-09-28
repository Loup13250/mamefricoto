'use server';

import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { sendContactNotification } from '@/lib/email';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

// --- AUTHENTICATION HELPER ---
async function verifyAdminAuth() {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value;
    return session === 'authenticated';
}

async function requireAdminAuth() {
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

// --- AUTH ACTIONS ---
export async function adminLogin(formData) {
    const username = (formData.get('username') || '').toString().trim();
    const password = (formData.get('password') || '').toString().trim();

    const db = getDb();
    const user = await db.prepare('SELECT * FROM admin_users WHERE username = ? AND password = ?').get(username, password);

    if (user) {
        const cookieStore = await cookies();
        cookieStore.set('admin_session', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });
        redirect('/admin/dashboard');
    } else {
        return { error: 'Identifiants incorrects' };
    }
}

export async function adminLogout() {
    const cookieStore = await cookies();
    cookieStore.delete('admin_session');
    redirect('/admin');
}

// --- SECURE FILE UPLOAD HELPER ---
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.mov', '.svg', '.jfif', '.heic', '.heif', '.avif', '.bmp', '.pdf']);

async function saveUploadedFile(file) {
    if (!file || typeof file === 'string' || !file.name || file.size === 0) return null;

    const isVercel = Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production');
    const maxSize = isVercel ? 4.5 * 1024 * 1024 : 50 * 1024 * 1024;

    if (file.size > maxSize) {
        throw new Error("Le fichier sélectionné est trop volumineux (max 4.5 Mo). Veuillez choisir un fichier plus léger.");
    }

    let ext = path.extname(file.name || '').toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
        if (file.type && file.type.startsWith('image/')) {
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
            '.svg': 'image/svg+xml',
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.mov': 'video/quicktime',
            '.pdf': 'application/pdf',
        };
        const mimeType = file.type || mimeTypes[ext] || (ext === '.pdf' ? 'application/pdf' : 'image/jpeg');

        // Stockage ultra-performant dans media_storage pour éviter de gonfler le payload HTML avec de gros Data URIs
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

// --- SITE INFO & SETTINGS ---
export async function updateSiteInfo(formData) {
    await requireAdminAuth();
    const db = getDb();

    const fields = [
        'contact_email', 'phone', 'address', 'address_en', 'hours', 'hours_en',
        'instagram', 'facebook', 'google_reviews', 'about_text', 'about_text_en',
        'tagline', 'tagline_en', 'site_icon', 'formspree_url'
    ];

    const stmt = db.prepare(`
        INSERT INTO site_info (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    for (const field of fields) {
        const val = formData.get(field);
        if (val !== null && val !== undefined) {
            await stmt.run(field, val.toString().trim());
        }
    }

    const logoFile = formData.get('logo_file') || formData.get('site_icon_file');
    const aboutFile = formData.get('about_file');

    if (logoFile && logoFile.size > 0) {
        const logoUrl = await saveUploadedFile(logoFile);
        if (logoUrl) {
            await stmt.run('logo', logoUrl);
            await stmt.run('site_icon', logoUrl);
        }
    }

    if (aboutFile && aboutFile.size > 0) {
        const aboutUrl = await saveUploadedFile(aboutFile);
        if (aboutUrl) await stmt.run('about_image', aboutUrl);
    }

    revalidatePath('/');
    revalidatePath('/contact');
    revalidatePath('/a-propos');
    revalidatePath('/realisations');
    revalidatePath('/admin/dashboard/settings');
    return { success: true };
}

// --- WEEKLY MENU ---
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

        if (is_current) {
            await db.prepare('UPDATE weekly_menus SET is_current = 0').run();
        }

        // Insert new FR images if uploaded
        if (uploadedUrlsFr.length > 0) {
            const highestOrderRow = await db.prepare('SELECT MAX(display_order) as max_order FROM weekly_menu_images WHERE menu_id = ? AND (lang = "fr" OR lang IS NULL)').get(id);
            let startOrder = (highestOrderRow?.max_order || 0) + 1;
            const stmt = db.prepare('INSERT INTO weekly_menu_images (menu_id, image_url, display_order, lang) VALUES (?, ?, ?, "fr")');
            for (const url of uploadedUrlsFr) {
                await stmt.run(id, url, startOrder++);
            }
        }

        // Insert new EN images if uploaded
        if (uploadedUrlsEn.length > 0) {
            const highestOrderRow = await db.prepare('SELECT MAX(display_order) as max_order FROM weekly_menu_images WHERE menu_id = ? AND lang = "en"').get(id);
            let startOrder = (highestOrderRow?.max_order || 0) + 1;
            const stmt = db.prepare('INSERT INTO weekly_menu_images (menu_id, image_url, display_order, lang) VALUES (?, ?, ?, "en")');
            for (const url of uploadedUrlsEn) {
                await stmt.run(id, url, startOrder++);
            }
        }

        // Sync main image URLs with first image of each language
        const firstFr = await db.prepare('SELECT image_url FROM weekly_menu_images WHERE menu_id = ? AND (lang = "fr" OR lang IS NULL) ORDER BY display_order ASC LIMIT 1').get(id);
        const firstEn = await db.prepare('SELECT image_url FROM weekly_menu_images WHERE menu_id = ? AND lang = "en" ORDER BY display_order ASC LIMIT 1').get(id);

        const mainImageUrl = firstFr?.image_url || null;
        const mainImageUrlEn = firstEn?.image_url || null;

        await db.prepare('UPDATE weekly_menus SET title=?, title_en=?, description=?, description_en=?, image_url=?, image_url_en=?, is_current=? WHERE id=?').run(
            title, title_en, description, description_en, mainImageUrl, mainImageUrlEn, is_current, id
        );

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
        const images = await db.prepare('SELECT image_url FROM weekly_menu_images WHERE menu_id = ?').all(id);
        images.forEach(img => deleteLocalFileIfPresent(img.image_url));

        await db.prepare('DELETE FROM weekly_menu_images WHERE menu_id = ?').run(id);
        await db.prepare('DELETE FROM weekly_menus WHERE id = ?').run(id);

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
        await db.prepare('UPDATE weekly_menus SET is_current = 0').run();
        await db.prepare('UPDATE weekly_menus SET is_current = 1 WHERE id = ?').run(id);
        revalidatePath('/');
        revalidatePath('/admin/dashboard/menu-semaine');
        return { success: true };
    } catch (err) {
        console.error('[toggleWeeklyMenuCurrent Error]:', err);
        return { error: err.message || 'Une erreur est survenue.' };
    }
}

// --- HERO CAROUSEL ---
export async function addCarouselImage(formData) {
    try {
        await requireAdminAuth();
        const title = (formData.get('title') || '').toString().trim();
        const title_en = (formData.get('title_en') || '').toString().trim();
        const subtitle = (formData.get('subtitle') || '').toString().trim();
        const subtitle_en = (formData.get('subtitle_en') || '').toString().trim();
        const display_order = parseInt(formData.get('display_order') || '0', 10);
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
        await db.prepare('INSERT INTO carousel_images (image_url, mobile_image_url, title, title_en, subtitle, subtitle_en, fit_mode, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(image_url, mobile_image_url || null, title, title_en, subtitle, subtitle_en, fit_mode, display_order);

        revalidatePath('/');
        revalidatePath('/admin/dashboard/carousel');
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
        const img = await db.prepare('SELECT image_url, mobile_image_url FROM carousel_images WHERE id = ?').get(id);
        if (img) {
            deleteLocalFileIfPresent(img.image_url);
            deleteLocalFileIfPresent(img.mobile_image_url);
        }

        await db.prepare('DELETE FROM carousel_images WHERE id = ?').run(id);
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
        const display_order = parseInt(formData.get('display_order') || '1', 10);
        const fit_mode = (formData.get('fit_mode') || 'cover').toString().trim();
        const file = formData.get('image_file');
        const mobileFile = formData.get('mobile_image_file');
        const removeMobile = formData.get('remove_mobile_image') === '1';

        let image_url = (formData.get('image_url') || '').toString().trim();
        let mobile_image_url = (formData.get('mobile_image_url') || '').toString().trim();

        const db = getDb();
        const existing = await db.prepare('SELECT image_url, mobile_image_url, fit_mode FROM carousel_images WHERE id = ?').get(id);
        if (!existing) return { error: 'Photo du carrousel introuvable' };

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

        revalidatePath('/');
        revalidatePath('/admin/dashboard/carousel');
        return { success: true };
    } catch (err) {
        console.error('editCarouselImage error:', err);
        return { error: err.message || 'Erreur lors de la modification de la bannière.' };
    }
}

// --- GALLERY ---
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
        if (file && file.size > 0) {
            if (file.type && file.type.startsWith('video/')) {
                media_type = 'video';
            }
            const uploaded = await saveUploadedFile(file);
            if (uploaded) image_url = uploaded;
        }

        if (!image_url) {
            return { error: 'Veuillez sélectionner un fichier ou coller une URL' };
        }

        const db = getDb();
        await db.prepare('UPDATE gallery_posts SET display_order = display_order + 1').run();
        await db.prepare('INSERT INTO gallery_posts (title, title_en, caption, caption_en, image_url, media_type, display_order) VALUES (?, ?, ?, ?, ?, ?, 1)').run(
            title, title_en, caption, caption_en, image_url, media_type
        );

        // Nettoyage automatique : limiter la galerie aux 30 plus récentes
        const allPosts = await db.prepare('SELECT id, image_url FROM gallery_posts ORDER BY created_at DESC').all();
        if (allPosts.length > 30) {
            const postsToDelete = allPosts.slice(30);
            for (const oldPost of postsToDelete) {
                deleteLocalFileIfPresent(oldPost.image_url);
                await db.prepare('DELETE FROM gallery_posts WHERE id = ?').run(oldPost.id);
            }
        }

        revalidatePath('/');
        revalidatePath('/realisations');
        revalidatePath('/galerie');
        revalidatePath('/admin/dashboard/galerie');
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
        await db.prepare('UPDATE gallery_posts SET title = ?, title_en = ?, caption = ?, caption_en = ? WHERE id = ?').run(
            title, title_en, caption, caption_en, id
        );

        revalidatePath('/');
        revalidatePath('/realisations');
        revalidatePath('/galerie');
        revalidatePath('/admin/dashboard/galerie');
        return { success: true };
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
    const post = await db.prepare('SELECT image_url FROM gallery_posts WHERE id = ?').get(id);
    if (post) deleteLocalFileIfPresent(post.image_url);

    await db.prepare('DELETE FROM gallery_posts WHERE id = ?').run(id);
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

    const targetPos = direction === 'up' ? currentIndex : currentIndex + 2; // 1-indexed target
    if (targetPos < 1 || targetPos > posts.length) return { success: true };

    return moveGalleryPostPosition(id, targetPos);
}

// --- CONTACT & DEVIS FORM (PUBLIC) ---
export async function submitContactForm(formData) {
    const name = (formData.get('name') || '').toString().trim();
    const email = (formData.get('email') || '').toString().trim();
    const phone = (formData.get('phone') || '').toString().trim();
    const event_type = (formData.get('event_type') || '').toString().trim();
    const guests = (formData.get('guests') || '').toString().trim();
    const event_date = (formData.get('event_date') || '').toString().trim();
    const message = (formData.get('message') || '').toString().trim();

    if (event_date) {
        const todayStr = new Date().toISOString().split('T')[0];
        if (event_date < todayStr) {
            return { error: 'La date souhaitée ne peut pas être une date déjà passée.' };
        }
    }

    if (!name || !email || !message) {
        return { error: 'Veuillez remplir les champs obligatoires (nom, email, message).' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { error: 'Adresse email invalide.' };
    }

    const db = getDb();
    await db.prepare(`
        INSERT INTO contact_messages (name, email, phone, event_type, guests, event_date, message)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, email, phone, event_type, guests, event_date, message);

    revalidatePath('/admin/dashboard/messages');

    const formspreeUrlRow = await db.prepare('SELECT value FROM site_info WHERE key = ?').get('formspree_url');
    const formspreeUrl = formspreeUrlRow ? formspreeUrlRow.value : null;

    if (formspreeUrl && formspreeUrl.startsWith('http')) {
        sendContactNotification(formspreeUrl, { name, email, phone, event_type, guests, event_date, message }).catch(
            (err) => console.error('[Formspree] Erreur inattendue :', err)
        );
    }

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
            ? await db.prepare('SELECT image_url FROM weekly_menu_images WHERE menu_id = ? AND lang = "en" ORDER BY display_order ASC').all(img.menu_id)
            : await db.prepare('SELECT image_url FROM weekly_menu_images WHERE menu_id = ? AND (lang = "fr" OR lang IS NULL) ORDER BY display_order ASC').all(img.menu_id);

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

export async function reorderWeeklyMenuImage(imageId, direction) {
    try {
        await requireAdminAuth();
        const db = getDb();
        const img = await db.prepare('SELECT * FROM weekly_menu_images WHERE id = ?').get(imageId);
        if (!img) return { error: 'Image non trouvée' };

        const isEn = img.lang === 'en';
        const images = isEn
            ? await db.prepare('SELECT id, display_order FROM weekly_menu_images WHERE menu_id = ? AND lang = "en" ORDER BY display_order ASC, id ASC').all(img.menu_id)
            : await db.prepare('SELECT id, display_order FROM weekly_menu_images WHERE menu_id = ? AND (lang = "fr" OR lang IS NULL) ORDER BY display_order ASC, id ASC').all(img.menu_id);

        const index = images.findIndex(i => i.id === imageId);
        if (index === -1) return { error: 'Image non trouvée' };

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= images.length) return { success: true };

        const currentImg = images[index];
        const targetImg = images[targetIndex];

        const currentOrder = currentImg.display_order || index + 1;
        const targetOrder = targetImg.display_order || targetIndex + 1;

        const stmt = db.prepare('UPDATE weekly_menu_images SET display_order = ? WHERE id = ?');
        await stmt.run(targetOrder, currentImg.id);
        await stmt.run(currentOrder, targetImg.id);

        const updatedImages = isEn
            ? await db.prepare('SELECT image_url FROM weekly_menu_images WHERE menu_id = ? AND lang = "en" ORDER BY display_order ASC').all(img.menu_id)
            : await db.prepare('SELECT image_url FROM weekly_menu_images WHERE menu_id = ? AND (lang = "fr" OR lang IS NULL) ORDER BY display_order ASC').all(img.menu_id);

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

// --- SERVICES / PRESTATIONS ---
export async function addService(formData) {
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
    revalidatePath('/');
    revalidatePath('/a-propos');
    revalidatePath('/tarifs');
    revalidatePath('/admin/dashboard/prestations');
    return { success: true };
}

export async function editService(formData) {
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

    revalidatePath('/');
    revalidatePath('/a-propos');
    revalidatePath('/tarifs');
    revalidatePath('/admin/dashboard/prestations');
    return { success: true };
}

export async function deleteService(idOrFormData) {
    await requireAdminAuth();
    const id = extractId(idOrFormData);
    if (!id) return { error: 'ID invalide' };

    const db = getDb();
    await db.prepare('DELETE FROM services WHERE id = ?').run(id);

    revalidatePath('/');
    revalidatePath('/a-propos');
    revalidatePath('/tarifs');
    revalidatePath('/admin/dashboard/prestations');
    return { success: true };
}

export async function reorderService(id, direction) {
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
    revalidatePath('/admin/dashboard/prestations');
    return { success: true };
}

// --- PRICING DOCUMENTS (TARIFS IMAGES & PDFS) ---
export async function addPricingDocument(formData) {
    await requireAdminAuth();
    const title = (formData.get('title') || '').toString().trim();
    const title_en = (formData.get('title_en') || '').toString().trim();
    const description = (formData.get('description') || '').toString().trim();
    const description_en = (formData.get('description_en') || '').toString().trim();
    const file_fr = formData.get('file_fr');
    const file_en = formData.get('file_en');
    let file_url = (formData.get('file_url') || '').toString().trim();
    let file_url_en = (formData.get('file_url_en') || '').toString().trim();

    if (!title) {
        return { error: 'Veuillez saisir un titre pour le document de tarifs.' };
    }

    if (file_fr && file_fr.size > 0) {
        file_url = await saveUploadedFile(file_fr);
    }
    if (file_en && file_en.size > 0) {
        file_url_en = await saveUploadedFile(file_en);
    }

    if (!file_url) {
        return { error: 'Veuillez téléverser au moins un document ou une image de tarif.' };
    }

    const isPdf = (file_url || '').toLowerCase().endsWith('.pdf');
    const file_type = isPdf ? 'pdf' : 'image';

    const db = getDb();
    const maxRow = await db.prepare('SELECT MAX(display_order) as maxOrder FROM pricing_documents').get();
    const nextOrder = (maxRow?.maxOrder || 0) + 1;

    await db.prepare(`
        INSERT INTO pricing_documents (title, title_en, description, description_en, file_url, file_url_en, file_type, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, title_en, description, description_en, file_url, file_url_en || file_url, file_type, nextOrder);

    revalidatePath('/tarifs');
    revalidatePath('/admin/dashboard/prestations');
    return { success: true };
}

export async function editPricingDocument(formData) {
    await requireAdminAuth();
    const id = extractId(formData);
    if (!id) return { error: 'ID manquant' };

    const title = (formData.get('title') || '').toString().trim();
    const title_en = (formData.get('title_en') || '').toString().trim();
    const description = (formData.get('description') || '').toString().trim();
    const description_en = (formData.get('description_en') || '').toString().trim();
    const file_fr = formData.get('file_fr');
    const file_en = formData.get('file_en');

    const db = getDb();
    const existing = await db.prepare('SELECT * FROM pricing_documents WHERE id = ?').get(id);
    if (!existing) return { error: 'Document introuvable' };

    let file_url = existing.file_url;
    let file_url_en = existing.file_url_en;

    if (file_fr && file_fr.size > 0) {
        file_url = await saveUploadedFile(file_fr);
    }
    if (file_en && file_en.size > 0) {
        file_url_en = await saveUploadedFile(file_en);
    }

    const isPdf = (file_url || '').toLowerCase().endsWith('.pdf');
    const file_type = isPdf ? 'pdf' : 'image';

    await db.prepare(`
        UPDATE pricing_documents
        SET title = ?, title_en = ?, description = ?, description_en = ?, file_url = ?, file_url_en = ?, file_type = ?
        WHERE id = ?
    `).run(title, title_en, description, description_en, file_url, file_url_en || file_url, file_type, id);

    revalidatePath('/tarifs');
    revalidatePath('/admin/dashboard/prestations');
    return { success: true };
}

export async function deletePricingDocument(idOrFormData) {
    await requireAdminAuth();
    const id = extractId(idOrFormData);
    if (!id) return { error: 'ID invalide' };

    const db = getDb();
    await db.prepare('DELETE FROM pricing_documents WHERE id = ?').run(id);

    revalidatePath('/tarifs');
    revalidatePath('/admin/dashboard/prestations');
    return { success: true };
}

export async function reorderPricingDocument(id, direction) {
    await requireAdminAuth();
    const db = getDb();
    const docs = await db.prepare('SELECT id, display_order FROM pricing_documents ORDER BY display_order ASC, id ASC').all();
    const index = docs.findIndex(d => d.id === id);
    if (index === -1) return { error: 'Document introuvable' };

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= docs.length) return { success: true };

    const currentDoc = docs[index];
    const targetDoc = docs[targetIndex];

    const currentOrder = currentDoc.display_order || index + 1;
    const targetOrder = targetDoc.display_order || targetIndex + 1;

    const stmt = db.prepare('UPDATE pricing_documents SET display_order = ? WHERE id = ?');
    await stmt.run(targetOrder, currentDoc.id);
    await stmt.run(currentOrder, targetDoc.id);

    revalidatePath('/tarifs');
    revalidatePath('/admin/dashboard/prestations');
    return { success: true };
}

// --- FIXED MEAL PRICES ---
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

    revalidatePath('/tarifs');
    revalidatePath('/admin/dashboard/prestations');
    return { success: true };
}

export async function deleteFixedPrice(idOrFormData) {
    await requireAdminAuth();
    const id = extractId(idOrFormData);
    if (!id) return { error: 'ID invalide' };

    const db = getDb();
    await db.prepare('DELETE FROM fixed_prices WHERE id = ?').run(id);

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

    const currentPrice = prices[index];
    const targetPrice = prices[targetIndex];

    const currentOrder = currentPrice.display_order || index + 1;
    const targetOrder = targetPrice.display_order || targetIndex + 1;

    const stmt = db.prepare('UPDATE fixed_prices SET display_order = ? WHERE id = ?');
    await stmt.run(targetOrder, currentPrice.id);
    await stmt.run(currentOrder, targetPrice.id);

    revalidatePath('/tarifs');
    revalidatePath('/admin/dashboard/prestations');
    return { success: true };
}

// --- DATABASE BACKUP & RESTORE ---
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

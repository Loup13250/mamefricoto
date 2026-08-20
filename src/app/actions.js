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
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.mov', '.svg', '.jfif', '.heic', '.heif', '.avif', '.bmp']);

async function saveUploadedFile(file) {
    if (!file || typeof file === 'string' || !file.name || file.size === 0) return null;

    const isVercel = Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production');
    const maxSize = isVercel ? 4.5 * 1024 * 1024 : 50 * 1024 * 1024;

    if (file.size > maxSize) {
        throw new Error("L'image sélectionnée est trop volumineuse (max 4.5 Mo). Veuillez choisir une autre photo ou la compresser.");
    }

    let ext = path.extname(file.name || '').toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
        if (file.type && file.type.startsWith('image/')) {
            ext = '.webp';
        } else if (file.type && file.type.startsWith('video/')) {
            ext = '.mp4';
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
        };
        const mimeType = file.type || mimeTypes[ext] || 'image/jpeg';

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
        'contact_email', 'phone', 'address', 'hours',
        'instagram', 'facebook', 'google_reviews', 'about_text',
        'formspree_url'
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

    const logoFile = formData.get('logo_file');
    const aboutFile = formData.get('about_file');

    if (logoFile && logoFile.size > 0) {
        const logoUrl = await saveUploadedFile(logoFile);
        if (logoUrl) await stmt.run('logo', logoUrl);
    }

    if (aboutFile && aboutFile.size > 0) {
        const aboutUrl = await saveUploadedFile(aboutFile);
        if (aboutUrl) await stmt.run('about_image', aboutUrl);
    }

    revalidatePath('/');
    revalidatePath('/contact');
    revalidatePath('/a-propos');
    revalidatePath('/admin/dashboard/settings');
    return { success: true };
}

// --- WEEKLY MENU ---
export async function addWeeklyMenu(formData) {
    await requireAdminAuth();
    const title = (formData.get('title') || '').toString().trim();
    const description = (formData.get('description') || '').toString().trim();
    const is_current = formData.get('is_current') === 'on' ? 1 : 0;

    if (!title) {
        return { error: 'Veuillez saisir un titre pour le menu.' };
    }

    const files = formData.getAll('image_files');
    const uploadedUrls = [];

    for (const file of files) {
        if (file && file.size > 0) {
            const url = await saveUploadedFile(file);
            if (url) uploadedUrls.push(url);
        }
    }

    const imagesToAttach = uploadedUrls.length > 0 ? uploadedUrls : DEFAULT_MENU_IMAGES;
    const mainImageUrl = imagesToAttach[0];

    const db = getDb();

    if (is_current) {
        await db.prepare('UPDATE weekly_menus SET is_current = 0').run();
    }

    const result = await db.prepare('INSERT INTO weekly_menus (title, description, image_url, embed_url, is_current) VALUES (?, ?, ?, ?, ?)').run(title, description, mainImageUrl, '', is_current);
    const menuId = result.lastInsertRowid;

    const stmt = db.prepare('INSERT INTO weekly_menu_images (menu_id, image_url, display_order) VALUES (?, ?, ?)');
    for (let idx = 0; idx < imagesToAttach.length; idx++) {
        await stmt.run(menuId, imagesToAttach[idx], idx + 1);
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
}

export async function editWeeklyMenu(formData) {
    await requireAdminAuth();
    const id = extractId(formData);
    if (!id) return { error: 'ID invalide' };

    const title = (formData.get('title') || '').toString().trim();
    const description = (formData.get('description') || '').toString().trim();
    const is_current = formData.get('is_current') === 'on' ? 1 : 0;

    if (!title) {
        return { error: 'Veuillez saisir un titre pour le menu.' };
    }

    const files = formData.getAll('image_files');
    const uploadedUrls = [];

    for (const file of files) {
        if (file && file.size > 0) {
            const url = await saveUploadedFile(file);
            if (url) uploadedUrls.push(url);
        }
    }

    const db = getDb();

    if (is_current) {
        await db.prepare('UPDATE weekly_menus SET is_current = 0').run();
    }

    if (uploadedUrls.length > 0) {
        await db.prepare('UPDATE weekly_menus SET title=?, description=?, image_url=?, is_current=? WHERE id=?').run(title, description, uploadedUrls[0], is_current, id);
        await db.prepare('DELETE FROM weekly_menu_images WHERE menu_id = ?').run(id);
        const stmt = db.prepare('INSERT INTO weekly_menu_images (menu_id, image_url, display_order) VALUES (?, ?, ?)');
        for (let idx = 0; idx < uploadedUrls.length; idx++) {
            await stmt.run(id, uploadedUrls[idx], idx + 1);
        }
    } else {
        const existingImages = await db.prepare('SELECT COUNT(*) as count FROM weekly_menu_images WHERE menu_id = ?').get(id);
        if (existingImages.count === 0) {
            await db.prepare('UPDATE weekly_menus SET title=?, description=?, image_url=?, is_current=? WHERE id=?').run(title, description, DEFAULT_MENU_IMAGES[0], is_current, id);
            const stmt = db.prepare('INSERT INTO weekly_menu_images (menu_id, image_url, display_order) VALUES (?, ?, ?)');
            for (let idx = 0; idx < DEFAULT_MENU_IMAGES.length; idx++) {
                await stmt.run(id, DEFAULT_MENU_IMAGES[idx], idx + 1);
            }
        } else {
            await db.prepare('UPDATE weekly_menus SET title=?, description=?, is_current=? WHERE id=?').run(title, description, is_current, id);
        }
    }

    revalidatePath('/');
    revalidatePath('/admin/dashboard/menu-semaine');
    return { success: true };
}

export async function deleteWeeklyMenu(idOrFormData) {
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
}

export async function toggleWeeklyMenuCurrent(idOrFormData) {
    await requireAdminAuth();
    const id = extractId(idOrFormData);
    if (!id) return { error: 'ID invalide' };

    const db = getDb();
    await db.prepare('UPDATE weekly_menus SET is_current = 0').run();
    await db.prepare('UPDATE weekly_menus SET is_current = 1 WHERE id = ?').run(id);
    revalidatePath('/');
    revalidatePath('/admin/dashboard/menu-semaine');
    return { success: true };
}

// --- HERO CAROUSEL ---
export async function addCarouselImage(formData) {
    try {
        await requireAdminAuth();
        const title = (formData.get('title') || '').toString().trim();
        const subtitle = (formData.get('subtitle') || '').toString().trim();
        const display_order = parseInt(formData.get('display_order') || '0', 10);
        const file = formData.get('image_file');

        let image_url = (formData.get('image_url') || '').toString().trim();
        if (file && file.size > 0) {
            const uploaded = await saveUploadedFile(file);
            if (uploaded) image_url = uploaded;
        }

        if (!image_url) {
            return { error: 'Veuillez sélectionner une image' };
        }

        const db = getDb();
        await db.prepare('INSERT INTO carousel_images (image_url, title, subtitle, display_order) VALUES (?, ?, ?, ?)').run(image_url, title, subtitle, display_order);

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
        const img = await db.prepare('SELECT image_url FROM carousel_images WHERE id = ?').get(id);
        if (img) deleteLocalFileIfPresent(img.image_url);

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
        const subtitle = (formData.get('subtitle') || '').toString().trim();
        const display_order = parseInt(formData.get('display_order') || '1', 10);
        const file = formData.get('image_file');
        let image_url = (formData.get('image_url') || '').toString().trim();

        const db = getDb();
        const existing = await db.prepare('SELECT image_url FROM carousel_images WHERE id = ?').get(id);
        if (!existing) return { error: 'Photo du carrousel introuvable' };

        if (file && file.size > 0) {
            const uploaded = await saveUploadedFile(file);
            if (uploaded) image_url = uploaded;
        }

        if (!image_url) {
            image_url = existing.image_url;
        }

        await db.prepare(`
            UPDATE carousel_images
            SET title = ?, subtitle = ?, image_url = ?, display_order = ?
            WHERE id = ?
        `).run(title, subtitle, image_url, display_order, id);

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
        const caption = (formData.get('caption') || '').toString().trim();
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
        await db.prepare('INSERT INTO gallery_posts (title, caption, image_url, media_type, display_order) VALUES (?, ?, ?, ?, 0)').run(
            title, caption, image_url, media_type
        );

        // Nettoyage automatique : limiter la galerie aux 15 plus récentes
        const allPosts = await db.prepare('SELECT id, image_url FROM gallery_posts ORDER BY created_at DESC').all();
        if (allPosts.length > 15) {
            const postsToDelete = allPosts.slice(15);
            for (const oldPost of postsToDelete) {
                deleteLocalFileIfPresent(oldPost.image_url);
                await db.prepare('DELETE FROM gallery_posts WHERE id = ?').run(oldPost.id);
            }
        }

        revalidatePath('/');
        revalidatePath('/admin/dashboard/galerie');
        return { success: true };
    } catch (err) {
        console.error('[Gallery] Erreur :', err);
        return { error: err.message || 'Une erreur est survenue lors de la publication.' };
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
    revalidatePath('/admin/dashboard/galerie');
    return { success: true };
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

export async function reorderGalleryPost(id, direction) {
    await requireAdminAuth();
    const db = getDb();
    const posts = await db.prepare('SELECT id FROM gallery_posts ORDER BY display_order ASC, created_at DESC').all();
    const index = posts.findIndex(p => p.id === id);
    if (index === -1) return { error: 'Post non trouvé' };

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= posts.length) return { success: true };

    const temp = posts[index];
    posts[index] = posts[targetIndex];
    posts[targetIndex] = temp;

    const stmt = db.prepare('UPDATE gallery_posts SET display_order = ? WHERE id = ?');
    for (let i = 0; i < posts.length; i++) {
        await stmt.run(i + 1, posts[i].id);
    }

    revalidatePath('/');
    revalidatePath('/admin/dashboard/galerie');
    return { success: true };
}

export async function deleteWeeklyMenuImage(imageId) {
    await requireAdminAuth();
    const db = getDb();
    const img = await db.prepare('SELECT * FROM weekly_menu_images WHERE id = ?').get(imageId);
    if (!img) return { error: 'Image non trouvée' };

    deleteLocalFileIfPresent(img.image_url);
    await db.prepare('DELETE FROM weekly_menu_images WHERE id = ?').run(imageId);

    const remaining = await db.prepare('SELECT image_url FROM weekly_menu_images WHERE menu_id = ? ORDER BY display_order ASC').all(img.menu_id);
    if (remaining.length > 0) {
        await db.prepare('UPDATE weekly_menus SET image_url = ? WHERE id = ?').run(remaining[0].image_url, img.menu_id);
    }

    revalidatePath('/');
    revalidatePath('/admin/dashboard/menu-semaine');
    return { success: true };
}

export async function reorderWeeklyMenuImage(imageId, direction) {
    await requireAdminAuth();
    const db = getDb();
    const img = await db.prepare('SELECT * FROM weekly_menu_images WHERE id = ?').get(imageId);
    if (!img) return { error: 'Image non trouvée' };

    const images = await db.prepare('SELECT id, display_order FROM weekly_menu_images WHERE menu_id = ? ORDER BY display_order ASC, id ASC').all(img.menu_id);
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

    const updatedImages = await db.prepare('SELECT image_url FROM weekly_menu_images WHERE menu_id = ? ORDER BY display_order ASC').all(img.menu_id);
    if (updatedImages.length > 0) {
        await db.prepare('UPDATE weekly_menus SET image_url = ? WHERE id = ?').run(updatedImages[0].image_url, img.menu_id);
    }

    revalidatePath('/');
    revalidatePath('/admin/dashboard/menu-semaine');
    return { success: true };
}

// --- SERVICES / PRESTATIONS ---
export async function addService(formData) {
    await requireAdminAuth();
    const title = (formData.get('title') || '').toString().trim();
    const description = (formData.get('description') || '').toString().trim();
    const badge = (formData.get('badge') || '').toString().trim();
    const num = (formData.get('num') || '').toString().trim();

    if (!title || !description) {
        return { error: 'Veuillez remplir le titre et la description.' };
    }

    const db = getDb();
    const maxRow = await db.prepare('SELECT MAX(display_order) as maxOrder FROM services').get();
    const nextOrder = (maxRow?.maxOrder || 0) + 1;

    const formattedNum = num || (nextOrder < 10 ? `0${nextOrder}` : `${nextOrder}`);

    await db.prepare('INSERT INTO services (num, title, description, badge, display_order) VALUES (?, ?, ?, ?, ?)').run(
        formattedNum, title, description, badge, nextOrder
    );

    revalidatePath('/');
    revalidatePath('/a-propos');
    revalidatePath('/admin/dashboard/prestations');
    return { success: true };
}

export async function editService(formData) {
    await requireAdminAuth();
    const id = extractId(formData);
    if (!id) return { error: 'ID invalide' };

    const title = (formData.get('title') || '').toString().trim();
    const description = (formData.get('description') || '').toString().trim();
    const badge = (formData.get('badge') || '').toString().trim();
    const num = (formData.get('num') || '').toString().trim();

    if (!title || !description) {
        return { error: 'Veuillez remplir le titre et la description.' };
    }

    const db = getDb();
    await db.prepare('UPDATE services SET num = ?, title = ?, description = ?, badge = ? WHERE id = ?').run(
        num, title, description, badge, id
    );

    revalidatePath('/');
    revalidatePath('/a-propos');
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
                await db.prepare('INSERT INTO services (id, num, title, description, badge, display_order) VALUES (?, ?, ?, ?, ?, ?)').run(
                    s.id, s.num, s.title, s.description, s.badge, s.display_order
                );
            }
        }

        if (Array.isArray(backup.data.weekly_menus) && backup.data.weekly_menus.length > 0) {
            await db.prepare('DELETE FROM weekly_menu_images').run();
            await db.prepare('DELETE FROM weekly_menus').run();
            for (const m of backup.data.weekly_menus) {
                await db.prepare('INSERT INTO weekly_menus (id, title, description, image_url, embed_url, is_current) VALUES (?, ?, ?, ?, ?, ?)').run(
                    m.id, m.title, m.description, m.image_url, m.embed_url || '', m.is_current ? 1 : 0
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
                await db.prepare('INSERT INTO gallery_posts (id, title, caption, image_url, media_type, display_order) VALUES (?, ?, ?, ?, ?, ?)').run(
                    post.id, post.title, post.caption, post.image_url, post.media_type || 'image', post.display_order
                );
            }
        }

        if (Array.isArray(backup.data.carousel_images) && backup.data.carousel_images.length > 0) {
            await db.prepare('DELETE FROM carousel_images').run();
            for (const c of backup.data.carousel_images) {
                await db.prepare('INSERT INTO carousel_images (id, title, subtitle, image_url, display_order) VALUES (?, ?, ?, ?, ?)').run(
                    c.id, c.title, c.subtitle, c.image_url, c.display_order
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

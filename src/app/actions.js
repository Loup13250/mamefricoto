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
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.mov', '.svg']);

async function saveUploadedFile(file) {
    if (!file || typeof file === 'string' || !file.name || file.size === 0) return null;

    const isVercel = Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production');
    const maxSize = isVercel ? 4.5 * 1024 * 1024 : 50 * 1024 * 1024;

    if (file.size > maxSize) {
        throw new Error(isVercel
            ? "Le fichier dépasse la limite d'upload direct de 4.5 Mo sur Vercel. Veuillez utiliser une vidéo/image plus légère ou coller un lien URL."
            : 'Fichier trop volumineux (50 Mo maximum).'
        );
    }

    const rawExt = path.extname(file.name).toLowerCase();
    const ext = rawExt || '.jpg';

    if (!ALLOWED_EXTENSIONS.has(ext)) {
        throw new Error(`Format de fichier non autorisé (${ext}). Acceptés : JPG, PNG, WEBP, GIF, MP4, WEBM, MOV.`);
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

        // Sur Vercel ou environnement Serverless, conversion en Data URI Base64 autonome pour éviter les 404
        if (isVercel || process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL) {
            const base64 = buffer.toString('base64');
            return `data:${mimeType};base64,${base64}`;
        }

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
        const filePath = path.join(uploadsDir, fileName);

        fs.writeFileSync(filePath, buffer);
        return `/uploads/${fileName}`;
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
}

export async function deleteCarouselImage(idOrFormData) {
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
}

export async function editCarouselImage(formData) {
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
        await db.prepare('INSERT INTO gallery_posts (title, caption, image_url, media_type) VALUES (?, ?, ?, ?)').run(
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
    const posts = await db.prepare('SELECT id, display_order FROM gallery_posts ORDER BY display_order ASC, id ASC').all();
    const index = posts.findIndex(p => p.id === id);
    if (index === -1) return { error: 'Post non trouvé' };

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= posts.length) return { success: true };

    const currentPost = posts[index];
    const targetPost = posts[targetIndex];

    const currentOrder = currentPost.display_order || index + 1;
    const targetOrder = targetPost.display_order || targetIndex + 1;

    const stmt = db.prepare('UPDATE gallery_posts SET display_order = ? WHERE id = ?');
    await stmt.run(targetOrder, currentPost.id);
    await stmt.run(currentOrder, targetPost.id);

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

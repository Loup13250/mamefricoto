'use server';

import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

function extractId(idOrFormData) {
    if (!idOrFormData) return null;
    if (typeof idOrFormData === 'object' && typeof idOrFormData.get === 'function') {
        const val = idOrFormData.get('id');
        return val ? parseInt(val, 10) : null;
    }
    return parseInt(idOrFormData, 10);
}

// --- AUTH ---
export async function adminLogin(formData) {
    const username = formData.get('username');
    const password = formData.get('password');

    const db = getDb();
    const user = db.prepare('SELECT * FROM admin_users WHERE username = ? AND password = ?').get(username, password);

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

// --- HELPER FOR UPLOADS ---
async function saveUploadedFile(file) {
    if (!file || typeof file === 'string' || file.size === 0) return null;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.name) || '.jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, buffer);
    return `/uploads/${fileName}`;
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
    const db = getDb();

    const contact_email = formData.get('contact_email');
    const phone = formData.get('phone');
    const address = formData.get('address');
    const hours = formData.get('hours');
    const instagram = formData.get('instagram');
    const facebook = formData.get('facebook');
    const google_reviews = formData.get('google_reviews');
    const about_text = formData.get('about_text');

    const smtp_host = formData.get('smtp_host');
    const smtp_port = formData.get('smtp_port');
    const smtp_user = formData.get('smtp_user');
    const smtp_pass = formData.get('smtp_pass');

    const logoFile = formData.get('logo_file');
    const aboutFile = formData.get('about_file');

    let logoUrl = null;
    let aboutUrl = null;

    if (logoFile && logoFile.size > 0) {
        logoUrl = await saveUploadedFile(logoFile);
    }

    if (aboutFile && aboutFile.size > 0) {
        aboutUrl = await saveUploadedFile(aboutFile);
    }

    const current = db.prepare('SELECT * FROM site_info WHERE id = 1').get();

    db.prepare(`
        UPDATE site_info 
        SET contact_email = ?, phone = ?, address = ?, hours = ?, 
            instagram = ?, facebook = ?, google_reviews = ?, about_text = ?,
            smtp_host = ?, smtp_port = ?, smtp_user = ?, smtp_pass = ?,
            logo = COALESCE(?, logo),
            about_image = COALESCE(?, about_image)
        WHERE id = 1
    `).run(
        contact_email, phone, address, hours,
        instagram, facebook, google_reviews, about_text,
        smtp_host, smtp_port, smtp_user, smtp_pass,
        logoUrl || current.logo,
        aboutUrl || current.about_image
    );

    revalidatePath('/');
    revalidatePath('/contact');
    revalidatePath('/a-propos');
    revalidatePath('/admin/dashboard/settings');
    redirect('/admin/dashboard/settings?saved=1');
}

// --- WEEKLY MENU ---
export async function addWeeklyMenu(formData) {
    const title = formData.get('title');
    const description = formData.get('description');
    const is_current = formData.get('is_current') === 'on' ? 1 : 0;

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
        db.prepare('UPDATE weekly_menus SET is_current = 0').run();
    }

    const result = db.prepare('INSERT INTO weekly_menus (title, description, image_url, embed_url, is_current) VALUES (?, ?, ?, ?, ?)').run(title, description || '', mainImageUrl, '', is_current);
    const menuId = result.lastInsertRowid;

    const stmt = db.prepare('INSERT INTO weekly_menu_images (menu_id, image_url, display_order) VALUES (?, ?, ?)');
    imagesToAttach.forEach((url, idx) => {
        stmt.run(menuId, url, idx + 1);
    });

    revalidatePath('/');
    revalidatePath('/admin/dashboard/menu-semaine');
    return { success: true };
}

export async function editWeeklyMenu(formData) {
    const id = extractId(formData);
    const title = formData.get('title');
    const description = formData.get('description');
    const is_current = formData.get('is_current') === 'on' ? 1 : 0;

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
        db.prepare('UPDATE weekly_menus SET is_current = 0').run();
    }

    if (uploadedUrls.length > 0) {
        db.prepare('UPDATE weekly_menus SET title=?, description=?, image_url=?, is_current=? WHERE id=?').run(title, description || '', uploadedUrls[0], is_current, id);
        db.prepare('DELETE FROM weekly_menu_images WHERE menu_id = ?').run(id);
        const stmt = db.prepare('INSERT INTO weekly_menu_images (menu_id, image_url, display_order) VALUES (?, ?, ?)');
        uploadedUrls.forEach((url, idx) => {
            stmt.run(id, url, idx + 1);
        });
    } else {
        const existingImages = db.prepare('SELECT COUNT(*) as count FROM weekly_menu_images WHERE menu_id = ?').get(id);
        if (existingImages.count === 0) {
            db.prepare('UPDATE weekly_menus SET title=?, description=?, image_url=?, is_current=? WHERE id=?').run(title, description || '', DEFAULT_MENU_IMAGES[0], is_current, id);
            const stmt = db.prepare('INSERT INTO weekly_menu_images (menu_id, image_url, display_order) VALUES (?, ?, ?)');
            DEFAULT_MENU_IMAGES.forEach((url, idx) => {
                stmt.run(id, url, idx + 1);
            });
        } else {
            db.prepare('UPDATE weekly_menus SET title=?, description=?, is_current=? WHERE id=?').run(title, description || '', is_current, id);
        }
    }

    revalidatePath('/');
    revalidatePath('/admin/dashboard/menu-semaine');
    return { success: true };
}

export async function deleteWeeklyMenu(idOrFormData) {
    const id = extractId(idOrFormData);
    if (!id) return { error: 'ID invalide' };

    const db = getDb();
    db.prepare('DELETE FROM weekly_menu_images WHERE menu_id = ?').run(id);
    db.prepare('DELETE FROM weekly_menus WHERE id = ?').run(id);
    revalidatePath('/');
    revalidatePath('/admin/dashboard/menu-semaine');
    return { success: true };
}

export async function toggleWeeklyMenuCurrent(idOrFormData) {
    const id = extractId(idOrFormData);
    if (!id) return { error: 'ID invalide' };

    const db = getDb();
    db.prepare('UPDATE weekly_menus SET is_current = 0').run();
    db.prepare('UPDATE weekly_menus SET is_current = 1 WHERE id = ?').run(id);
    revalidatePath('/');
    revalidatePath('/admin/dashboard/menu-semaine');
    return { success: true };
}

// --- HERO CAROUSEL ---
export async function addCarouselImage(formData) {
    const title = formData.get('title');
    const subtitle = formData.get('subtitle');
    const display_order = parseInt(formData.get('display_order') || '0', 10);
    const file = formData.get('image_file');

    let image_url = formData.get('image_url') || '';
    if (file && file.size > 0) {
        const uploaded = await saveUploadedFile(file);
        if (uploaded) image_url = uploaded;
    }

    if (!image_url) {
        return { error: 'Veuillez sélectionner une image' };
    }

    const db = getDb();
    db.prepare('INSERT INTO carousel_images (image_url, title, subtitle, display_order) VALUES (?, ?, ?, ?)').run(image_url, title || '', subtitle || '', display_order);

    revalidatePath('/');
    revalidatePath('/admin/dashboard/carousel');
    return { success: true };
}

export async function deleteCarouselImage(idOrFormData) {
    const id = extractId(idOrFormData);
    if (!id) return { error: 'ID invalide' };

    const db = getDb();
    db.prepare('DELETE FROM carousel_images WHERE id = ?').run(id);
    revalidatePath('/');
    revalidatePath('/admin/dashboard/carousel');
    return { success: true };
}

// --- GALLERY ---
export async function addGalleryPost(formData) {
    const caption = formData.get('caption');
    const is_story = formData.get('is_story') === 'on' ? 1 : 0;
    const is_video = formData.get('is_video') === 'on' ? 1 : 0;
    const media_url_text = formData.get('media_url') || '';
    const file = formData.get('media_file');

    let media_url = media_url_text;
    if (file && file.size > 0) {
        const uploaded = await saveUploadedFile(file);
        if (uploaded) media_url = uploaded;
    }

    if (!media_url) {
        return { error: 'Veuillez ajouter une image ou une vidéo' };
    }

    const db = getDb();
    db.prepare('INSERT INTO gallery_posts (media_url, caption, is_story, is_video) VALUES (?, ?, ?, ?)').run(media_url, caption || '', is_story, is_video);

    revalidatePath('/');
    revalidatePath('/admin/dashboard/galerie');
    return { success: true };
}

export async function deleteGalleryPost(idOrFormData) {
    const id = extractId(idOrFormData);
    if (!id) return { error: 'ID invalide' };

    const db = getDb();
    db.prepare('DELETE FROM gallery_posts WHERE id = ?').run(id);
    revalidatePath('/');
    revalidatePath('/admin/dashboard/galerie');
    return { success: true };
}

// --- CONTACT & DEVIS FORM ---
export async function submitContactForm(formData) {
    const name = formData.get('name');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const event_type = formData.get('event_type');
    const guest_count = formData.get('guest_count');
    const event_date = formData.get('event_date');
    const message = formData.get('message');

    if (!name || !email || !message) {
        return { error: 'Veuillez remplir les champs obligatoires (nom, email, message).' };
    }

    const db = getDb();
    db.prepare(`
        INSERT INTO contact_messages (name, email, phone, event_type, guest_count, event_date, message)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, email, phone || '', event_type || '', guest_count || '', event_date || '', message);

    revalidatePath('/admin/dashboard/messages');

    return { success: true, message: 'Votre demande a bien été envoyée. Mamé Fricoto vous recontactera rapidement !' };
}

export async function markMessageRead(idOrFormData) {
    const id = extractId(idOrFormData);
    if (!id) return { error: 'ID invalide' };

    const db = getDb();
    db.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').run(id);
    revalidatePath('/admin/dashboard/messages');
    return { success: true };
}

export async function deleteMessage(idOrFormData) {
    const id = extractId(idOrFormData);
    if (!id) return { error: 'ID invalide' };

    const db = getDb();
    db.prepare('DELETE FROM contact_messages WHERE id = ?').run(id);
    revalidatePath('/admin/dashboard/messages');
    return { success: true };
}

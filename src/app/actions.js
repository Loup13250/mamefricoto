'use server';

import { getDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import nodemailer from 'nodemailer';

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
            maxAge: 60 * 60 * 24,
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

// --- FILE UPLOAD HELPER ---
async function saveUploadedFile(file) {
    if (!file || file.size === 0) return null;
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = Date.now() + '-' + Math.random().toString(36).substring(2, 7) + '-' + file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    try {
        await fs.access(uploadsDir);
    } catch {
        await fs.mkdir(uploadsDir, { recursive: true });
    }

    const filepath = path.join(uploadsDir, filename);
    await fs.writeFile(filepath, buffer);
    return '/uploads/' + filename;
}

// --- CONTACT FORM SUBMISSION ---
export async function submitContactForm(formData) {
    const name = formData.get('name');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const event_type = formData.get('event_type') || 'Demande d\'information';
    const event_date = formData.get('event_date') || '';
    const guests = formData.get('guests') || '';
    const message = formData.get('message');

    if (!name || !email || !phone || !message) {
        return { error: 'Veuillez remplir tous les champs obligatoires.' };
    }

    const db = getDb();
    db.prepare(`
        INSERT INTO contact_messages (name, email, phone, event_type, event_date, guests, message)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, email, phone, event_type, event_date, guests, message);

    try {
        const rows = db.prepare('SELECT * FROM site_info').all();
        const info = {};
        for (const row of rows) info[row.key] = row.value;

        const host = info.smtp_host || process.env.SMTP_HOST;
        const port = info.smtp_port || process.env.SMTP_PORT || 587;
        const user = info.smtp_user || process.env.SMTP_USER;
        const pass = info.smtp_pass || process.env.SMTP_PASS;
        const recipient = info.contact_email || 'mamefricoto@gmail.com';

        if (host && user && pass) {
            const transporter = nodemailer.createTransport({
                host,
                port: Number(port),
                secure: Number(port) === 465,
                auth: { user, pass },
            });

            await transporter.sendMail({
                from: `"Mamé Fricoto Web" <${user}>`,
                to: recipient,
                replyTo: email,
                subject: `Nouvelle demande : ${event_type} - ${name}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #2C1810; max-width: 600px; border: 1px solid #E8A87C; border-radius: 12px;">
                        <h2 style="color: #3D5A80;">Nouveau message de contact — Mamé Fricoto</h2>
                        <p><strong>Nom :</strong> ${name}</p>
                        <p><strong>Email :</strong> ${email}</p>
                        <p><strong>Téléphone :</strong> ${phone}</p>
                        <p><strong>Prestation :</strong> ${event_type}</p>
                        ${event_date ? `<p><strong>Date souhaitée :</strong> ${event_date}</p>` : ''}
                        ${guests ? `<p><strong>Invités :</strong> ${guests}</p>` : ''}
                        <hr style="border-top: 1px solid #f2e8e4; margin: 20px 0;" />
                        <p><strong>Message :</strong></p>
                        <blockquote style="background: #FFF8F0; padding: 15px; border-left: 4px solid #E8A87C; margin: 0;">
                            ${message.replace(/\n/g, '<br/>')}
                        </blockquote>
                    </div>
                `,
            });
        }
    } catch (err) {
        console.warn("SMTP email notification ignored:", err.message);
    }

    revalidatePath('/contact');
    revalidatePath('/admin/dashboard/messages');
    return { success: true };
}

export async function markMessageRead(formData) {
    const id = formData.get('id');
    const db = getDb();
    db.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').run(id);
    revalidatePath('/admin/dashboard/messages');
    return { success: true };
}

export async function deleteMessage(formData) {
    const id = formData.get('id');
    const db = getDb();
    db.prepare('DELETE FROM contact_messages WHERE id = ?').run(id);
    revalidatePath('/admin/dashboard/messages');
    return { success: true };
}

// --- SETTINGS ---
export async function updateSiteInfo(formData) {
    const db = getDb();

    const logo_file = formData.get('logo_file');
    if (logo_file && logo_file.size > 0) {
        const logoUrl = await saveUploadedFile(logo_file);
        if (logoUrl) {
            db.prepare('INSERT INTO site_info (key, value) VALUES (\'site_logo\', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(logoUrl);
        }
    }

    const about_file = formData.get('about_file');
    if (about_file && about_file.size > 0) {
        const aboutUrl = await saveUploadedFile(about_file);
        if (aboutUrl) {
            db.prepare('INSERT INTO site_info (key, value) VALUES (\'about_image\', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(aboutUrl);
        }
    }

    const entries = Array.from(formData.entries());
    for (const [key, value] of entries) {
        if (key.startsWith('$ACTION') || key === 'logo_file' || key === 'about_file') continue;
        db.prepare('INSERT INTO site_info (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, value);
    }

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
    let embed_url = formData.get('embed_url') || '';
    const is_current = formData.get('is_current') === 'on' ? 1 : 0;

    // Clean up embed URL if given (remove query params like ?img_index=1 for clean embed)
    if (embed_url) {
        embed_url = embed_url.split('?')[0].trim();
    }

    const files = formData.getAll('image_files');
    const uploadedUrls = [];

    for (const file of files) {
        if (file && file.size > 0) {
            const url = await saveUploadedFile(file);
            if (url) uploadedUrls.push(url);
        }
    }

    const mainImageUrl = uploadedUrls.length > 0 ? uploadedUrls[0] : (formData.get('image_url') || '');

    const db = getDb();

    if (is_current) {
        db.prepare('UPDATE weekly_menus SET is_current = 0').run();
    }

    const result = db.prepare('INSERT INTO weekly_menus (title, description, image_url, embed_url, is_current) VALUES (?, ?, ?, ?, ?)').run(title, description || '', mainImageUrl, embed_url, is_current);
    const menuId = result.lastInsertRowid;

    if (uploadedUrls.length > 0) {
        const stmt = db.prepare('INSERT INTO weekly_menu_images (menu_id, image_url, display_order) VALUES (?, ?, ?)');
        uploadedUrls.forEach((url, idx) => {
            stmt.run(menuId, url, idx + 1);
        });
    }

    revalidatePath('/');
    revalidatePath('/admin/dashboard/menu-semaine');
    return { success: true };
}

export async function editWeeklyMenu(formData) {
    const id = formData.get('id');
    const title = formData.get('title');
    const description = formData.get('description');
    let embed_url = formData.get('embed_url') || '';
    const is_current = formData.get('is_current') === 'on' ? 1 : 0;

    if (embed_url) {
        embed_url = embed_url.split('?')[0].trim();
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
        db.prepare('UPDATE weekly_menus SET is_current = 0').run();
    }

    if (uploadedUrls.length > 0) {
        db.prepare('UPDATE weekly_menus SET title=?, description=?, image_url=?, embed_url=?, is_current=? WHERE id=?').run(title, description || '', uploadedUrls[0], embed_url, is_current, id);

        db.prepare('DELETE FROM weekly_menu_images WHERE menu_id = ?').run(id);
        const stmt = db.prepare('INSERT INTO weekly_menu_images (menu_id, image_url, display_order) VALUES (?, ?, ?)');
        uploadedUrls.forEach((url, idx) => {
            stmt.run(id, url, idx + 1);
        });
    } else {
        db.prepare('UPDATE weekly_menus SET title=?, description=?, embed_url=?, is_current=? WHERE id=?').run(title, description || '', embed_url, is_current, id);
    }

    revalidatePath('/');
    revalidatePath('/admin/dashboard/menu-semaine');
    return { success: true };
}

export async function deleteWeeklyMenu(formData) {
    const id = formData.get('id');
    const db = getDb();
    db.prepare('DELETE FROM weekly_menu_images WHERE menu_id = ?').run(id);
    db.prepare('DELETE FROM weekly_menus WHERE id = ?').run(id);

    revalidatePath('/');
    revalidatePath('/admin/dashboard/menu-semaine');
    return { success: true };
}

// --- GALLERY POSTS ---
export async function addGalleryPost(formData) {
    const title = formData.get('title');
    const caption = formData.get('caption');
    const media_type = formData.get('media_type') || 'image';
    const image_file = formData.get('image_file');
    let image_url = formData.get('image_url');

    const uploadedUrl = await saveUploadedFile(image_file);
    if (uploadedUrl) {
        image_url = uploadedUrl;
    }

    if (!image_url) {
        return { error: 'Un fichier photo ou vidéo est obligatoire.' };
    }

    const db = getDb();
    db.prepare('INSERT INTO gallery_posts (title, caption, image_url, media_type) VALUES (?, ?, ?, ?)').run(title || '', caption || '', image_url, media_type);

    revalidatePath('/');
    revalidatePath('/admin/dashboard/galerie');
    return { success: true };
}

export async function deleteGalleryPost(formData) {
    const id = formData.get('id');
    const db = getDb();
    db.prepare('DELETE FROM gallery_posts WHERE id = ?').run(id);

    revalidatePath('/');
    revalidatePath('/admin/dashboard/galerie');
    return { success: true };
}

// --- CAROUSEL ---
export async function addCarouselImage(formData) {
    const title = formData.get('title');
    const subtitle = formData.get('subtitle');
    const image_file = formData.get('image_file');
    let image_url = formData.get('image_url');

    const uploadedUrl = await saveUploadedFile(image_file);
    if (uploadedUrl) {
        image_url = uploadedUrl;
    }

    const db = getDb();
    db.prepare('INSERT INTO carousel_images (title, subtitle, image_url) VALUES (?, ?, ?)').run(title, subtitle, image_url || '');

    revalidatePath('/');
    revalidatePath('/admin/dashboard/carousel');
    return { success: true };
}

export async function deleteCarouselImage(formData) {
    const id = formData.get('id');
    const db = getDb();
    db.prepare('DELETE FROM carousel_images WHERE id = ?').run(id);

    revalidatePath('/');
    revalidatePath('/admin/dashboard/carousel');
    return { success: true };
}

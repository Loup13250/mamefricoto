'use server';

import { getDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';

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
            maxAge: 60 * 60 * 24, // 1 day
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
    const filename = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    // Ensure uploads directory exists
    try {
        await fs.access(uploadsDir);
    } catch {
        await fs.mkdir(uploadsDir, { recursive: true });
    }

    const filepath = path.join(uploadsDir, filename);
    await fs.writeFile(filepath, buffer);
    return '/uploads/' + filename;
}

// --- SETTINGS ---
export async function updateSiteInfo(formData) {
    const db = getDb();

    const entries = Array.from(formData.entries());
    for (const [key, value] of entries) {
        if (key.startsWith('$ACTION')) continue;
        db.prepare('INSERT INTO site_info (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, value);
    }

    revalidatePath('/');
    revalidatePath('/contact');
    revalidatePath('/a-propos');
    revalidatePath('/admin/dashboard/settings');
    return { success: true };
}

// --- WEEKLY MENU ---
export async function addWeeklyMenu(formData) {
    const title = formData.get('title');
    const description = formData.get('description');
    const image_file = formData.get('image_file');
    let image_url = formData.get('image_url');
    const is_current = formData.get('is_current') === 'on' ? 1 : 0;

    const uploadedUrl = await saveUploadedFile(image_file);
    if (uploadedUrl) {
        image_url = uploadedUrl;
    }

    const db = getDb();

    // If this menu is current, unset all others
    if (is_current) {
        db.prepare('UPDATE weekly_menus SET is_current = 0').run();
    }

    db.prepare('INSERT INTO weekly_menus (title, description, image_url, is_current) VALUES (?, ?, ?, ?)').run(title, description || '', image_url || '', is_current);

    revalidatePath('/');
    revalidatePath('/admin/dashboard/menu-semaine');
    return { success: true };
}

export async function editWeeklyMenu(formData) {
    const id = formData.get('id');
    const title = formData.get('title');
    const description = formData.get('description');
    const image_file = formData.get('image_file');
    let image_url = formData.get('image_url');
    const is_current = formData.get('is_current') === 'on' ? 1 : 0;

    const uploadedUrl = await saveUploadedFile(image_file);
    if (uploadedUrl) {
        image_url = uploadedUrl;
    }

    const db = getDb();

    // If setting as current, unset all others
    if (is_current) {
        db.prepare('UPDATE weekly_menus SET is_current = 0').run();
    }

    if (image_url) {
        db.prepare('UPDATE weekly_menus SET title=?, description=?, image_url=?, is_current=? WHERE id=?').run(title, description || '', image_url, is_current, id);
    } else {
        db.prepare('UPDATE weekly_menus SET title=?, description=?, is_current=? WHERE id=?').run(title, description || '', is_current, id);
    }

    revalidatePath('/');
    revalidatePath('/admin/dashboard/menu-semaine');
    return { success: true };
}

export async function deleteWeeklyMenu(formData) {
    const id = formData.get('id');
    const db = getDb();
    db.prepare('DELETE FROM weekly_menus WHERE id = ?').run(id);

    revalidatePath('/');
    revalidatePath('/admin/dashboard/menu-semaine');
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

// --- ARTICLES ---
export async function addArticle(formData) {
    const title = formData.get('title');
    const content = formData.get('content');
    const image_file = formData.get('image_file');
    let image_url = formData.get('image_url');

    const uploadedUrl = await saveUploadedFile(image_file);
    if (uploadedUrl) {
        image_url = uploadedUrl;
    }

    const db = getDb();
    db.prepare('INSERT INTO articles (title, content, image_url) VALUES (?, ?, ?)').run(title, content, image_url || null);

    revalidatePath('/');
    revalidatePath('/admin/dashboard/articles');
    return { success: true };
}

export async function editArticle(formData) {
    const id = formData.get('id');
    const title = formData.get('title');
    const content = formData.get('content');
    const image_file = formData.get('image_file');
    let image_url = formData.get('image_url');

    const uploadedUrl = await saveUploadedFile(image_file);
    if (uploadedUrl) {
        image_url = uploadedUrl;
    }

    const db = getDb();
    if (image_url) {
        db.prepare('UPDATE articles SET title=?, content=?, image_url=? WHERE id=?').run(title, content, image_url, id);
    } else {
        db.prepare('UPDATE articles SET title=?, content=? WHERE id=?').run(title, content, id);
    }

    revalidatePath('/');
    revalidatePath('/admin/dashboard/articles');
    return { success: true };
}

export async function deleteArticle(formData) {
    const id = formData.get('id');
    const db = getDb();
    db.prepare('DELETE FROM articles WHERE id = ?').run(id);

    revalidatePath('/');
    revalidatePath('/admin/dashboard/articles');
    return { success: true };
}

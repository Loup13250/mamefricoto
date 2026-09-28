import { getDb } from '../src/lib/db.js';

async function seed() {
    const db = getDb();
    console.log('Seeding bilingual content...');

    // 1. site_info
    const siteInfoUpdates = [
        ['tagline_en', 'Homemade cuisine · Delivery · Pick-up'],
        ['hours_en', 'Monday to Friday — Orders before 10 AM'],
        ['address_en', 'Eyguières, Bouches-du-Rhône, France'],
        ['about_text_en', 'Mamé Fricoto is all about generous, authentic homemade cuisine prepared in Eyguières. Every week, we offer fresh seasonal menus, slow-cooked daily specials, and custom catering for your private events and cocktail receptions.'],
        ['site_icon', '/icon.svg'],
    ];

    for (const [k, v] of siteInfoUpdates) {
        await db.prepare('INSERT INTO site_info (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(k, v);
    }

    // 2. services
    await db.prepare('UPDATE services SET title_en = ?, description_en = ?, badge_en = ? WHERE num = ? OR id = ?').run(
        'Homemade Takeaway Meals',
        'Every week, discover our selection of traditional homemade dishes, crafted with fresh local ingredients.',
        'Weekly',
        '01', 1
    );
    await db.prepare('UPDATE services SET title_en = ?, description_en = ?, badge_en = ? WHERE num = ? OR id = ?').run(
        'Private Events',
        'Birthdays, christenings, family gatherings... We craft tailor-made menus to suit your desires and guests.',
        'Tailor-made',
        '02', 2
    );
    await db.prepare('UPDATE services SET title_en = ?, description_en = ?, badge_en = ? WHERE num = ? OR id = ?').run(
        'Corporate Catering',
        'Gourmet meal trays, team lunches, and seminars. A flavorful solution for your corporate events.',
        'Corporate',
        '03', 3
    );
    await db.prepare('UPDATE services SET title_en = ?, description_en = ?, badge_en = ? WHERE num = ? OR id = ?').run(
        'Cocktail Buffets',
        'Elegant dishes presented as a buffet for your cocktail parties and receptions.',
        'Cocktails',
        '04', 4
    );

    // 3. carousel_images
    await db.prepare('UPDATE carousel_images SET title_en = ?, subtitle_en = ? WHERE id = ?').run(
        'Homemade Daily Specials',
        'A new slow-cooked dish every day crafted with fresh market produce · Eyguières',
        1
    );
    await db.prepare('UPDATE carousel_images SET title_en = ?, subtitle_en = ? WHERE id = ?').run(
        'Cocktail Buffets & Receptions',
        'Refined bites, verrines, and sweet delicacies for your festive evenings and parties',
        2
    );
    await db.prepare('UPDATE carousel_images SET title_en = ?, subtitle_en = ? WHERE id = ?').run(
        'Tailored Private Events',
        'Birthdays, christenings, family reunions — an exceptional bespoke menu',
        3
    );
    await db.prepare('UPDATE carousel_images SET title_en = ?, subtitle_en = ? WHERE id = ?').run(
        'Corporate Lunches & Seminars',
        'Complete meal trays and team lunches delivered directly to your premises',
        4
    );

    // 4. weekly_menus
    await db.prepare('UPDATE weekly_menus SET title_en = ?, description_en = ? WHERE id = ?').run(
        'Menu from July 15 to 18',
        'Discover Mamé Fricoto weekly menu: Eggplant & tomato tatin, Lemon cake, Chorizo saffron rice, Lentil salad, Cold tortilla...',
        1
    );
    await db.prepare('UPDATE weekly_menus SET title_en = ?, description_en = ? WHERE id = ?').run(
        'Weekly Menu — September',
        'Orders by phone before 10 AM. Fresh homemade dishes crafted with seasonal ingredients.',
        2
    );

    // 5. gallery_posts
    await db.prepare('UPDATE gallery_posts SET title_en = ?, caption_en = ? WHERE id = ?').run(
        'Dessert Preparation',
        'Every morning, our homemade pastries are crafted with love in our kitchen in Eyguières.',
        1
    );
    await db.prepare('UPDATE gallery_posts SET title_en = ?, caption_en = ? WHERE id = ?').run(
        'Cocktail Buffet',
        'Assortment of savory bites, Provençal navettes, and fresh verrines for a birthday party.',
        2
    );
    await db.prepare('UPDATE gallery_posts SET title_en = ?, caption_en = ? WHERE id = ?').run(
        "Chef's Stew",
        'Our daily specials simmer gently from dawn to guarantee rich flavors and authenticity.',
        3
    );

    console.log('Database successfully seeded with bilingual content!');
}

seed().catch(console.error);

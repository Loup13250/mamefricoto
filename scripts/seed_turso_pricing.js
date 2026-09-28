import fs from 'fs';
import path from 'path';

// Parse .env.local manually
try {
    const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const idx = trimmed.indexOf('=');
            if (idx !== -1) {
                const key = trimmed.slice(0, idx).trim();
                const val = trimmed.slice(idx + 1).trim();
                if (!process.env[key]) {
                    process.env[key] = val;
                }
            }
        }
    });
} catch (err) {
    console.warn('Could not read .env.local:', err.message);
}

const { getDb } = await import('../src/lib/db.js');

async function seed() {
    console.log('Seeding pricing tables into active DB (Turso / SQLite)...');
    console.log('TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL ? 'PRESENT' : 'NOT SET');
    const db = getDb();

    // Ensure tables exist
    await db.exec(`
        CREATE TABLE IF NOT EXISTS pricing_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            title_en TEXT,
            description TEXT,
            description_en TEXT,
            file_url TEXT NOT NULL,
            file_url_en TEXT,
            file_type TEXT DEFAULT 'image',
            display_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS fixed_prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT DEFAULT 'Repas',
            category_en TEXT DEFAULT 'Meals',
            name TEXT NOT NULL,
            name_en TEXT,
            price TEXT NOT NULL,
            price_en TEXT,
            details TEXT,
            details_en TEXT,
            badge TEXT,
            badge_en TEXT,
            display_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Check fixed_prices
    const priceCountRow = await db.prepare('SELECT COUNT(*) as count FROM fixed_prices').get();
    const countPrices = priceCountRow ? priceCountRow.count : 0;
    console.log('Current fixed_prices count in DB:', countPrices);

    if (countPrices === 0) {
        console.log('Inserting initial fixed meal prices...');
        const stmt = db.prepare(`
            INSERT INTO fixed_prices (name, name_en, price, price_en, details, details_en, badge, badge_en, category, category_en, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        await stmt.run(
            'Plat du Jour Maison',
            'Daily Homemade Special',
            '11,50 €',
            '€11.50',
            'Cuisiné chaque matin avec des produits frais du marché. Plats traditionnels mijotés avec amour.',
            'Cooked every morning with fresh market ingredients. Traditional dishes made with love.',
            'Quotidien',
            'Daily',
            'Repas du Midi',
            'Lunch Menu',
            1
        );

        await stmt.run(
            'Formule Déjeuner (Plat + Dessert)',
            'Lunch Formula (Dish + Dessert)',
            '15,00 €',
            '€15.00',
            'Le plat du jour accompagné d’un dessert maison préparé au labo (tarte, crème, mousse...).',
            'The daily dish served with a homemade dessert made at our lab (tart, cream, mousse...).',
            'Populaire',
            'Popular',
            'Repas du Midi',
            'Lunch Menu',
            2
        );

        await stmt.run(
            'Plateau Repas Entreprise',
            'Corporate Lunch Box',
            '19,50 €',
            '€19.50',
            'Entrée fraîcheur, plat du jour chaud ou froid, dessert gourmand, pain artisanal et couverts.',
            'Fresh starter, warm or cold daily special, gourmet dessert, artisanal bread, and cutlery.',
            'Pro & Réunions',
            'Business',
            'Entreprise',
            'Corporate',
            3
        );

        await stmt.run(
            'Buffet & Cocktail Déjeunatoire',
            'Lunch Cocktail & Buffet',
            'Dès 24,00 € / pers.',
            'From €24.00 / pers.',
            'Assortiment de bouchées salées, salades composées de saison et douceurs sucrées.',
            'Selection of gourmet canapés, seasonal salads, and sweet delicacies.',
            'Sur-mesure',
            'Bespoke',
            'Événements',
            'Events',
            4
        );
        console.log('Fixed prices inserted successfully!');
    }

    // Check pricing_documents
    const docCountRow = await db.prepare('SELECT COUNT(*) as count FROM pricing_documents').get();
    const countDocs = docCountRow ? docCountRow.count : 0;
    console.log('Current pricing_documents count in DB:', countDocs);

    if (countDocs === 0) {
        console.log('Inserting initial pricing document...');
        const stmtDoc = db.prepare(`
            INSERT INTO pricing_documents (title, title_en, description, description_en, file_url, file_url_en, file_type, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        await stmtDoc.run(
            'Carte Traiteur & Tarifs Cocktails 2026',
            'Catering Menu & Cocktail Rates 2026',
            'Consultez nos propositions de pièces cocktail salées et sucrées pour vos événements privés et professionnels.',
            'Discover our sweet and savoury cocktail bite selections for your private and corporate events in Provence.',
            'https://images.unsplash.com/photo-1555244162-803834f70033?q=85&w=1600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1555244162-803834f70033?q=85&w=1600&auto=format&fit=crop',
            'image',
            1
        );
        console.log('Pricing document inserted successfully!');
    }

    console.log('Seeding complete!');
    process.exit(0);
}

seed().catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
});

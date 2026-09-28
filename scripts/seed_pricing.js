import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database', 'mamefricoto.db');
const db = new Database(dbPath);

console.log('Seeding pricing tables in:', dbPath);

// Create tables
db.exec(`
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

// Insert initial fixed prices if empty
const countPrices = db.prepare('SELECT COUNT(*) as count FROM fixed_prices').get();
if (countPrices.count === 0) {
    const insertPrice = db.prepare(`
        INSERT INTO fixed_prices (name, name_en, price, price_en, details, details_en, badge, badge_en, category, category_en, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPrice.run(
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

    insertPrice.run(
        'Formule Complète Midi',
        'Complete Lunch Menu',
        '15,00 €',
        '€15.00',
        'Entrée fraîche de saison + Plat du jour au choix + Dessert gourmand maison fait par Mamé.',
        'Fresh seasonal starter + Daily cooked special + Homemade dessert crafted with passion.',
        'Le Plus Choisi',
        'Best Value',
        'Repas du Midi',
        'Lunch Menu',
        2
    );

    insertPrice.run(
        'Plateau Repas Entreprise',
        'Corporate Meal Tray',
        '19,50 €',
        '€19.50',
        'Plateau complet froid ou chaud servi avec pain artisanal individuel, fromage et dessert fin.',
        'Complete hot or cold meal tray with artisan bread, cheese selection, and fine pastry.',
        'Professionnel',
        'Corporate',
        'Entreprises',
        'Corporate',
        3
    );

    insertPrice.run(
        'Buffet Dînatoire Traiteur',
        'Cocktail Reception Buffet',
        'dès 24,00 € / pers.',
        'from €24.00 / pers.',
        'Assortiment de pièces salées et sucrées créées sur mesure pour vos anniversaires, mariages et fêtes.',
        'Bespoke assortment of savory and sweet catering bites for weddings, birthdays, and private parties.',
        'Sur-mesure',
        'Tailor-made',
        'Événements',
        'Events',
        4
    );

    console.log('Fixed prices seeded successfully.');
}

// Initial pricing document if empty
const countDocs = db.prepare('SELECT COUNT(*) as count FROM pricing_documents').get();
if (countDocs.count === 0) {
    const insertDoc = db.prepare(`
        INSERT INTO pricing_documents (title, title_en, description, description_en, file_url, file_url_en, file_type, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertDoc.run(
        'Carte Complète des Tarifs & Formules',
        'Full Rates & Menus Card',
        'Retrouvez tous nos tarifs détaillés pour les repas du midi, plateaux entreprises et formules réceptions.',
        'Find all our detailed prices for lunch menus, corporate trays, and catering options.',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=90&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=90&w=1600&auto=format&fit=crop',
        'image',
        1
    );

    console.log('Pricing documents seeded successfully.');
}

// Ensure site_info has notes
const setInfo = db.prepare('INSERT OR REPLACE INTO site_info (key, value) VALUES (?, ?)');
setInfo.run('tarifs_note_fr', 'Tous nos tarifs s’entendent TTC. Livraison possible sur Eyguières et les communes environnantes. Menus adaptables selon vos régimes alimentaires (végétarien, sans gluten sur demande).');
setInfo.run('tarifs_note_en', 'All prices include VAT. Delivery available in Eyguières and nearby towns. Dietary adjustments available upon request (vegetarian, gluten-free).');

console.log('Seed completed successfully!');
db.close();

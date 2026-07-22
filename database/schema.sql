CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS site_info (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS weekly_menus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_current BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carousel_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);

-- =====================
-- Initial Data
-- =====================

-- Admin users
INSERT OR IGNORE INTO admin_users (username, password) VALUES ('admin', 'admin123');
INSERT OR IGNORE INTO admin_users (username, password) VALUES ('mamefricoto', 'fricoto2026');

-- Site Info
INSERT OR IGNORE INTO site_info (key, value) VALUES ('phone', '07 43 64 64 11');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('address', 'Eyguières, Bouches-du-Rhône');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('hours', 'Du Lundi au Vendredi — Commandes avant 10h');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('contact_email', 'mamefricoto@gmail.com');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('instagram', 'https://www.instagram.com/mamefricoto/');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('facebook', 'https://www.facebook.com/profile.php?id=61580170212207');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('google_reviews', 'https://www.google.com/search?q=mame+fricoto+avis');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('about_text', 'Mamé Fricoto, c''est l''histoire d''une passionnée de cuisine qui a décidé de partager ses recettes maison avec vous. Depuis son labo à domicile à Eyguières, elle prépare chaque semaine des plats mijotés avec amour, des recettes de grand-mère revisitées et des saveurs du terroir provençal. Livraison et retrait disponibles.');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('tagline', 'Cuisine maison · Livraison · Retrait');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('services_title', 'Nos Prestations');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('services_text', 'Que ce soit pour vos repas du quotidien ou vos événements spéciaux, Mamé Fricoto s''adapte à vos envies.');

-- Weekly Menu example
INSERT INTO weekly_menus (title, description, image_url, is_current) VALUES
  ('Menu du 21 au 25 Juillet', 'Cette semaine, Mamé vous propose : Salade niçoise maison, Poulet rôti aux herbes de Provence, Ratatouille du jardin, Tarte aux abricots du verger. Commandez avant 10h pour une livraison le jour même !', '/uploads/menu-placeholder.jpg', 1);

-- Articles
DELETE FROM articles;
INSERT INTO articles (title, content, image_url) VALUES
  ('Nouveau : Buffets Dînatoires !', 'Mamé Fricoto lance sa formule buffet dînatoire pour vos soirées entre amis, anniversaires ou événements d''entreprise. Des mets raffinés, préparés avec des produits frais et locaux, directement livrés chez vous. Contactez-nous pour un devis personnalisé !', 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&auto=format&fit=crop'),
  ('Les Plats de l''Été sont arrivés !', 'Avec les beaux jours, Mamé Fricoto vous propose une carte estivale pleine de fraîcheur : gaspacho maison, salades composées généreuses, grillades marinées et desserts aux fruits de saison. Régalez-vous tout l''été avec des plats légers et savoureux !', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop');

-- Carousel
DELETE FROM carousel_images;
INSERT INTO carousel_images (id, title, subtitle, image_url, display_order) VALUES
  (1, 'Cuisine Maison avec Amour', 'Des plats faits maison, livrés chez vous à Eyguières et alentours.', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=2070&auto=format&fit=crop', 1),
  (2, 'Chaque Semaine, un Nouveau Menu', 'Découvrez nos créations de la semaine, préparées avec des produits frais et locaux.', 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=2070&auto=format&fit=crop', 2),
  (3, 'Événements & Réceptions', 'Buffets dînatoires, repas d''entreprise, événements privés — on s''occupe de tout.', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop', 3);

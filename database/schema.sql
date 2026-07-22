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

CREATE TABLE IF NOT EXISTS weekly_menu_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  FOREIGN KEY(menu_id) REFERENCES weekly_menus(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  event_type TEXT,
  event_date TEXT,
  guests TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gallery_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  caption TEXT,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
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

INSERT OR IGNORE INTO admin_users (username, password) VALUES ('admin', 'admin123');
INSERT OR IGNORE INTO admin_users (username, password) VALUES ('mamefricoto', 'fricoto2026');

INSERT OR IGNORE INTO site_info (key, value) VALUES ('phone', '07 43 64 64 11');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('address', 'Eyguières, Bouches-du-Rhône');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('hours', 'Du Lundi au Vendredi — Commandes avant 10h');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('contact_email', 'mamefricoto@gmail.com');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('smtp_host', '');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('smtp_port', '587');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('smtp_user', '');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('smtp_pass', '');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('instagram', 'https://www.instagram.com/mamefricoto/');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('facebook', 'https://www.facebook.com/profile.php?id=61580170212207');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('google_reviews', 'https://www.google.com/search?q=mame+fricoto+avis');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('about_text', 'Mamé Fricoto, c''est l''histoire d''une passionnée de cuisine qui a décidé de partager ses recettes maison avec vous. Depuis son labo à domicile à Eyguières, elle prépare chaque semaine des plats mijotés avec amour, des recettes de grand-mère revisitées et des saveurs du terroir provençal. Livraison et retrait disponibles.');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('about_image', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=800&auto=format&fit=crop');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('tagline', 'Cuisine maison · Livraison · Retrait');

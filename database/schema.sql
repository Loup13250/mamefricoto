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
  embed_url TEXT,
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
  media_type TEXT DEFAULT 'image',
  display_order INTEGER DEFAULT 0,
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
INSERT OR IGNORE INTO site_info (key, value) VALUES ('instagram', 'https://www.instagram.com/mamefricoto/');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('facebook', 'https://www.facebook.com/profile.php?id=61580170212207');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('google_reviews', 'https://www.google.com/search?sca_esv=75280e57e4653e14&sxsrf=APpeQnskTs4Q-BjHwFVcRhpy87X3LrM0lw:1784762242148&si=APenkKm7iecQ4G6P-TsbSMFKIQtv3EFIqRAFw-i8uEbk55Z-__cmZA_YJXAM1QWtLJ-URJEQSHho-3NjILZNFLc-8Wkq8P8VEuhf5VCOGV6sxoLACXWMYt6l5OqxmHDPORYF3ZRPFIUf&q=Mam%C3%A9+Fricoto+Avis&sa=X&ved=2ahUKEwi9ls67teeVAxVdkWoFHVscFt4Q0bkNegQIOBAH&biw=1920&bih=945&dpr=1');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('about_text', 'Mamé Fricoto, c''est une cuisine familiale et généreuse préparée à Eyguières. Chaque semaine, nous proposons des menus frais de saison, des plats du jour mijotés, ainsi que des prestations sur mesure pour vos événements et buffets dînatoires.');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('about_image', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=800&auto=format&fit=crop');
INSERT OR IGNORE INTO site_info (key, value) VALUES ('tagline', 'Cuisine maison · Livraison · Retrait');

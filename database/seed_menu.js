const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(process.cwd(), 'database', 'mamefricoto.db'));

// Make sure tables exist
const schema = `
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
CREATE TABLE IF NOT EXISTS gallery_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  caption TEXT,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;
db.exec(schema);

db.prepare('DELETE FROM weekly_menu_images').run();
db.prepare('DELETE FROM weekly_menus').run();

const res = db.prepare(`
  INSERT INTO weekly_menus (title, description, image_url, is_current)
  VALUES ('Menu du 15 au 18 Juillet', 'Découvrez le menu de la semaine de Mamé Fricoto : Tarte tatin aubergines & tomates, Cake au citron, Riz safran chorizo, Salade de lentilles, Tortilla froide... Feuilletez les images pour découvrir les plats, les tarifs et les allergènes !', '/uploads/insta-menu-1.png', 1)
`).run();

const menuId = res.lastInsertRowid;
const images = [
  '/uploads/insta-menu-1.png',
  '/uploads/insta-menu-2.png',
  '/uploads/insta-menu-3.png',
  '/uploads/insta-menu-4.png',
  '/uploads/insta-menu-5.png'
];

const stmt = db.prepare('INSERT INTO weekly_menu_images (menu_id, image_url, display_order) VALUES (?, ?, ?)');
images.forEach((img, idx) => stmt.run(menuId, img, idx + 1));

// Also seed gallery posts (Instagram Stories/dishes)
db.prepare('DELETE FROM gallery_posts').run();
const galleryStmt = db.prepare('INSERT INTO gallery_posts (title, caption, image_url, display_order) VALUES (?, ?, ?, ?)');
galleryStmt.run('Menu de la semaine', 'Formule complète & plats faits maison', '/uploads/insta-menu-1.png', 1);
galleryStmt.run('Les plats du jour', 'Riz safran, salade de lentilles, tortilla', '/uploads/insta-menu-2.png', 2);
galleryStmt.run('Les formules & tarifs', 'Plat seul 12€, Formule 15€/18€', '/uploads/insta-menu-3.png', 3);
galleryStmt.run('En cuisine avec Mamé', 'Labo à domicile à Eyguières', '/uploads/insta-menu-5.png', 4);

console.log('Seeded real Instagram menu carousel and gallery successfully!');

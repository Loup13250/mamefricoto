import { getDb } from './db';

/**
 * Enregistre une entrée dans le journal d'activité (Audit Logs).
 * 
 * @param {Object} entry
 * @param {string} entry.action - Code action (ex: 'add', 'update', 'delete', 'toggle', 'reorder')
 * @param {string} entry.category - Catégorie métier (ex: 'Galerie', 'Menu Semaine', 'Bannière', 'Logo & Paramètres', 'Tarifs', 'À Propos', 'Textes')
 * @param {string} entry.summary - Résumé en français clair et explicite (ex: "Suppression de la photo 'Paëlla'")
 * @param {Object|string|null} [entry.details] - Informations complémentaires ou objet JSON
 * @param {string} [entry.username] - Identifiant de l'auteur (défaut: 'Admin')
 * @param {string|null} [entry.ip] - Adresse IP du client (utile pour les connexions)
 */
export async function logActivity({ action, category, summary, details = null, username = 'Admin', ip = null }) {
    try {
        const db = getDb();
        const detailsStr = details && typeof details === 'object'
            ? JSON.stringify(details, null, 2)
            : (details ? String(details) : null);

        const nowIso = new Date().toISOString();
        await db.prepare(`
            INSERT INTO activity_logs (created_at, action, category, summary, details, username, ip)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(nowIso, action, category, summary, detailsStr, username, ip);
    } catch (err) {
        console.error('[logActivity Error]:', err);
    }
}

/**
 * Récupère les logs d'activité récents, triés du plus récent au plus ancien.
 * 
 * @param {number} [limit=150]
 * @returns {Promise<Array>}
 */
export async function getActivityLogs(limit = 150) {
    try {
        const db = getDb();
        const rows = await db.prepare(`
            SELECT id, created_at, action, category, summary, details, username, ip
            FROM activity_logs
            ORDER BY created_at DESC, id DESC
            LIMIT ?
        `).all(limit);
        return rows || [];
    } catch (err) {
        console.error('[getActivityLogs Error]:', err);
        return [];
    }
}

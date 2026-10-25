'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Trash2, Download, RefreshCw, X, ChevronDown, ChevronRight } from 'lucide-react';
import { clearActivityLogs } from '@/app/actions';

const TZ = 'Europe/Paris';

function parseDate(dateStr) {
    if (!dateStr) return null;
    const s = String(dateStr);
    const d = new Date(s.endsWith('Z') || s.includes('+') ? s : s.replace(' ', 'T') + 'Z');
    return isNaN(d.getTime()) ? null : d;
}

/** Clé de jour (AAAA-MM-JJ) calculée dans le fuseau de Paris */
function dayKeyOf(date) {
    return date ? date.toLocaleDateString('en-CA', { timeZone: TZ }) : 'unknown';
}

function formatRelativeTime(dateString) {
    const date = parseDate(dateString);
    if (!date) return '';
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 15) return "À l'instant";
    if (diff < 60) return `Il y a ${diff} s`;
    const min = Math.floor(diff / 60);
    if (min < 60) return `Il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `Il y a ${h} h`;
    const d = Math.floor(h / 24);
    if (d === 1) return 'Hier';
    if (d < 7) return `Il y a ${d} jours`;
    return date.toLocaleDateString('fr-FR', { timeZone: TZ, day: 'numeric', month: 'short' });
}

function formatDayTitle(date) {
    if (!date) return 'Date inconnue';
    const key = dayKeyOf(date);
    const today = dayKeyOf(new Date());
    const yesterday = dayKeyOf(new Date(Date.now() - 86400000));
    const long = date.toLocaleDateString('fr-FR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const cap = long.charAt(0).toUpperCase() + long.slice(1);
    if (key === today) return `Aujourd'hui, ${long}`;
    if (key === yesterday) return `Hier, ${long}`;
    return cap;
}

function formatTime(date) {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatFullStamp(date) {
    if (!date) return '';
    return date.toLocaleString('fr-FR', { timeZone: TZ, dateStyle: 'full', timeStyle: 'medium' });
}

const KINDS = {
    add: { label: 'Ajout', color: '#3F7A55' },
    update: { label: 'Modification', color: '#8A6420' },
    delete: { label: 'Suppression', color: '#B5502F' },
    toggle: { label: 'Affichage', color: '#6B5E8C' },
    reorder: { label: 'Ordre', color: '#6B5E8C' },
    restore: { label: 'Restauration', color: '#6B5E8C' },
    login: { label: 'Connexion', color: '#3F7A55' },
    logout: { label: 'Déconnexion', color: '#7A6F63' },
    login_failed: { label: 'Échec de connexion', color: '#B5502F' },
    security: { label: 'Accès bloqué', color: '#B5502F' },
};

function kindOf(action) {
    const a = (action || '').toLowerCase();
    if (a === 'create') return KINDS.add;
    if (a === 'edit') return KINDS.update;
    if (a === 'remove') return KINDS.delete;
    return KINDS[a] || KINDS.update;
}

function groupOf(action) {
    const a = (action || '').toLowerCase();
    if (a === 'add' || a === 'create') return 'add';
    if (a === 'delete' || a === 'remove') return 'delete';
    if (['login', 'logout', 'login_failed', 'security'].includes(a)) return 'access';
    return 'update';
}

export default function LogsClient({ initialLogs = [] }) {
    const router = useRouter();
    const logs = initialLogs;
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('ALL');
    const [kind, setKind] = useState('ALL');
    const [expanded, setExpanded] = useState(() => new Set());
    const [refreshing, setRefreshing] = useState(false);
    const [clearing, startClear] = useTransition();

    const categories = useMemo(
        () => Array.from(new Set(logs.map(l => l.category).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'fr')),
        [logs]
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return logs.filter(l => {
            if (category !== 'ALL' && l.category !== category) return false;
            if (kind !== 'ALL' && groupOf(l.action) !== kind) return false;
            if (!q) return true;
            return [l.summary, l.category, l.action, l.username, l.details, l.ip]
                .some(v => (v || '').toLowerCase().includes(q));
        });
    }, [logs, category, kind, search]);

    const days = useMemo(() => {
        const out = [];
        let current = null;
        filtered.forEach(log => {
            const date = parseDate(log.created_at);
            const key = dayKeyOf(date);
            if (!current || current.key !== key) {
                current = { key, title: formatDayTitle(date), items: [] };
                out.push(current);
            }
            current.items.push({ log, date });
        });
        return out;
    }, [filtered]);

    const stats = useMemo(() => {
        const s = { total: logs.length, changes: 0, deletes: 0, access: 0 };
        logs.forEach(l => {
            const g = groupOf(l.action);
            if (g === 'delete') s.deletes++;
            else if (g === 'access') s.access++;
            else s.changes++;
        });
        return s;
    }, [logs]);

    const lastDate = parseDate(logs[0]?.created_at);
    const hasFilters = search || category !== 'ALL' || kind !== 'ALL';

    const toggle = id => setExpanded(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    const refresh = () => {
        setRefreshing(true);
        router.refresh();
        setTimeout(() => setRefreshing(false), 600);
    };

    const clearAll = () => {
        if (!confirm("Réinitialiser tout le journal d'activité ?\nCette opération est définitive ; elle sera elle-même consignée.")) return;
        startClear(async () => {
            const res = await clearActivityLogs();
            if (res?.error) alert(res.error);
            else router.refresh();
        });
    };

    const exportJson = () => {
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mamefricoto-journal-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="anim-fade" style={{ width: '100%', maxWidth: '1120px' }}>
            {/* En-tête */}
            <header style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem',
                paddingBottom: '1.5rem', borderBottom: '1px solid var(--admin-border)',
            }}>
                <div>
                    <span style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--admin-gold-dark)' }}>
                        Traçabilité
                    </span>
                    <h1 style={{ fontSize: '2.4rem', lineHeight: 1.05, margin: 0, color: 'var(--admin-text)' }}>
                        Journal d&apos;activité
                    </h1>
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.93rem', margin: '0.6rem 0 0', maxWidth: '620px', lineHeight: 1.55 }}>
                        Chaque modification du site et chaque connexion à l&apos;administration, avec la date, l&apos;heure exacte (heure de Paris) et son auteur.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button type="button" className="admin-btn admin-btn-secondary" onClick={refresh} disabled={refreshing}>
                        <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} /> Actualiser
                    </button>
                    <button type="button" className="admin-btn admin-btn-secondary" onClick={exportJson} disabled={logs.length === 0}>
                        <Download size={14} /> Exporter
                    </button>
                    <button type="button" className="admin-btn admin-btn-danger" onClick={clearAll} disabled={clearing || logs.length === 0}>
                        <Trash2 size={14} /> {clearing ? 'Nettoyage…' : 'Vider'}
                    </button>
                </div>
            </header>

            {/* Chiffres clés */}
            <div className="admin-card admin-stat-strip">
                <div className="admin-stat">
                    <span className="admin-stat-label">Événements</span>
                    <span className="admin-stat-value">{stats.total}</span>
                    <span className="admin-stat-note">{lastDate ? `Dernier : ${formatRelativeTime(logs[0].created_at)}` : 'Aucun pour le moment'}</span>
                </div>
                <div className="admin-stat">
                    <span className="admin-stat-label">Ajouts &amp; modifications</span>
                    <span className="admin-stat-value">{stats.changes}</span>
                    <span className="admin-stat-note">Contenus publiés ou mis à jour</span>
                </div>
                <div className="admin-stat">
                    <span className="admin-stat-label">Suppressions</span>
                    <span className="admin-stat-value">{stats.deletes}</span>
                    <span className="admin-stat-note">Éléments retirés du site</span>
                </div>
                <div className="admin-stat">
                    <span className="admin-stat-label">Connexions</span>
                    <span className="admin-stat-value">{stats.access}</span>
                    <span className="admin-stat-note">Entrées, sorties et échecs</span>
                </div>
            </div>

            {/* Filtres */}
            <div className="admin-card" style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) auto auto', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-subtle)' }} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher (menu, logo, adresse IP, identifiant…)"
                            className="admin-input"
                            style={{ paddingLeft: '36px', height: '40px' }}
                        />
                        {search && (
                            <button type="button" onClick={() => setSearch('')} aria-label="Effacer la recherche"
                                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--admin-text-subtle)', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="admin-select" style={{ height: '40px', minWidth: '180px' }}>
                        <option value="ALL">Toutes les sections</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={kind} onChange={e => setKind(e.target.value)} className="admin-select" style={{ height: '40px', minWidth: '170px' }}>
                        <option value="ALL">Tous les types</option>
                        <option value="add">Ajouts</option>
                        <option value="update">Modifications</option>
                        <option value="delete">Suppressions</option>
                        <option value="access">Connexions et sécurité</option>
                    </select>
                </div>
                {hasFilters && (
                    <div style={{ marginTop: '0.8rem', paddingTop: '0.7rem', borderTop: '1px solid var(--admin-border-soft)', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                        <span><strong>{filtered.length}</strong> résultat{filtered.length > 1 ? 's' : ''}</span>
                        <button type="button" className="admin-link-btn" onClick={() => { setSearch(''); setCategory('ALL'); setKind('ALL'); }}>
                            Réinitialiser les filtres
                        </button>
                    </div>
                )}
            </div>

            {/* Chronologie */}
            {days.length === 0 ? (
                <div className="admin-card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
                    <h2 style={{ fontSize: '1.6rem', margin: '0 0 0.4rem', color: 'var(--admin-text)' }}>Rien à afficher</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)', maxWidth: '440px', margin: '0 auto', lineHeight: 1.55 }}>
                        {hasFilters
                            ? 'Aucun événement ne correspond à ces critères.'
                            : "Les modifications et connexions apparaîtront ici dès qu'elles auront lieu."}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem' }}>
                    {days.map(day => (
                        <section key={day.key}>
                            <div className="admin-log-day">
                                <h2>{day.title}</h2>
                                <span>{day.items.length} événement{day.items.length > 1 ? 's' : ''}</span>
                            </div>
                            <div className="admin-log-list">
                                {day.items.map(({ log, date }) => {
                                    const k = kindOf(log.action);
                                    const open = expanded.has(log.id);
                                    return (
                                        <div key={log.id} className="admin-log-row">
                                            <div className="admin-log-time" title={formatFullStamp(date)}>
                                                {formatTime(date)}
                                                <span className="admin-log-ago">{formatRelativeTime(log.created_at)}</span>
                                            </div>

                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                    <span className="admin-log-kind" style={{ color: k.color }}>{k.label}</span>
                                                    <span className="admin-log-cat">{log.category}</span>
                                                </div>
                                                <div className="admin-log-summary">{log.summary}</div>
                                                {open && log.details && (
                                                    <pre className="admin-log-details" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '0.7rem 0 0' }}>{log.details}</pre>
                                                )}
                                            </div>

                                            <div className="admin-log-meta">
                                                <div>{log.username || 'Admin'}</div>
                                                {log.ip && <div style={{ fontVariantNumeric: 'tabular-nums' }}>{log.ip}</div>}
                                                {log.details && (
                                                    <button type="button" className="admin-link-btn" style={{ marginTop: '0.3rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }} onClick={() => toggle(log.id)}>
                                                        {open ? 'Masquer' : 'Détails'}
                                                        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}

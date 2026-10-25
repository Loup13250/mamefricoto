'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Trash2, Download, RefreshCw, X, ChevronDown, ChevronRight, Calendar, Clock } from 'lucide-react';
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

function isInPeriod(date, periodKey, todayKey) {
    if (!date) return false;
    if (periodKey === 'all') return true;
    if (periodKey === 'today') return dayKeyOf(date) === todayKey;
    const now = Date.now();
    const time = date.getTime();
    if (periodKey === '7d') return time >= now - 7 * 86400000;
    if (periodKey === '30d') return time >= now - 30 * 86400000;
    return true;
}

const PERIOD_LABELS = {
    today: "Aujourd'hui",
    '7d': '7 derniers jours',
    '30d': '30 derniers jours',
    all: "Tout l'historique",
};

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
    const [period, setPeriod] = useState('30d');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('ALL');
    const [kind, setKind] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('');
    const [expanded, setExpanded] = useState(() => new Set());
    const [refreshing, setRefreshing] = useState(false);
    const [clearing, startClear] = useTransition();

    const todayKey = dayKeyOf(new Date());
    const yesterdayKey = dayKeyOf(new Date(Date.now() - 86400000));

    const categories = useMemo(
        () => Array.from(new Set(logs.map(l => l.category).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'fr')),
        [logs]
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return logs.filter(l => {
            const d = parseDate(l.created_at);
            const dayKey = dayKeyOf(d);

            if (dateFilter && dayKey !== dateFilter) return false;
            if (category !== 'ALL' && l.category !== category) return false;
            if (kind !== 'ALL' && groupOf(l.action) !== kind) return false;

            // Si aucune recherche libre ni date précise n'est active, on applique la période (30 jours par défaut)
            if (!dateFilter && !q && !isInPeriod(d, period, todayKey)) return false;

            if (!q) return true;

            const dateShort = d ? d.toLocaleDateString('fr-FR', { timeZone: TZ }) : '';
            const dateLong = d ? d.toLocaleDateString('fr-FR', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' }) : '';
            const weekday = d ? d.toLocaleDateString('fr-FR', { timeZone: TZ, weekday: 'long' }) : '';

            return [l.summary, l.category, l.action, l.username, l.details, l.ip, dayKey, dateShort, dateLong, weekday]
                .some(v => (v || '').toLowerCase().includes(q));
        });
    }, [logs, category, kind, search, dateFilter, period, todayKey]);

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

    const periodLogs = useMemo(() => {
        return logs.filter(l => isInPeriod(parseDate(l.created_at), period, todayKey));
    }, [logs, period, todayKey]);

    const stats = useMemo(() => {
        const s = { total: periodLogs.length, changes: 0, deletes: 0, access: 0 };
        periodLogs.forEach(l => {
            const g = groupOf(l.action);
            if (g === 'delete') s.deletes++;
            else if (g === 'access') s.access++;
            else s.changes++;
        });
        return s;
    }, [periodLogs]);

    const lastPeriodDate = periodLogs[0] ? parseDate(periodLogs[0].created_at) : null;
    const hasFilters = Boolean(search || category !== 'ALL' || kind !== 'ALL' || dateFilter || period !== '30d');

    const resetFilters = () => {
        setSearch('');
        setCategory('ALL');
        setKind('ALL');
        setDateFilter('');
        setPeriod('30d');
    };

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

            {/* Sélecteur de période pour les chiffres clés */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '0.85rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'var(--admin-text-subtle)'
                    }}>
                        Période des chiffres clés
                    </span>
                    <span style={{
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: 'var(--admin-surface-hover)',
                        color: 'var(--admin-gold-dark)',
                        border: '1px solid var(--admin-border-soft)',
                        fontWeight: 600
                    }}>
                        {PERIOD_LABELS[period]}
                    </span>
                </div>

                <div style={{
                    display: 'inline-flex',
                    background: 'var(--admin-surface-hover)',
                    padding: '3px',
                    borderRadius: '8px',
                    border: '1px solid var(--admin-border)',
                    gap: '2px',
                    maxWidth: '100%',
                    overflowX: 'auto'
                }}>
                    <button
                        type="button"
                        onClick={() => setPeriod('today')}
                        style={{
                            border: 'none',
                            background: period === 'today' ? 'var(--admin-surface)' : 'transparent',
                            color: period === 'today' ? 'var(--admin-text)' : 'var(--admin-text-muted)',
                            boxShadow: period === 'today' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                            borderRadius: '6px',
                            padding: '4px 11px',
                            fontSize: '0.78rem',
                            fontWeight: period === 'today' ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Aujourd&apos;hui
                    </button>
                    <button
                        type="button"
                        onClick={() => setPeriod('7d')}
                        style={{
                            border: 'none',
                            background: period === '7d' ? 'var(--admin-surface)' : 'transparent',
                            color: period === '7d' ? 'var(--admin-text)' : 'var(--admin-text-muted)',
                            boxShadow: period === '7d' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                            borderRadius: '6px',
                            padding: '4px 11px',
                            fontSize: '0.78rem',
                            fontWeight: period === '7d' ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        7 jours
                    </button>
                    <button
                        type="button"
                        onClick={() => setPeriod('30d')}
                        style={{
                            border: 'none',
                            background: period === '30d' ? 'var(--admin-surface)' : 'transparent',
                            color: period === '30d' ? 'var(--admin-text)' : 'var(--admin-text-muted)',
                            boxShadow: period === '30d' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                            borderRadius: '6px',
                            padding: '4px 11px',
                            fontSize: '0.78rem',
                            fontWeight: period === '30d' ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        30 jours (défaut)
                    </button>
                    <button
                        type="button"
                        onClick={() => setPeriod('all')}
                        style={{
                            border: 'none',
                            background: period === 'all' ? 'var(--admin-surface)' : 'transparent',
                            color: period === 'all' ? 'var(--admin-text)' : 'var(--admin-text-muted)',
                            boxShadow: period === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                            borderRadius: '6px',
                            padding: '4px 11px',
                            fontSize: '0.78rem',
                            fontWeight: period === 'all' ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Tout l&apos;historique
                    </button>
                </div>
            </div>

            {/* Chiffres clés */}
            <div className="admin-card admin-stat-strip">
                <div className="admin-stat">
                    <span className="admin-stat-label">
                        Événements {period === '30d' ? '(30j)' : period === '7d' ? '(7j)' : period === 'today' ? '(jour)' : ''}
                    </span>
                    <span className="admin-stat-value">{stats.total}</span>
                    <span className="admin-stat-note">
                        {lastPeriodDate ? `Dernier : ${formatRelativeTime(lastPeriodDate.toISOString())}` : 'Aucun sur la période'}
                    </span>
                </div>
                <div className="admin-stat">
                    <span className="admin-stat-label">Ajouts &amp; modifications</span>
                    <span className="admin-stat-value">{stats.changes}</span>
                    <span className="admin-stat-note">
                        {period === 'all' ? 'Contenus publiés ou mis à jour' : `Sur ${PERIOD_LABELS[period].toLowerCase()}`}
                    </span>
                </div>
                <div className="admin-stat">
                    <span className="admin-stat-label">Suppressions</span>
                    <span className="admin-stat-value">{stats.deletes}</span>
                    <span className="admin-stat-note">
                        {period === 'all' ? 'Éléments retirés du site' : `Sur ${PERIOD_LABELS[period].toLowerCase()}`}
                    </span>
                </div>
                <div className="admin-stat">
                    <span className="admin-stat-label">Connexions</span>
                    <span className="admin-stat-value">{stats.access}</span>
                    <span className="admin-stat-note">
                        {period === 'all' ? 'Entrées, sorties et échecs' : `Sur ${PERIOD_LABELS[period].toLowerCase()}`}
                    </span>
                </div>
            </div>

            {/* Filtres */}
            <div className="admin-card" style={{ padding: '1.1rem 1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.4fr) auto auto auto', gap: '0.75rem', alignItems: 'center' }}>
                    {/* Recherche texte & date */}
                    <div style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-subtle)' }} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher (mot-clé, date 25/10, IP, admin…)"
                            className="admin-input"
                            style={{ paddingLeft: '36px' }}
                        />
                        {search && (
                            <button type="button" onClick={() => setSearch('')} aria-label="Effacer la recherche"
                                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--admin-text-subtle)', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Sélecteur de date calendaire */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Calendar size={14} style={{ position: 'absolute', left: '10px', color: 'var(--admin-text-subtle)', pointerEvents: 'none' }} />
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={e => setDateFilter(e.target.value)}
                            className="admin-input"
                            style={{ paddingLeft: '32px', paddingRight: dateFilter ? '28px' : '10px', fontSize: '0.85rem', minWidth: '150px' }}
                            title="Filtrer par date précise"
                        />
                        {dateFilter && (
                            <button
                                type="button"
                                onClick={() => setDateFilter('')}
                                aria-label="Effacer le filtre par date"
                                style={{ position: 'absolute', right: '6px', background: 'none', border: 'none', color: 'var(--admin-text-subtle)', cursor: 'pointer', padding: '3px', display: 'flex' }}
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* Section */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="admin-select"
                            style={{ minWidth: '165px', paddingRight: '32px', backgroundImage: 'none', cursor: 'pointer' }}
                        >
                            <option value="ALL">Toutes les sections</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown size={15} style={{ position: 'absolute', right: '11px', color: 'var(--admin-gold)', pointerEvents: 'none' }} />
                    </div>

                    {/* Type d'action */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <select
                            value={kind}
                            onChange={e => setKind(e.target.value)}
                            className="admin-select"
                            style={{ minWidth: '155px', paddingRight: '32px', backgroundImage: 'none', cursor: 'pointer' }}
                        >
                            <option value="ALL">Tous les types</option>
                            <option value="add">Ajouts</option>
                            <option value="update">Modifications</option>
                            <option value="delete">Suppressions</option>
                            <option value="access">Connexions</option>
                        </select>
                        <ChevronDown size={15} style={{ position: 'absolute', right: '11px', color: 'var(--admin-gold)', pointerEvents: 'none' }} />
                    </div>
                </div>

                {/* Raccourcis date rapides & récapitulatif */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.75rem', paddingTop: '0.7rem', borderTop: '1px solid var(--admin-border-soft)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--admin-text-subtle)', fontWeight: 600, marginRight: '4px' }}>Date rapide :</span>
                        <button
                            type="button"
                            onClick={() => setDateFilter('')}
                            style={{
                                border: '1px solid var(--admin-border)',
                                background: !dateFilter ? 'var(--admin-surface-hover)' : 'transparent',
                                color: !dateFilter ? 'var(--admin-text)' : 'var(--admin-text-muted)',
                                padding: '3px 9px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: !dateFilter ? 700 : 500
                            }}
                        >
                            Toutes
                        </button>
                        <button
                            type="button"
                            onClick={() => setDateFilter(todayKey)}
                            style={{
                                border: '1px solid var(--admin-border)',
                                background: dateFilter === todayKey ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                                color: dateFilter === todayKey ? '#2563EB' : 'var(--admin-text-muted)',
                                borderColor: dateFilter === todayKey ? 'rgba(37, 99, 235, 0.4)' : 'var(--admin-border)',
                                padding: '3px 9px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: dateFilter === todayKey ? 700 : 500
                            }}
                        >
                            Aujourd&apos;hui
                        </button>
                        <button
                            type="button"
                            onClick={() => setDateFilter(yesterdayKey)}
                            style={{
                                border: '1px solid var(--admin-border)',
                                background: dateFilter === yesterdayKey ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                                color: dateFilter === yesterdayKey ? '#2563EB' : 'var(--admin-text-muted)',
                                borderColor: dateFilter === yesterdayKey ? 'rgba(37, 99, 235, 0.4)' : 'var(--admin-border)',
                                padding: '3px 9px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: dateFilter === yesterdayKey ? 700 : 500
                            }}
                        >
                            Hier
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                        <span><strong>{filtered.length}</strong> résultat{filtered.length > 1 ? 's' : ''}</span>
                        {hasFilters && (
                            <button
                                type="button"
                                className="admin-link-btn"
                                onClick={resetFilters}
                            >
                                Réinitialiser les filtres
                            </button>
                        )}
                    </div>
                </div>
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

                    {/* Bannière d'accès à l'historique complet */}
                    {period !== 'all' && !search && !dateFilter && logs.length > filtered.length && (
                        <div style={{
                            textAlign: 'center',
                            padding: '1.75rem 1.5rem',
                            background: 'var(--admin-surface)',
                            border: '1px dashed var(--admin-border)',
                            borderRadius: 'var(--admin-radius-sm)',
                            marginTop: '0.5rem'
                        }}>
                            <p style={{ margin: '0 0 0.6rem', fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>
                                Affichage concentré sur <strong>{PERIOD_LABELS[period].toLowerCase()}</strong> pour garder des chiffres clairs et lisibles.
                            </p>
                            <button
                                type="button"
                                className="admin-btn admin-btn-secondary"
                                onClick={() => setPeriod('all')}
                                style={{ fontSize: '0.82rem' }}
                            >
                                Afficher tout l&apos;historique
                            </button>
                        </div>
                    )}

                    {period === 'all' && logs.length > 25 && (
                        <div style={{
                            textAlign: 'center',
                            padding: '1.25rem',
                            color: 'var(--admin-text-subtle)',
                            fontSize: '0.82rem',
                            marginTop: '0.5rem'
                        }}>
                            <span>Fin de l&apos;historique complet.</span>
                            {' '}
                            <button
                                type="button"
                                className="admin-link-btn"
                                onClick={() => setPeriod('30d')}
                                style={{ marginLeft: '0.5rem', textDecoration: 'underline' }}
                            >
                                Revenir aux 30 derniers jours
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

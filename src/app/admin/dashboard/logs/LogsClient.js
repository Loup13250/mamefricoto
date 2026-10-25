'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
    History, Search, Trash2, Download, RefreshCw, 
    PlusCircle, Edit3, CheckCircle2, ChevronDown, 
    ChevronRight, User, Calendar, Clock, Sparkles, 
    X, FileText, ArrowUpDown, ShieldCheck, Check
} from 'lucide-react';
import { clearActivityLogs } from '@/app/actions';

function parseDate(dateStr) {
    if (!dateStr) return null;
    const s = String(dateStr);
    return new Date(s.endsWith('Z') ? s : s.replace(' ', 'T') + 'Z');
}

function formatRelativeTime(dateString) {
    const date = parseDate(dateString);
    if (!date || isNaN(date.getTime())) return '';
    try {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 15) return "À l'instant";
        if (diffInSeconds < 60) return `Il y a ${diffInSeconds} s`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `Il y a ${diffInHours} h`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays === 1) return 'Hier';
        if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
        return date.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'short' });
    } catch {
        return dateString;
    }
}

function formatFrenchDay(dateString) {
    const date = parseDate(dateString);
    if (!date || isNaN(date.getTime())) return 'Date inconnue';
    try {
        const now = new Date();
        const isToday = now.toDateString() === date.toDateString();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const isYesterday = yesterday.toDateString() === date.toDateString();

        const formatted = date.toLocaleDateString('fr-FR', {
            timeZone: 'Europe/Paris',
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        if (isToday) return `Aujourd'hui — ${formatted.charAt(0).toUpperCase() + formatted.slice(1)}`;
        if (isYesterday) return `Hier — ${formatted.charAt(0).toUpperCase() + formatted.slice(1)}`;
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
        return dateString;
    }
}

function formatFrenchTime(dateString) {
    const date = parseDate(dateString);
    if (!date || isNaN(date.getTime())) return '--:--:--';
    try {
        return date.toLocaleTimeString('fr-FR', {
            timeZone: 'Europe/Paris',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch {
        return '';
    }
}

function getActionMeta(action) {
    const act = (action || '').toLowerCase();
    if (act === 'add' || act === 'create') {
        return {
            label: 'Ajout',
            color: '#059669',
            bg: 'rgba(5, 150, 105, 0.08)',
            border: 'rgba(5, 150, 105, 0.2)',
            icon: PlusCircle
        };
    }
    if (act === 'delete' || act === 'remove') {
        return {
            label: 'Suppression',
            color: '#DC2626',
            bg: 'rgba(220, 38, 38, 0.08)',
            border: 'rgba(220, 38, 38, 0.2)',
            icon: Trash2
        };
    }
    if (act === 'toggle' || act === 'reorder') {
        return {
            label: 'Ordre / Affichage',
            color: '#D97706',
            bg: 'rgba(217, 119, 6, 0.08)',
            border: 'rgba(217, 119, 6, 0.2)',
            icon: ArrowUpDown
        };
    }
    if (act === 'restore') {
        return {
            label: 'Restauration',
            color: '#7C3AED',
            bg: 'rgba(124, 58, 237, 0.08)',
            border: 'rgba(124, 58, 237, 0.2)',
            icon: Sparkles
        };
    }
    return {
        label: 'Modification',
        color: '#0284C7',
        bg: 'rgba(2, 132, 199, 0.08)',
        border: 'rgba(2, 132, 199, 0.2)',
        icon: Edit3
    };
}

export default function LogsClient({ initialLogs = [] }) {
    const router = useRouter();
    const [logs, setLogs] = useState(initialLogs);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedAction, setSelectedAction] = useState('ALL');
    const [expandedIds, setExpandedIds] = useState(new Set());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isClearing, startClearTransition] = useTransition();

    // Catégories uniques
    const categories = useMemo(() => {
        const set = new Set();
        logs.forEach(l => {
            if (l.category) set.add(l.category);
        });
        return Array.from(set).sort();
    }, [logs]);

    // Filtrage
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            if (selectedCategory !== 'ALL' && log.category !== selectedCategory) {
                return false;
            }
            if (selectedAction !== 'ALL') {
                const act = (log.action || '').toLowerCase();
                if (selectedAction === 'add' && act !== 'add' && act !== 'create') return false;
                if (selectedAction === 'update' && act !== 'update' && act !== 'edit') return false;
                if (selectedAction === 'delete' && act !== 'delete' && act !== 'remove') return false;
                if (selectedAction === 'other' && ['add', 'create', 'update', 'edit', 'delete', 'remove'].includes(act)) return false;
            }
            if (search.trim()) {
                const q = search.toLowerCase();
                const matchSummary = (log.summary || '').toLowerCase().includes(q);
                const matchCategory = (log.category || '').toLowerCase().includes(q);
                const matchAction = (log.action || '').toLowerCase().includes(q);
                const matchUser = (log.username || '').toLowerCase().includes(q);
                const matchDetails = (log.details || '').toLowerCase().includes(q);
                if (!matchSummary && !matchCategory && !matchAction && !matchUser && !matchDetails) {
                    return false;
                }
            }
            return true;
        });
    }, [logs, selectedCategory, selectedAction, search]);

    // Groupement par jour pour une chronologie douce et claire
    const groupedByDay = useMemo(() => {
        const groups = [];
        let currentDay = null;
        let currentGroup = null;

        filteredLogs.forEach(log => {
            const date = parseDate(log.created_at);
            const dayKey = date ? date.toISOString().slice(0, 10) : 'unknown';

            if (dayKey !== currentDay) {
                currentDay = dayKey;
                currentGroup = {
                    dayKey,
                    dayTitle: formatFrenchDay(log.created_at),
                    logs: [log]
                };
                groups.push(currentGroup);
            } else if (currentGroup) {
                currentGroup.logs.push(log);
            }
        });

        return groups;
    }, [filteredLogs]);

    // Statistiques rapides
    const stats = useMemo(() => {
        let addCount = 0;
        let updateCount = 0;
        let deleteCount = 0;

        logs.forEach(l => {
            const act = (l.action || '').toLowerCase();
            if (act === 'add' || act === 'create') addCount++;
            else if (act === 'delete' || act === 'remove') deleteCount++;
            else updateCount++;
        });

        return {
            total: logs.length,
            addCount,
            updateCount,
            deleteCount,
            lastDate: logs[0]?.created_at || null,
        };
    }, [logs]);

    const toggleExpand = (id) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        router.refresh();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const handleClear = () => {
        if (!confirm("Voulez-vous réinitialiser l'historique complet du journal d'activité ?\nCette opération est définitive et sera elle-même consignée.")) {
            return;
        }
        startClearTransition(async () => {
            const res = await clearActivityLogs();
            if (res?.error) {
                alert(res.error);
            } else {
                router.refresh();
            }
        });
    };

    const handleExportJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `mamefricoto-journal-activite-${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    return (
        <div className="anim-fade" style={{ width: '100%', maxWidth: '1160px', margin: '0 auto' }}>
            
            {/* EN-TÊTE PRINCIPAL */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1.25rem',
                marginBottom: '2rem'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '3px 10px',
                            background: 'rgba(5, 150, 105, 0.08)',
                            borderRadius: '16px',
                            fontSize: '0.74rem',
                            fontWeight: '600',
                            color: '#059669'
                        }}>
                            <ShieldCheck size={13} /> Traçabilité &amp; Historique
                        </span>
                    </div>
                    <h1 style={{ fontSize: '1.65rem', fontWeight: '700', color: 'var(--admin-text)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <History size={24} style={{ color: 'var(--admin-gold)' }} /> Journal des Modifications
                    </h1>
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.92rem', maxWidth: '640px', lineHeight: '1.5' }}>
                        Suivi en direct avec date et heure précise de tous les changements effectués sur le site (menus, carrousel, galerie, tarifs, logo et textes).
                    </p>
                </div>

                {/* Actions globales douces */}
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="admin-btn admin-btn-secondary"
                        disabled={isRefreshing}
                        title="Actualiser la liste"
                    >
                        <RefreshCw size={15} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
                        Actualiser
                    </button>
                    <button
                        type="button"
                        onClick={handleExportJSON}
                        className="admin-btn admin-btn-secondary"
                        disabled={logs.length === 0}
                        title="Télécharger l'historique complet"
                    >
                        <Download size={15} />
                        Exporter
                    </button>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="admin-btn"
                        disabled={isClearing || logs.length === 0}
                        title="Vider l'historique"
                        style={{
                            background: 'rgba(220, 38, 38, 0.06)',
                            border: '1px solid rgba(220, 38, 38, 0.18)',
                            color: '#dc2626'
                        }}
                    >
                        <Trash2 size={15} />
                        {isClearing ? 'Nettoyage...' : 'Vider'}
                    </button>
                </div>
            </div>

            {/* KPI STATS CARDS DOUCES */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                marginBottom: '1.75rem'
            }}>
                {/* Total */}
                <div className="admin-card" style={{ padding: '1.25rem 1.4rem', borderRadius: '16px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--admin-text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                        Total Événements
                    </span>
                    <div style={{ fontSize: '1.85rem', fontWeight: '750', color: 'var(--admin-text)', lineHeight: '1.1' }}>
                        {stats.total}
                    </div>
                    <span style={{ fontSize: '0.76rem', color: 'var(--admin-text-subtle)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.45rem' }}>
                        <Clock size={12} /> {stats.lastDate ? `Dernier : ${formatRelativeTime(stats.lastDate)}` : 'Aucun événement'}
                    </span>
                </div>

                {/* Ajouts */}
                <div className="admin-card" style={{ padding: '1.25rem 1.4rem', borderRadius: '16px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '600', color: '#059669', display: 'block', marginBottom: '0.35rem' }}>
                        Ajouts / Créations
                    </span>
                    <div style={{ fontSize: '1.85rem', fontWeight: '750', color: '#059669', lineHeight: '1.1' }}>
                        {stats.addCount}
                    </div>
                    <span style={{ fontSize: '0.76rem', color: 'var(--admin-text-subtle)', marginTop: '0.45rem', display: 'block' }}>
                        Photos, menus et tarifs créés
                    </span>
                </div>

                {/* Modifications */}
                <div className="admin-card" style={{ padding: '1.25rem 1.4rem', borderRadius: '16px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '600', color: '#0284C7', display: 'block', marginBottom: '0.35rem' }}>
                        Modifications
                    </span>
                    <div style={{ fontSize: '1.85rem', fontWeight: '750', color: '#0284C7', lineHeight: '1.1' }}>
                        {stats.updateCount}
                    </div>
                    <span style={{ fontSize: '0.76rem', color: 'var(--admin-text-subtle)', marginTop: '0.45rem', display: 'block' }}>
                        Textes, coordonnées &amp; réglages
                    </span>
                </div>

                {/* Suppressions */}
                <div className="admin-card" style={{ padding: '1.25rem 1.4rem', borderRadius: '16px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '600', color: '#DC2626', display: 'block', marginBottom: '0.35rem' }}>
                        Suppressions
                    </span>
                    <div style={{ fontSize: '1.85rem', fontWeight: '750', color: '#DC2626', lineHeight: '1.1' }}>
                        {stats.deleteCount}
                    </div>
                    <span style={{ fontSize: '0.76rem', color: 'var(--admin-text-subtle)', marginTop: '0.45rem', display: 'block' }}>
                        Éléments retirés du site
                    </span>
                </div>
            </div>

            {/* FILTRES & RECHERCHE DOUCE */}
            <div className="admin-card" style={{ padding: '1.25rem 1.4rem', borderRadius: '16px', marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.85rem', alignItems: 'center' }}>
                    {/* Recherche texte */}
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-subtle)' }} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher par mot-clé (ex : Paëlla, Menu, Téléphone, Logo...)"
                            className="admin-input"
                            style={{ paddingLeft: '36px', height: '40px', fontSize: '0.88rem' }}
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--admin-text-subtle)', cursor: 'pointer', padding: '4px' }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Filtre Catégorie */}
                    <div style={{ minWidth: '180px' }}>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="admin-select"
                            style={{ height: '40px', fontSize: '0.85rem' }}
                        >
                            <option value="ALL">Toutes les sections ({logs.length})</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtre Type d'action */}
                    <div style={{ minWidth: '160px' }}>
                        <select
                            value={selectedAction}
                            onChange={(e) => setSelectedAction(e.target.value)}
                            className="admin-select"
                            style={{ height: '40px', fontSize: '0.85rem' }}
                        >
                            <option value="ALL">Toutes les actions</option>
                            <option value="add">Ajouts uniquement</option>
                            <option value="update">Modifications uniquement</option>
                            <option value="delete">Suppressions uniquement</option>
                            <option value="other">Autres (ordre, visibilité)</option>
                        </select>
                    </div>
                </div>

                {/* État des filtres */}
                {(search || selectedCategory !== 'ALL' || selectedAction !== 'ALL') && (
                    <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--admin-border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                        <span>
                            <strong>{filteredLogs.length}</strong> modification(s) trouvée(s)
                        </span>
                        <button
                            type="button"
                            onClick={() => { setSearch(''); setSelectedCategory('ALL'); setSelectedAction('ALL'); }}
                            style={{ background: 'none', border: 'none', color: 'var(--admin-gold)', cursor: 'pointer', fontWeight: '550', textDecoration: 'underline' }}
                        >
                            Réinitialiser les filtres
                        </button>
                    </div>
                )}
            </div>

            {/* TIMELINE DES ÉVÉNEMENTS GROUPÉS PAR JOUR */}
            {groupedByDay.length === 0 ? (
                <div className="admin-card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--admin-text-muted)', borderRadius: '16px' }}>
                    <div style={{ width: '52px', height: '52px', margin: '0 auto 1.25rem', borderRadius: '50%', background: 'rgba(184, 139, 70, 0.1)', color: 'var(--admin-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <History size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.08rem', fontWeight: '650', color: 'var(--admin-text)', marginBottom: '0.35rem' }}>
                        Aucune modification trouvée
                    </h3>
                    <p style={{ fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto', lineHeight: '1.5' }}>
                        {search || selectedCategory !== 'ALL' || selectedAction !== 'ALL'
                            ? "Aucun événement ne correspond à vos critères de recherche."
                            : "Les modifications apportées au site s'afficheront ici en temps réel avec date et heure détaillées."}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {groupedByDay.map(group => (
                        <div key={group.dayKey}>
                            
                            {/* Séparateur de jour doux */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.85rem',
                                paddingLeft: '0.25rem'
                            }}>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    background: 'rgba(184, 139, 70, 0.08)',
                                    border: '1px solid var(--admin-border-soft)',
                                    fontSize: '0.82rem',
                                    fontWeight: '600',
                                    color: 'var(--admin-text)'
                                }}>
                                    <Calendar size={13} style={{ color: 'var(--admin-gold)' }} />
                                    {group.dayTitle}
                                </div>
                                <div style={{ height: '1px', flex: 1, background: 'var(--admin-border-soft)' }} />
                                <span style={{ fontSize: '0.74rem', color: 'var(--admin-text-subtle)' }}>
                                    {group.logs.length} modification{group.logs.length > 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Liste des logs pour ce jour */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                {group.logs.map(log => {
                                    const meta = getActionMeta(log.action);
                                    const isExpanded = expandedIds.has(log.id);
                                    const hasDetails = Boolean(log.details);
                                    const timeStr = formatFrenchTime(log.created_at);
                                    const relativeStr = formatRelativeTime(log.created_at);

                                    return (
                                        <div
                                            key={log.id}
                                            className="admin-card"
                                            style={{
                                                padding: '1rem 1.35rem',
                                                borderRadius: '14px',
                                                marginBottom: 0,
                                                border: '1px solid var(--admin-border-soft)',
                                                background: isExpanded ? 'rgba(184, 139, 70, 0.03)' : 'var(--admin-card-bg)',
                                                transition: 'background 0.2s ease, border-color 0.2s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                                
                                                {/* BLOC GAUCHE : Heure précise + Badges + Résumé clair */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '300px' }}>
                                                    
                                                    {/* HEURE EXACTE ET RELATIVE BIEN MISE EN VALEUR */}
                                                    <div style={{
                                                        minWidth: '100px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'flex-start',
                                                        flexShrink: 0
                                                    }}>
                                                        <div style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.35rem',
                                                            fontFamily: 'monospace',
                                                            fontSize: '0.92rem',
                                                            fontWeight: '700',
                                                            color: 'var(--admin-text)',
                                                            letterSpacing: '0.02em'
                                                        }}>
                                                            <Clock size={13} style={{ color: 'var(--admin-gold)' }} />
                                                            {timeStr}
                                                        </div>
                                                        <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-subtle)', paddingLeft: '1.25rem' }}>
                                                            {relativeStr}
                                                        </span>
                                                    </div>

                                                    {/* Pilules Catégorie & Action douces */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                                                        <span style={{
                                                            fontSize: '0.73rem',
                                                            fontWeight: '600',
                                                            padding: '2px 8px',
                                                            borderRadius: '6px',
                                                            background: meta.bg,
                                                            color: meta.color,
                                                            border: `1px solid ${meta.border}`
                                                        }}>
                                                            {meta.label}
                                                        </span>
                                                        <span style={{
                                                            fontSize: '0.73rem',
                                                            fontWeight: '550',
                                                            padding: '2px 8px',
                                                            borderRadius: '6px',
                                                            background: 'rgba(184, 139, 70, 0.08)',
                                                            color: 'var(--admin-text)',
                                                            border: '1px solid var(--admin-border-soft)'
                                                        }}>
                                                            {log.category}
                                                        </span>
                                                    </div>

                                                    {/* Résumé clair en français */}
                                                    <div style={{
                                                        fontSize: '0.92rem',
                                                        fontWeight: '550',
                                                        color: 'var(--admin-text)',
                                                        lineHeight: '1.4',
                                                        flex: 1
                                                    }}>
                                                        {log.summary}
                                                    </div>
                                                </div>

                                                {/* BLOC DROIT : Auteur + Bouton Détails */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
                                                    <span style={{
                                                        fontSize: '0.74rem',
                                                        color: 'var(--admin-text-subtle)',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.3rem'
                                                    }}>
                                                        <User size={12} /> {log.username || 'Admin'}
                                                    </span>

                                                    {hasDetails && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExpand(log.id)}
                                                            className="admin-btn admin-btn-secondary"
                                                            style={{
                                                                padding: '4px 9px',
                                                                fontSize: '0.76rem',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.3rem',
                                                                borderRadius: '8px'
                                                            }}
                                                            title={isExpanded ? 'Masquer les détails' : 'Afficher les détails de la modification'}
                                                        >
                                                            <FileText size={12} />
                                                            {isExpanded ? 'Masquer' : 'Détails'}
                                                            {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Volet Détails Déroulant doux */}
                                            {isExpanded && hasDetails && (
                                                <div style={{
                                                    marginTop: '0.85rem',
                                                    padding: '0.85rem 1rem',
                                                    background: 'rgba(0, 0, 0, 0.03)',
                                                    border: '1px solid var(--admin-border-soft)',
                                                    borderRadius: '10px',
                                                    fontSize: '0.8rem',
                                                    fontFamily: 'monospace',
                                                    color: 'var(--admin-text)',
                                                    overflowX: 'auto',
                                                    lineHeight: '1.5'
                                                }}>
                                                    <div style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--admin-gold)', marginBottom: '0.35rem', fontFamily: 'inherit' }}>
                                                        Détails techniques enregistrés :
                                                    </div>
                                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'inherit' }}>
                                                        {log.details}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useTransition } from 'react';
import { markMessageRead, deleteMessage, updateMessageStatus, updateMessageNotes } from '@/app/actions';
import { Mail, Phone, Calendar, Users, Trash2, CheckCircle2, Clock, StickyNote, Check, Loader2, Filter, AlertTriangle, AlertCircle } from 'lucide-react';

const STATUS_CONFIG = {
    nouveau: {
        label: 'Nouveau',
        bg: 'rgba(212, 180, 117, 0.15)',
        color: 'var(--admin-gold-dark)',
        border: 'rgba(212, 180, 117, 0.35)',
    },
    en_cours: {
        label: 'En cours',
        bg: 'rgba(59, 130, 246, 0.15)',
        color: '#2563eb',
        border: 'rgba(59, 130, 246, 0.35)',
    },
    effectue: {
        label: 'Effectué',
        bg: 'rgba(34, 197, 94, 0.15)',
        color: '#16a34a',
        border: 'rgba(34, 197, 94, 0.35)',
    },
    annule: {
        label: 'Annulé',
        bg: 'rgba(217, 103, 72, 0.15)',
        color: '#dc2626',
        border: 'rgba(217, 103, 72, 0.35)',
    },
};

function MessageCard({ msg }) {
    const currentStatus = msg.status || (msg.is_read ? 'en_cours' : 'nouveau');
    const [status, setStatus] = useState(currentStatus);
    const [notes, setNotes] = useState(msg.admin_notes || '');
    const [savedNotes, setSavedNotes] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleStatusChange = (newStatus) => {
        setStatus(newStatus);
        startTransition(async () => {
            await updateMessageStatus(msg.id, newStatus);
        });
    };

    const handleSaveNotes = (e) => {
        e.preventDefault();
        startTransition(async () => {
            await updateMessageNotes(msg.id, notes);
            setSavedNotes(true);
            setTimeout(() => setSavedNotes(false), 2000);
        });
    };

    const handleDelete = () => {
        startTransition(async () => {
            await deleteMessage(msg.id);
        });
    };

    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.nouveau;

    return (
        <div
            className="admin-card"
            style={{
                borderLeft: `4px solid ${cfg.color}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
            }}
        >
            {/* Top Bar: Name, Date, Status Pills, Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--admin-border-soft)' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--admin-text)', fontFamily: 'var(--font-heading)' }}>
                            {msg.name}
                        </h2>
                        {/* Status Badge */}
                        <span style={{
                            background: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${cfg.border}`,
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            padding: '3px 10px',
                            borderRadius: '4px',
                        }}>
                            {cfg.label}
                        </span>
                    </div>
                    <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', marginTop: '0.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={13} style={{ color: 'var(--admin-gold)' }} />
                        Reçu le {new Date(msg.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                {/* Status Switcher & Delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {status === 'nouveau' && (
                        <button
                            onClick={() => handleStatusChange('en_cours')}
                            disabled={isPending}
                            className="admin-btn admin-btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                            <Clock size={13} /> Passer en &quot;En cours&quot;
                        </button>
                    )}

                    <select
                        value={status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="admin-select"
                        style={{
                            padding: '6px 12px',
                            fontSize: '0.82rem',
                            fontWeight: '600',
                            background: 'var(--admin-surface)',
                            color: 'var(--admin-text)',
                            border: '1px solid var(--admin-border)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        <option value="nouveau">🔹 Nouveau</option>
                        <option value="en_cours">⏳ En cours</option>
                        <option value="effectue">✅ Effectué (Honoré)</option>
                        <option value="annule">❌ Annulé</option>
                    </select>

                    {deleteConfirm ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                                onClick={handleDelete}
                                disabled={isPending}
                                className="admin-btn admin-btn-danger"
                                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            >
                                {isPending ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : 'Confirmer ?'}
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(false)}
                                className="admin-btn admin-btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                            >
                                Annuler
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setDeleteConfirm(true)}
                            className="admin-btn admin-btn-danger"
                            style={{ padding: '7px 11px' }}
                            title="Supprimer la demande"
                        >
                            <Trash2 size={15} />
                        </button>
                    )}
                </div>
            </div>

            {/* Details Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.25rem',
                background: 'var(--admin-surface)',
                padding: '1.25rem',
                borderRadius: '8px',
                border: '1px solid var(--admin-border-soft)'
            }}>
                <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--admin-gold)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.08em', display: 'block', marginBottom: '0.25rem' }}>Téléphone</span>
                    <a href={`tel:${msg.phone}`} style={{ color: 'var(--admin-text)', fontWeight: '600', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Phone size={14} style={{ color: 'var(--admin-gold)' }} />
                        {msg.phone}
                    </a>
                </div>

                <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--admin-gold)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.08em', display: 'block', marginBottom: '0.25rem' }}>Email</span>
                    <a href={`mailto:${msg.email}`} style={{ color: 'var(--admin-text)', fontWeight: '500', fontSize: '0.92rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', wordBreak: 'break-all' }}>
                        <Mail size={14} style={{ color: 'var(--admin-gold)' }} />
                        {msg.email}
                    </a>
                </div>

                <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--admin-gold)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.08em', display: 'block', marginBottom: '0.25rem' }}>Prestation</span>
                    <span style={{ fontWeight: '600', color: 'var(--admin-text)', fontSize: '0.92rem' }}>{msg.event_type || 'Non précisé'}</span>
                </div>

                {msg.event_date && (
                    <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--admin-gold)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.08em', display: 'block', marginBottom: '0.25rem' }}>Date souhaitée</span>
                        <span style={{ fontWeight: '600', color: 'var(--admin-text)', fontSize: '0.92rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Calendar size={14} style={{ color: 'var(--admin-gold)' }} />
                            {msg.event_date}
                        </span>
                    </div>
                )}

                {msg.guests && (
                    <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--admin-gold)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.08em', display: 'block', marginBottom: '0.25rem' }}>Nombre d&apos;invités</span>
                        <span style={{ fontWeight: '600', color: 'var(--admin-text)', fontSize: '0.92rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Users size={14} style={{ color: 'var(--admin-gold)' }} />
                            {msg.guests}
                        </span>
                    </div>
                )}
            </div>

            {/* User Message Text */}
            <div>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--admin-gold)', display: 'block', marginBottom: '0.5rem' }}>
                    Message du client :
                </span>
                <div style={{
                    color: 'var(--admin-text)',
                    lineHeight: '1.7',
                    fontSize: '0.95rem',
                    whiteSpace: 'pre-wrap',
                    background: 'var(--admin-surface)',
                    padding: '1.25rem',
                    borderRadius: '8px',
                    border: '1px solid var(--admin-border-soft)'
                }}>
                    {msg.message}
                </div>
            </div>

            {/* Internal Admin Note Section */}
            <form onSubmit={handleSaveNotes} style={{ background: 'rgba(200, 169, 110, 0.04)', border: '1px solid var(--admin-border)', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--admin-gold)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <StickyNote size={14} /> Note &amp; Remarque Interne (ex: raison d&apos;annulation, détails devis...)
                    </label>
                    {savedNotes && (
                        <span style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Check size={14} /> Enregistré !
                        </span>
                    )}
                </div>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Écrivez vos notes privées ici (ex: client super sympa, devis 400€ validé, ou raison d'annulation)..."
                    className="admin-textarea"
                    rows="2"
                    style={{ fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '0.75rem' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="admin-btn admin-btn-secondary" disabled={isPending} style={{ fontSize: '0.8rem', padding: '6px 16px' }}>
                        {isPending ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : 'Enregistrer la note'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function MessagesClient({ messages }) {
    const [filter, setFilter] = useState('tous');

    const filteredMessages = messages.filter((msg) => {
        const st = msg.status || (msg.is_read ? 'en_cours' : 'nouveau');
        if (filter === 'tous') return true;
        return st === filter;
    });

    const countNouveau = messages.filter(m => (m.status || (m.is_read ? 'en_cours' : 'nouveau')) === 'nouveau').length;
    const countEnCours = messages.filter(m => (m.status || (m.is_read ? 'en_cours' : 'nouveau')) === 'en_cours').length;
    const countEffectue = messages.filter(m => (m.status || (m.is_read ? 'en_cours' : 'nouveau')) === 'effectue').length;
    const countAnnule = messages.filter(m => (m.status || (m.is_read ? 'en_cours' : 'nouveau')) === 'annule').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            {/* Header */}
            <div style={{ width: '100%', maxWidth: '900px', marginBottom: '2rem' }}>
                <h1 className="admin-page-title">Messages &amp; Demandes de Devis</h1>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.92rem', marginTop: '0.35rem' }}>
                    Gérez les demandes clients, attribuez des statuts de prestation et notez vos remarques internes.
                </p>
            </div>

            {/* Filter Tabs */}
            <div style={{ width: '100%', maxWidth: '900px', marginBottom: '2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                    { id: 'tous', label: `Tous (${messages.length})` },
                    { id: 'nouveau', label: `Nouveaux (${countNouveau})` },
                    { id: 'en_cours', label: `En cours (${countEnCours})` },
                    { id: 'effectue', label: `Effectués (${countEffectue})` },
                    { id: 'annule', label: `Annulés (${countAnnule})` },
                ].map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setFilter(t.id)}
                        className={`admin-btn ${filter === t.id ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                        style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Message List */}
            <div style={{ width: '100%', maxWidth: '900px' }}>
                {filteredMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '8px', color: 'var(--admin-text-muted)' }}>
                        <Mail size={42} style={{ opacity: 0.4, marginBottom: '1rem', color: 'var(--admin-gold)' }} />
                        <p style={{ fontSize: '1rem', fontWeight: '600' }}>Aucun message trouvé dans cette catégorie.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                        {filteredMessages.map((msg) => (
                            <MessageCard key={msg.id} msg={msg} />
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .admin-page-title { font-size: 1.6rem; font-weight: 700; color: var(--admin-text); }
            `}</style>
        </div>
    );
}

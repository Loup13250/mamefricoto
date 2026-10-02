'use client';

import { useState, useRef, useTransition } from 'react';
import { 
    addService, editService, deleteService, reorderService,
    addPricingDocument, editPricingDocument, deletePricingDocument, reorderPricingDocument
} from '@/app/actions';
import { 
    Plus, Trash2, Edit3, X, CheckCircle2, AlertCircle, ArrowUp, ArrowDown, 
    Loader2, FileText, Sparkles, ExternalLink 
} from 'lucide-react';

export default function ServicesClient({ services = [], pricingDocuments = [] }) {
    const [prevServices, setPrevServices] = useState(services);
    const [servicesList, setServicesList] = useState(services);
    if (services !== prevServices) {
        setPrevServices(services);
        setServicesList(services);
    }

    const [prevDocs, setPrevDocs] = useState(pricingDocuments);
    const [docsList, setDocsList] = useState(pricingDocuments);
    if (pricingDocuments !== prevDocs) {
        setPrevDocs(pricingDocuments);
        setDocsList(pricingDocuments);
    }

    const [activeTab, setActiveTab] = useState('docs'); // 'docs' | 'services'
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleteModal, setDeleteModal] = useState(null); // { type, id, title }

    // --- State for Services ---
    const [isAddingService, setIsAddingService] = useState(false);
    const [editingService, setEditingService] = useState(null);

    // --- State for Pricing Documents ---
    const [isAddingDoc, setIsAddingDoc] = useState(false);
    const [editingDoc, setEditingDoc] = useState(null);

    const docFormRef = useRef(null);
    const serviceFormRef = useRef(null);

    const showNotification = (msg, isErr = false) => {
        if (isErr) {
            setError(msg);
            setTimeout(() => setError(''), 4000);
        } else {
            setSuccess(msg);
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    // ==========================================
    // HANDLERS: PRICING DOCUMENTS
    // ==========================================
    const handleAddDoc = (e) => {
        e.preventDefault();
        setError('');
        const formData = new FormData(e.target);
        startTransition(async () => {
            const res = await addPricingDocument(formData);
            if (res?.error) {
                showNotification(res.error, true);
            } else {
                showNotification('Document / Carte de tarifs ajouté(e) avec succès !');
                setIsAddingDoc(false);
                docFormRef.current?.reset();
            }
        });
    };

    const handleEditDoc = (e) => {
        e.preventDefault();
        setError('');
        const formData = new FormData(e.target);
        startTransition(async () => {
            const res = await editPricingDocument(formData);
            if (res?.error) {
                showNotification(res.error, true);
            } else {
                showNotification('Document / Carte de tarifs mis(e) à jour !');
                setEditingDoc(null);
            }
        });
    };

    const handleDeleteDoc = (id) => {
        setDocsList(prev => prev.filter(d => d.id !== id));
        startTransition(async () => {
            const res = await deletePricingDocument(id);
            if (res?.error) {
                showNotification(res.error, true);
            } else {
                showNotification('Document supprimé.');
                setDeleteModal(null);
            }
        });
    };

    const handleReorderDoc = (id, direction) => {
        setDocsList(prev => {
            const idx = prev.findIndex(d => d.id === id);
            if (idx === -1) return prev;
            const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (targetIdx < 0 || targetIdx >= prev.length) return prev;
            const next = [...prev];
            const [moved] = next.splice(idx, 1);
            next.splice(targetIdx, 0, moved);
            return next;
        });
        startTransition(async () => {
            await reorderPricingDocument(id, direction);
        });
    };

    // ==========================================
    // HANDLERS: SERVICES
    // ==========================================
    const handleAddService = (e) => {
        e.preventDefault();
        setError('');
        const formData = new FormData(e.target);
        startTransition(async () => {
            const res = await addService(formData);
            if (res?.error) {
                showNotification(res.error, true);
            } else {
                showNotification('Prestation ajoutée avec succès !');
                setIsAddingService(false);
                serviceFormRef.current?.reset();
            }
        });
    };

    const handleEditService = (e) => {
        e.preventDefault();
        setError('');
        const formData = new FormData(e.target);
        startTransition(async () => {
            const res = await editService(formData);
            if (res?.error) {
                showNotification(res.error, true);
            } else {
                showNotification('Prestation mise à jour !');
                setEditingService(null);
            }
        });
    };

    const handleDeleteService = (id) => {
        setServicesList(prev => prev.filter(s => s.id !== id));
        startTransition(async () => {
            const res = await deleteService(id);
            if (res?.error) {
                showNotification(res.error, true);
            } else {
                showNotification('Prestation supprimée.');
                setDeleteModal(null);
            }
        });
    };

    const handleReorderService = (id, direction) => {
        setServicesList(prev => {
            const idx = prev.findIndex(s => s.id === id);
            if (idx === -1) return prev;
            const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (targetIdx < 0 || targetIdx >= prev.length) return prev;
            const next = [...prev];
            const [moved] = next.splice(idx, 1);
            next.splice(targetIdx, 0, moved);
            return next;
        });
        startTransition(async () => {
            await reorderService(id, direction);
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>

            {/* Header */}
            <div style={{ width: '100%', maxWidth: '850px', marginBottom: '2rem' }}>
                <h1 className="admin-page-title">Tarifs & Prestations</h1>
                <p style={{ color: 'var(--admin-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    Gérez ici vos grilles tarifaires et cartes (PDF ou Images) ainsi que les prestations traiteur présentées sur la page <strong>/tarifs</strong>.
                </p>

                {/* Tabs Navigation (2 Tabs only) */}
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    borderBottom: '1px solid var(--admin-border-soft)',
                    paddingBottom: '0.75rem',
                    flexWrap: 'wrap'
                }}>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('docs'); setIsAddingDoc(false); setEditingDoc(null); }}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.65rem 1.15rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeTab === 'docs' ? 'var(--admin-gold)' : 'var(--admin-surface)',
                            color: activeTab === 'docs' ? '#1a1510' : 'var(--admin-text)',
                            fontWeight: activeTab === 'docs' ? '700' : '500',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <FileText size={16} />
                        Cartes & Documents (PDF / Images)
                        <span style={{
                            padding: '2px 7px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            background: activeTab === 'docs' ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.06)',
                            fontWeight: '700'
                        }}>
                            {docsList.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => { setActiveTab('services'); setIsAddingService(false); setEditingService(null); }}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.65rem 1.15rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeTab === 'services' ? 'var(--admin-gold)' : 'var(--admin-surface)',
                            color: activeTab === 'services' ? '#1a1510' : 'var(--admin-text)',
                            fontWeight: activeTab === 'services' ? '700' : '500',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <Sparkles size={16} />
                        Nos Prestations Traiteur
                        <span style={{
                            padding: '2px 7px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            background: activeTab === 'services' ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.06)',
                            fontWeight: '700'
                        }}>
                            {servicesList.length}
                        </span>
                    </button>
                </div>
            </div>

            {/* Notifications */}
            {success && (
                <div style={{ width: '100%', maxWidth: '850px', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '6px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} /> {success}
                </div>
            )}
            {error && (
                <div style={{ width: '100%', maxWidth: '850px', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 1: CARTES & DOCUMENTS (PDF / IMAGES)                                  */}
            {/* ========================================================================= */}
            {activeTab === 'docs' && (
                <div style={{ width: '100%', maxWidth: '850px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.15rem', color: 'var(--admin-text)', margin: 0 }}>Cartes & Menus à Consulter</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', margin: '4px 0 0' }}>
                                Téléversez vos PDF ou images (JPG, PNG, WEBP) avec version FR et version EN.
                            </p>
                        </div>
                        {!isAddingDoc && !editingDoc && (
                            <button onClick={() => setIsAddingDoc(true)} className="admin-btn admin-btn-primary">
                                <Plus size={16} /> Ajouter une carte / PDF
                            </button>
                        )}
                    </div>

                    {/* Formulaire Ajout Document */}
                    {isAddingDoc && (
                        <div className="admin-card" style={{ marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--admin-border-soft)' }}>
                                <h3 style={{ fontSize: '1.1rem', color: 'var(--admin-text)', margin: 0 }}>Ajouter une Carte ou Document Tarifaire</h3>
                                <button type="button" onClick={() => setIsAddingDoc(false)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-subtle)', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form ref={docFormRef} onSubmit={handleAddDoc} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                    <div>
                                        <label className="admin-label">FR — Titre de la carte / document (Français) *</label>
                                        <input type="text" name="title" required placeholder="Ex: Carte des Buffets & Cocktails 2026" className="admin-input" />
                                    </div>
                                    <div>
                                        <label className="admin-label">EN — Document Title (English)</label>
                                        <input type="text" name="title_en" placeholder="Ex: Catering Menu & Cocktail Rates 2026" className="admin-input" />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                    <div>
                                        <label className="admin-label">FR — Description (Français)</label>
                                        <textarea name="description" rows="2" placeholder="Ex: Détail de nos formules, pièces salées et sucrées..." className="admin-input" />
                                    </div>
                                    <div>
                                        <label className="admin-label">EN — Description (English)</label>
                                        <textarea name="description_en" rows="2" placeholder="Ex: Details of our catering menus and cocktails..." className="admin-input" />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', background: 'var(--admin-surface)', padding: '1rem', borderRadius: '8px' }}>
                                    <div>
                                        <label className="admin-label" style={{ fontWeight: 600 }}>
                                            FR — Fichier Français (PDF, JPG, PNG, WEBP) *
                                        </label>
                                        <input
                                            type="file"
                                            name="file_fr"
                                            required
                                            accept="image/*,application/pdf"
                                            className="admin-input"
                                            style={{ padding: '0.45rem' }}
                                        />
                                        <small style={{ color: 'var(--admin-text-subtle)', display: 'block', marginTop: '4px' }}>
                                            Document PDF ou image haute définition
                                        </small>
                                    </div>
                                    <div>
                                        <label className="admin-label" style={{ fontWeight: 600 }}>
                                            EN — Fichier Anglais (PDF, JPG, PNG, WEBP)
                                        </label>
                                        <input
                                            type="file"
                                            name="file_en"
                                            accept="image/*,application/pdf"
                                            className="admin-input"
                                            style={{ padding: '0.45rem' }}
                                        />
                                        <small style={{ color: 'var(--admin-text-subtle)', display: 'block', marginTop: '4px' }}>
                                            Optionnel (utilise le fichier français si absent)
                                        </small>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                    <button type="button" onClick={() => setIsAddingDoc(false)} className="admin-btn admin-btn-secondary" disabled={isPending}>Annuler</button>
                                    <button type="submit" className="admin-btn admin-btn-primary" disabled={isPending}>
                                        {isPending ? <Loader2 size={16} className="spin" /> : 'Enregistrer le document'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Formulaire Édition Document */}
                    {editingDoc && (
                        <div className="admin-card" style={{ marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--admin-border-soft)' }}>
                                <h3 style={{ fontSize: '1.1rem', color: 'var(--admin-text)', margin: 0 }}>Modifier la Carte / Document</h3>
                                <button type="button" onClick={() => setEditingDoc(null)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-subtle)', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleEditDoc} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <input type="hidden" name="id" value={editingDoc.id} />

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                    <div>
                                        <label className="admin-label">FR — Titre (Français) *</label>
                                        <input type="text" name="title" defaultValue={editingDoc.title || ''} required className="admin-input" />
                                    </div>
                                    <div>
                                        <label className="admin-label">EN — Title (English)</label>
                                        <input type="text" name="title_en" defaultValue={editingDoc.title_en || ''} className="admin-input" />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                    <div>
                                        <label className="admin-label">FR — Description (Français)</label>
                                        <textarea name="description" defaultValue={editingDoc.description || ''} rows="2" className="admin-input" />
                                    </div>
                                    <div>
                                        <label className="admin-label">EN — Description (English)</label>
                                        <textarea name="description_en" defaultValue={editingDoc.description_en || ''} rows="2" className="admin-input" />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', background: 'var(--admin-surface)', padding: '1rem', borderRadius: '8px' }}>
                                    <div>
                                        <label className="admin-label" style={{ fontWeight: 600 }}>
                                            FR — Remplacer le Fichier FR (Optionnel)
                                        </label>
                                        <input
                                            type="file"
                                            name="file_fr"
                                            accept="image/*,application/pdf"
                                            className="admin-input"
                                            style={{ padding: '0.45rem' }}
                                        />
                                        {editingDoc.file_url && (
                                            <div style={{ marginTop: '6px', fontSize: '0.8rem' }}>
                                                <a href={editingDoc.file_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--admin-gold)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <ExternalLink size={12} /> Voir fichier actuel FR
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="admin-label" style={{ fontWeight: 600 }}>
                                            EN — Remplacer le Fichier EN (Optionnel)
                                        </label>
                                        <input
                                            type="file"
                                            name="file_en"
                                            accept="image/*,application/pdf"
                                            className="admin-input"
                                            style={{ padding: '0.45rem' }}
                                        />
                                        {editingDoc.file_url_en && (
                                            <div style={{ marginTop: '6px', fontSize: '0.8rem' }}>
                                                <a href={editingDoc.file_url_en} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--admin-gold)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <ExternalLink size={12} /> Voir fichier actuel EN
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                    <button type="button" onClick={() => setEditingDoc(null)} className="admin-btn admin-btn-secondary" disabled={isPending}>Annuler</button>
                                    <button type="submit" className="admin-btn admin-btn-primary" disabled={isPending}>
                                        {isPending ? <Loader2 size={16} className="spin" /> : 'Enregistrer les modifications'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Liste des Documents */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {docsList.length === 0 ? (
                            <div className="admin-card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--admin-text-muted)' }}>
                                <FileText size={36} style={{ margin: '0 auto 1rem', color: 'var(--admin-gold)', opacity: 0.7 }} />
                                <p>Aucun document ou carte tarifaire n&apos;est enregistré pour le moment.</p>
                                <button onClick={() => setIsAddingDoc(true)} className="admin-btn admin-btn-primary" style={{ marginTop: '1rem' }}>
                                    <Plus size={16} /> Ajouter le premier document
                                </button>
                            </div>
                        ) : (
                            docsList.map((doc, idx) => {
                                const isPdf = doc.file_type === 'pdf' || (doc.file_url && doc.file_url.toLowerCase().endsWith('.pdf'));

                                return (
                                    <div key={doc.id} className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flex: '1 1 300px' }}>
                                            {/* Preview Thumbnail */}
                                            <div style={{
                                                width: '64px',
                                                height: '64px',
                                                borderRadius: '8px',
                                                background: isPdf ? 'rgba(239,68,68,0.12)' : '#1a1510',
                                                border: '1px solid var(--admin-border)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                overflow: 'hidden',
                                                position: 'relative'
                                            }}>
                                                {isPdf ? (
                                                    <FileText size={28} style={{ color: '#ef4444' }} />
                                                ) : (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={doc.file_url}
                                                        alt={doc.title}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                )}
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                                                    <h3 style={{ fontSize: '1.05rem', color: 'var(--admin-text)', margin: 0, fontWeight: '600' }}>
                                                        {doc.title}
                                                    </h3>
                                                    {doc.title_en && (
                                                        <span style={{ fontSize: '0.85rem', color: 'var(--admin-gold)', fontStyle: 'italic' }}>
                                                            EN — {doc.title_en}
                                                        </span>
                                                    )}
                                                    <span style={{
                                                        fontSize: '0.65rem',
                                                        fontWeight: '700',
                                                        textTransform: 'uppercase',
                                                        padding: '2px 8px',
                                                        borderRadius: '3px',
                                                        background: isPdf ? 'rgba(239,68,68,0.15)' : 'rgba(200,169,110,0.15)',
                                                        color: isPdf ? '#dc2626' : 'var(--admin-gold)'
                                                    }}>
                                                        {isPdf ? 'PDF' : 'IMAGE'}
                                                    </span>
                                                </div>

                                                {doc.description && (
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', margin: '0 0 0.5rem', lineHeight: '1.5' }}>
                                                        {doc.description}
                                                    </p>
                                                )}

                                                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--admin-text-subtle)', flexWrap: 'wrap' }}>
                                                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--admin-gold)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                                        <ExternalLink size={12} /> Fichier FR
                                                    </a>
                                                    {doc.file_url_en && (
                                                        <a href={doc.file_url_en} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--admin-gold)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                                            <ExternalLink size={12} /> Fichier EN
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                            <button
                                                type="button"
                                                onClick={() => handleReorderDoc(doc.id, 'up')}
                                                disabled={idx === 0 || isPending}
                                                className="admin-btn-icon"
                                                title="Monter"
                                            >
                                                <ArrowUp size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleReorderDoc(doc.id, 'down')}
                                                disabled={idx === docsList.length - 1 || isPending}
                                                className="admin-btn-icon"
                                                title="Descendre"
                                            >
                                                <ArrowDown size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setEditingDoc(doc); setIsAddingDoc(false); }}
                                                className="admin-btn-icon"
                                                title="Modifier"
                                            >
                                                <Edit3 size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteModal({ type: 'doc', id: doc.id, title: doc.title })}
                                                className="admin-btn-icon"
                                                style={{ color: '#ef4444' }}
                                                title="Supprimer"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: NOS PRESTATIONS TRAITEUR                                          */}
            {/* ========================================================================= */}
            {activeTab === 'services' && (
                <div style={{ width: '100%', maxWidth: '850px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.15rem', color: 'var(--admin-text)', margin: 0 }}>Prestations Traiteur</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', margin: '4px 0 0' }}>
                                Présentation des différents types de prestations traiteur.
                            </p>
                        </div>
                        {!isAddingService && !editingService && (
                            <button onClick={() => setIsAddingService(true)} className="admin-btn admin-btn-primary">
                                <Plus size={16} /> Ajouter une prestation
                            </button>
                        )}
                    </div>

                    {/* Formulaire Ajout Prestation */}
                    {isAddingService && (
                        <div className="admin-card" style={{ marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--admin-border-soft)' }}>
                                <h3 style={{ fontSize: '1.1rem', color: 'var(--admin-text)', margin: 0 }}>Nouvelle prestation (Bilingue FR / EN)</h3>
                                <button type="button" onClick={() => setIsAddingService(false)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-subtle)', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form ref={serviceFormRef} onSubmit={handleAddService} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label className="admin-label">Numéro d&apos;ordre (ex: 01)</label>
                                    <input type="text" name="num" placeholder="01" className="admin-input" style={{ maxWidth: '120px' }} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                    <div>
                                        <label className="admin-label">FR — Badge / Catégorie (Français)</label>
                                        <input type="text" name="badge" placeholder="Ex: Sur-mesure, Pro, Cocktails..." className="admin-input" />
                                    </div>
                                    <div>
                                        <label className="admin-label">EN — Badge / Category (English)</label>
                                        <input type="text" name="badge_en" placeholder="Ex: Tailor-made, Corporate, Cocktails..." className="admin-input" />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                    <div>
                                        <label className="admin-label">FR — Titre de la prestation (Français) *</label>
                                        <input type="text" name="title" required placeholder="Ex: Buffets Dînatoires" className="admin-input" />
                                    </div>
                                    <div>
                                        <label className="admin-label">EN — Service Title (English)</label>
                                        <input type="text" name="title_en" placeholder="Ex: Cocktail Receptions & Buffets" className="admin-input" />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                    <div>
                                        <label className="admin-label">FR — Description détaillée (Français) *</label>
                                        <textarea name="description" required rows="3" placeholder="Description courte et attrayante..." className="admin-input" style={{ lineHeight: '1.6' }} />
                                    </div>
                                    <div>
                                        <label className="admin-label">EN — Detailed Description (English)</label>
                                        <textarea name="description_en" rows="3" placeholder="Appealing short description in English..." className="admin-input" style={{ lineHeight: '1.6' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                    <button type="button" onClick={() => setIsAddingService(false)} className="admin-btn admin-btn-secondary" disabled={isPending}>Annuler</button>
                                    <button type="submit" className="admin-btn admin-btn-primary" disabled={isPending}>
                                        {isPending ? <Loader2 size={16} className="spin" /> : 'Créer la prestation'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Formulaire Édition Prestation */}
                    {editingService && (
                        <div className="admin-card" style={{ marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--admin-border-soft)' }}>
                                <h3 style={{ fontSize: '1.1rem', color: 'var(--admin-text)', margin: 0 }}>Modifier la prestation (Bilingue FR / EN)</h3>
                                <button type="button" onClick={() => setEditingService(null)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-subtle)', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleEditService} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <input type="hidden" name="id" value={editingService.id} />
                                <div>
                                    <label className="admin-label">Numéro d&apos;ordre</label>
                                    <input type="text" name="num" defaultValue={editingService.num || ''} className="admin-input" style={{ maxWidth: '120px' }} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                    <div>
                                        <label className="admin-label">FR — Badge / Catégorie (Français)</label>
                                        <input type="text" name="badge" defaultValue={editingService.badge || ''} className="admin-input" />
                                    </div>
                                    <div>
                                        <label className="admin-label">EN — Badge / Category (English)</label>
                                        <input type="text" name="badge_en" defaultValue={editingService.badge_en || ''} className="admin-input" />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                    <div>
                                        <label className="admin-label">FR — Titre (Français) *</label>
                                        <input type="text" name="title" defaultValue={editingService.title || ''} required className="admin-input" />
                                    </div>
                                    <div>
                                        <label className="admin-label">EN — Title (English)</label>
                                        <input type="text" name="title_en" defaultValue={editingService.title_en || ''} className="admin-input" />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                    <div>
                                        <label className="admin-label">FR — Description (Français) *</label>
                                        <textarea name="description" defaultValue={editingService.description || ''} required rows="3" className="admin-input" style={{ lineHeight: '1.6' }} />
                                    </div>
                                    <div>
                                        <label className="admin-label">EN — Description (English)</label>
                                        <textarea name="description_en" defaultValue={editingService.description_en || ''} rows="3" className="admin-input" style={{ lineHeight: '1.6' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                    <button type="button" onClick={() => setEditingService(null)} className="admin-btn admin-btn-secondary" disabled={isPending}>Annuler</button>
                                    <button type="submit" className="admin-btn admin-btn-primary" disabled={isPending}>
                                        {isPending ? <Loader2 size={16} className="spin" /> : 'Enregistrer les modifications'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Liste des Prestations */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {servicesList.map((s, idx) => (
                            <div key={s.id} className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flex: '1 1 300px' }}>
                                    <div style={{
                                        width: '42px', height: '42px', borderRadius: '6px',
                                        background: 'rgba(200,169,110,0.12)', border: '1px solid var(--admin-border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'var(--admin-gold)', fontWeight: '700', fontSize: '1rem', flexShrink: 0
                                    }}>
                                        {s.num || `0${idx + 1}`}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                                            <h3 style={{ fontSize: '1.05rem', color: 'var(--admin-text)', margin: 0, fontWeight: '600' }}>{s.title}</h3>
                                            {s.title_en && (
                                                <span style={{ fontSize: '0.85rem', color: 'var(--admin-gold)', fontStyle: 'italic' }}>
                                                    EN — {s.title_en}
                                                </span>
                                            )}
                                            {s.badge && (
                                                <span style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '2px 8px', borderRadius: '3px', background: 'rgba(200,169,110,0.15)', color: 'var(--admin-gold)' }}>
                                                    {s.badge}
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', margin: 0, lineHeight: '1.5' }}>
                                            {s.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                    <button
                                        type="button"
                                        onClick={() => handleReorderService(s.id, 'up')}
                                        disabled={idx === 0 || isPending}
                                        className="admin-btn-icon"
                                        title="Monter"
                                    >
                                        <ArrowUp size={15} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleReorderService(s.id, 'down')}
                                        disabled={idx === servicesList.length - 1 || isPending}
                                        className="admin-btn-icon"
                                        title="Descendre"
                                    >
                                        <ArrowDown size={15} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setEditingService(s); setIsAddingService(false); }}
                                        className="admin-btn-icon"
                                        title="Modifier"
                                    >
                                        <Edit3 size={15} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeleteModal({ type: 'service', id: s.id, title: s.title })}
                                        className="admin-btn-icon"
                                        style={{ color: '#ef4444' }}
                                        title="Supprimer"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal de Confirmation de Suppression */}
            {deleteModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1000,
                    background: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div className="admin-card" style={{ maxWidth: '440px', width: '100%', padding: '1.75rem', textAlign: 'center' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'rgba(239,68,68,0.15)',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem'
                        }}>
                            <Trash2 size={24} />
                        </div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--admin-text)' }}>
                            Confirmer la suppression
                        </h3>
                        <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            Êtes-vous sûr de vouloir supprimer &laquo; <strong>{deleteModal.title}</strong> &raquo; ? Cette action est irréversible.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={() => setDeleteModal(null)}
                                className="admin-btn admin-btn-secondary"
                                disabled={isPending}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (deleteModal.type === 'doc') handleDeleteDoc(deleteModal.id);
                                    else if (deleteModal.type === 'service') handleDeleteService(deleteModal.id);
                                }}
                                className="admin-btn admin-btn-danger"
                                style={{ background: '#dc2626', color: '#fff', border: 'none' }}
                                disabled={isPending}
                            >
                                {isPending ? <Loader2 size={16} className="spin" /> : 'Supprimer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

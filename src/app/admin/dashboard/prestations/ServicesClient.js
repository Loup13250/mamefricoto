'use client';
import { useState, useRef, useTransition } from 'react';
import { addService, editService, deleteService, reorderService } from '@/app/actions';
import { Plus, Trash2, Edit3, X, CheckCircle2, AlertCircle, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';

export default function ServicesClient({ services }) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleteId, setDeleteId] = useState(null);
    const formRef = useRef(null);

    const handleAdd = (e) => {
        e.preventDefault();
        setError('');
        const formData = new FormData(e.target);

        startTransition(async () => {
            const res = await addService(formData);
            if (res?.error) {
                setError(res.error);
            } else {
                setSuccess('Prestation ajoutée avec succès !');
                setIsAdding(false);
                formRef.current?.reset();
                setTimeout(() => setSuccess(''), 2000);
            }
        });
    };

    const handleEdit = (e) => {
        e.preventDefault();
        setError('');
        const formData = new FormData(e.target);

        startTransition(async () => {
            const res = await editService(formData);
            if (res?.error) {
                setError(res.error);
            } else {
                setSuccess('Prestation mise à jour !');
                setEditingService(null);
                setTimeout(() => setSuccess(''), 2000);
            }
        });
    };

    const handleDelete = (id) => {
        startTransition(async () => {
            const res = await deleteService(id);
            if (res?.error) {
                setError(res.error);
            } else {
                setSuccess('Prestation supprimée.');
                setDeleteId(null);
                setTimeout(() => setSuccess(''), 2000);
            }
        });
    };

    const handleReorder = (id, direction) => {
        startTransition(async () => {
            await reorderService(id, direction);
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

            {/* Header */}
            <div style={{ width: '100%', maxWidth: '800px', marginBottom: '2.5rem' }}>
                <h1 className="admin-page-title">Nos Prestations</h1>
                <p style={{ color: 'rgba(245,240,232,0.5)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    Gérez les prestations et services qui apparaissent sur la page d&apos;accueil et sur la page À Propos.
                </p>
                {!isAdding && !editingService && (
                    <button onClick={() => setIsAdding(true)} className="admin-btn admin-btn-primary">
                        <Plus size={16} /> Ajouter une prestation
                    </button>
                )}
            </div>

            {/* Alerts */}
            {success && (
                <div style={{ width: '100%', maxWidth: '800px', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '6px', color: '#86efac', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} /> {success}
                </div>
            )}
            {error && (
                <div style={{ width: '100%', maxWidth: '800px', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {/* Formulaire Ajout */}
            {isAdding && (
                <div className="admin-card" style={{ width: '100%', maxWidth: '800px', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(200,169,110,0.1)' }}>
                        <h2 style={{ fontSize: '1.1rem', color: '#F5F0E8' }}>Nouvelle prestation</h2>
                        <button type="button" onClick={() => setIsAdding(false)} style={{ background: 'none', border: 'none', color: 'rgba(245,240,232,0.4)', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    </div>
                    <form ref={formRef} onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                            <div>
                                <label className="admin-label">Numéro (ex: 01)</label>
                                <input type="text" name="num" placeholder="01" className="admin-input" />
                            </div>
                            <div>
                                <label className="admin-label">Badge / Catégorie (ex: Sur-mesure)</label>
                                <input type="text" name="badge" placeholder="Ex: Sur-mesure, Pro, Cocktails..." className="admin-input" />
                            </div>
                        </div>
                        <div>
                            <label className="admin-label">Titre de la prestation *</label>
                            <input type="text" name="title" required placeholder="Ex: Buffets Dînatoires" className="admin-input" />
                        </div>
                        <div>
                            <label className="admin-label">Description détaillée *</label>
                            <textarea name="description" required rows="3" placeholder="Description courte et attrayante..." className="admin-input" style={{ lineHeight: '1.6' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button type="button" onClick={() => setIsAdding(false)} className="admin-btn admin-btn-secondary" disabled={isPending}>Annuler</button>
                            <button type="submit" className="admin-btn admin-btn-primary" disabled={isPending}>
                                {isPending ? <Loader2 size={16} className="spin" /> : 'Créer la prestation'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Formulaire Édition */}
            {editingService && (
                <div className="admin-card" style={{ width: '100%', maxWidth: '800px', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(200,169,110,0.1)' }}>
                        <h2 style={{ fontSize: '1.1rem', color: '#F5F0E8' }}>Modifier la prestation</h2>
                        <button type="button" onClick={() => setEditingService(null)} style={{ background: 'none', border: 'none', color: 'rgba(245,240,232,0.4)', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <input type="hidden" name="id" value={editingService.id} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                            <div>
                                <label className="admin-label">Numéro</label>
                                <input type="text" name="num" defaultValue={editingService.num} className="admin-input" />
                            </div>
                            <div>
                                <label className="admin-label">Badge / Catégorie</label>
                                <input type="text" name="badge" defaultValue={editingService.badge} className="admin-input" />
                            </div>
                        </div>
                        <div>
                            <label className="admin-label">Titre *</label>
                            <input type="text" name="title" defaultValue={editingService.title} required className="admin-input" />
                        </div>
                        <div>
                            <label className="admin-label">Description *</label>
                            <textarea name="description" defaultValue={editingService.description} required rows="3" className="admin-input" style={{ lineHeight: '1.6' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button type="button" onClick={() => setEditingService(null)} className="admin-btn admin-btn-secondary" disabled={isPending}>Annuler</button>
                            <button type="submit" className="admin-btn admin-btn-primary" disabled={isPending}>
                                {isPending ? <Loader2 size={16} className="spin" /> : 'Enregistrer les modifications'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Liste des prestations */}
            <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {services.map((s, idx) => (
                    <div key={s.id} className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                            <div style={{
                                width: '42px', height: '42px', borderRadius: '6px',
                                background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#C8A96E', fontWeight: '700', fontSize: '1rem', flexShrink: 0
                            }}>
                                {s.num || `0${idx + 1}`}
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                                    <h3 style={{ fontSize: '1.05rem', color: '#F5F0E8', margin: 0, fontWeight: '600' }}>{s.title}</h3>
                                    {s.badge && (
                                        <span style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '2px 8px', borderRadius: '3px', background: 'rgba(200,169,110,0.15)', color: '#C8A96E' }}>
                                            {s.badge}
                                        </span>
                                    )}
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'rgba(245,240,232,0.6)', margin: 0, lineHeight: '1.5' }}>
                                    {s.description}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                            <button
                                onClick={() => handleReorder(s.id, 'up')}
                                disabled={idx === 0 || isPending}
                                title="Monter"
                                style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(200,169,110,0.2)', color: idx === 0 ? 'rgba(255,255,255,0.15)' : '#C8A96E', borderRadius: '4px', cursor: idx === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <ArrowUp size={14} />
                            </button>
                            <button
                                onClick={() => handleReorder(s.id, 'down')}
                                disabled={idx === services.length - 1 || isPending}
                                title="Descendre"
                                style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(200,169,110,0.2)', color: idx === services.length - 1 ? 'rgba(255,255,255,0.15)' : '#C8A96E', borderRadius: '4px', cursor: idx === services.length - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <ArrowDown size={14} />
                            </button>
                            <button
                                onClick={() => setEditingService(s)}
                                title="Modifier"
                                style={{ width: '32px', height: '32px', background: 'rgba(200,169,110,0.15)', border: '1px solid rgba(200,169,110,0.3)', color: '#C8A96E', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Edit3 size={14} />
                            </button>

                            {deleteId === s.id ? (
                                <button
                                    onClick={() => handleDelete(s.id)}
                                    disabled={isPending}
                                    style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.9)', border: 'none', color: 'white', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    Oui, supprimer
                                </button>
                            ) : (
                                <button
                                    onClick={() => setDeleteId(s.id)}
                                    title="Supprimer"
                                    style={{ width: '32px', height: '32px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .admin-page-title { font-size: 1.6rem; font-weight: 700; color: #F5F0E8; margin-bottom: 0.5rem; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

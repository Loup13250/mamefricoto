'use client';
import { useState } from 'react';
import Image from 'next/image';
import { addWeeklyMenu, editWeeklyMenu, deleteWeeklyMenu } from '@/app/actions';
import { Pencil, Trash2, Plus, X, Image as ImageIcon, CalendarDays, CheckCircle2, Images } from 'lucide-react';

export default function WeeklyMenuClient({ menus }) {
    const [editingId, setEditingId] = useState(null);
    const [isAdding, setIsAdding] = useState(false);

    return (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>
                    Menu de la Semaine
                </h1>
                <p style={{ color: '#64748b', maxWidth: '650px', marginBottom: '1.5rem' }}>
                    Ajoutez simplement le titre du menu et uploadez les photos (1 ou plusieurs images) pour les afficher dans le carrousel tactile du site !
                </p>
                <button
                    onClick={() => { setIsAdding(!isAdding); setEditingId(null); }}
                    className="admin-btn admin-btn-primary"
                    style={{ boxShadow: '0 4px 15px rgba(61,90,128,0.2)' }}
                >
                    {isAdding ? <><X size={16} /> Annuler</> : <><Plus size={16} /> Publier un Menu (Ajouter les images)</>}
                </button>
            </div>

            {/* Add Form */}
            {isAdding && (
                <div className="admin-card" style={{ width: '100%', maxWidth: '720px', marginBottom: '3rem', borderTop: '4px solid var(--admin-primary)' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1e293b' }}>
                        Ajouter un nouveau menu de la semaine
                    </h2>
                    <form action={addWeeklyMenu} onSubmit={() => setIsAdding(false)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label className="admin-label">Titre du menu *</label>
                            <input type="text" name="title" className="admin-input" placeholder="Ex: Menu du 15 au 18 Juillet" required style={{ background: '#faf8f5' }} />
                        </div>

                        <div>
                            <label className="admin-label">Description des plats (optionnel)</label>
                            <textarea name="description" className="admin-input" rows="3" placeholder="Ex: Tarte tatin aubergines, Cake citron, Riz safran..." style={{ background: '#faf8f5' }}></textarea>
                        </div>

                        {/* Image Upload Box */}
                        <div className="admin-dropzone" style={{ position: 'relative', border: '2px dashed var(--admin-primary)', background: '#f0f4f8', borderRadius: '16px', padding: '2rem 1rem' }}>
                            <label htmlFor="menu-files-new" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', cursor: 'pointer' }}>
                                <Images size={48} style={{ marginBottom: '0.75rem', color: 'var(--admin-primary)' }} />
                                <span style={{ display: 'block', color: '#1e293b', fontWeight: '700', fontSize: '1.05rem', marginBottom: '0.25rem' }}>
                                    Sélectionnez les photos de votre menu (Multi-Sélection)
                                </span>
                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                    Choisissez une ou plusieurs images depuis votre téléphone ou votre ordinateur
                                </span>
                                <input id="menu-files-new" type="file" name="image_files" accept="image/*" multiple style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                            </label>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                            <input type="checkbox" name="is_current" id="is_current_new" defaultChecked style={{ width: '20px', height: '20px', accentColor: 'var(--admin-primary)' }} />
                            <label htmlFor="is_current_new" style={{ fontWeight: '600', color: '#166534', cursor: 'pointer' }}>
                                Définir comme menu en cours (affiché sur la page d&apos;accueil)
                            </label>
                        </div>

                        <div style={{ paddingTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                            <button type="submit" className="admin-btn admin-btn-primary" style={{ padding: '14px 40px', fontSize: '1rem' }}>
                                Publier ce menu
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Menus List */}
            <div style={{ width: '100%' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#1e293b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                    <span style={{ width: '30px', height: '2px', background: '#e2e8f0' }}></span>
                    Tous les menus ({menus.length})
                    <span style={{ width: '30px', height: '2px', background: '#e2e8f0' }}></span>
                </h2>

                {menus.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8', fontStyle: 'italic', background: 'white', borderRadius: '20px', border: '1px solid #f1ede8' }}>
                        Aucun menu publié pour le moment.
                    </div>
                ) : (
                    <div className="admin-grid-menus">
                        {menus.map(menu => (
                            editingId === menu.id ? (
                                /* Edit Form */
                                <div key={menu.id} className="admin-card" style={{ gridColumn: '1 / -1', borderTop: '4px solid var(--admin-accent)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h2 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#1e293b' }}>Modification du menu</h2>
                                        <button type="button" onClick={() => setEditingId(null)} style={{ color: '#94a3b8', cursor: 'pointer', background: '#f1f5f9', padding: '8px', borderRadius: '50%', border: 'none' }}>
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <form action={editWeeklyMenu} onSubmit={() => setEditingId(null)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        <input type="hidden" name="id" value={menu.id} />
                                        <div>
                                            <label className="admin-label">Titre du menu *</label>
                                            <input type="text" name="title" defaultValue={menu.title} className="admin-input" required style={{ background: '#faf8f5' }} />
                                        </div>
                                        <div>
                                            <label className="admin-label">Description</label>
                                            <textarea name="description" defaultValue={menu.description} className="admin-input" rows="3" style={{ background: '#faf8f5' }}></textarea>
                                        </div>
                                        <div className="admin-dropzone" style={{ position: 'relative', padding: '1.5rem' }}>
                                            <label htmlFor={`menu-files-${menu.id}`} style={{ display: 'block', width: '100%', cursor: 'pointer', textAlign: 'center' }}>
                                                <span style={{ fontWeight: '600', color: '#475569' }}>Remplacer / Ajouter des images (Multi-Sélection)</span>
                                                <input id={`menu-files-${menu.id}`} type="file" name="image_files" accept="image/*" multiple style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                            </label>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: menu.is_current ? '#f0fdf4' : '#fafaf8', borderRadius: '12px', border: `1px solid ${menu.is_current ? '#bbf7d0' : '#e2e8f0'}` }}>
                                            <input type="checkbox" name="is_current" id={`is_current_${menu.id}`} defaultChecked={menu.is_current} style={{ width: '20px', height: '20px', accentColor: 'var(--admin-primary)' }} />
                                            <label htmlFor={`is_current_${menu.id}`} style={{ fontWeight: '600', cursor: 'pointer', color: menu.is_current ? '#166534' : '#475569' }}>
                                                Menu en cours (affiché sur la page d&apos;accueil)
                                            </label>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #f1ede8' }}>
                                            <button type="button" onClick={() => setEditingId(null)} className="admin-btn admin-btn-secondary">Annuler</button>
                                            <button type="submit" className="admin-btn admin-btn-primary">Enregistrer</button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                /* Menu Card */
                                <div key={menu.id} className="admin-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease', position: 'relative' }}>
                                    {menu.is_current === 1 && (
                                        <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 5, display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#22c55e', color: 'white', padding: '6px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '700', boxShadow: '0 2px 8px rgba(34,197,94,0.3)' }}>
                                            <CheckCircle2 size={14} />
                                            EN COURS
                                        </div>
                                    )}
                                    <div className="admin-thumb-menu">
                                        {menu.images && menu.images.length > 0 ? (
                                            <Image
                                                src={menu.images[0].image_url}
                                                alt={menu.title}
                                                width={600}
                                                height={600}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                unoptimized
                                            />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', background: '#f8fafc' }}>
                                                <ImageIcon size={48} style={{ opacity: 0.4 }} />
                                            </div>
                                        )}
                                        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => { setEditingId(menu.id); setIsAdding(false); }} style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.95)', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', border: 'none' }} title="Modifier">
                                                <Pencil size={16} />
                                            </button>
                                            <form action={deleteWeeklyMenu}>
                                                <input type="hidden" name="id" value={menu.id} />
                                                <button type="submit" style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.95)', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444', border: 'none' }} title="Supprimer">
                                                    <Trash2 size={16} />
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                    <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <h3 style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1e293b', marginBottom: '0.5rem' }}>{menu.title}</h3>
                                        {menu.description && (
                                            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {menu.description}
                                            </p>
                                        )}
                                        <p style={{ marginTop: 'auto', paddingTop: '1rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>
                                            <CalendarDays size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem' }} />
                                            {new Date(menu.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

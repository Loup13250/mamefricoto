'use client';
import { useState } from 'react';
import Image from 'next/image';
import { addArticle, editArticle, deleteArticle } from '@/app/actions';
import { Pencil, Trash2, Plus, X, Image as ImageIcon } from 'lucide-react';

export default function ArticleClient({ articles }) {
    const [editingId, setEditingId] = useState(null);
    const [isAdding, setIsAdding] = useState(false);

    return (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>Actualités</h1>
                <p style={{ color: '#64748b', maxWidth: '500px', marginBottom: '1.5rem' }}>
                    Partagez vos nouveautés, événements ou annonces. Ces articles apparaîtront sur la page d&apos;accueil.
                </p>
                <button
                    onClick={() => { setIsAdding(!isAdding); setEditingId(null); }}
                    className="admin-btn admin-btn-primary"
                >
                    {isAdding ? <><X size={16} /> Annuler</> : <><Plus size={16} /> Nouvel article</>}
                </button>
            </div>

            {isAdding && (
                <div className="admin-card" style={{ width: '100%', maxWidth: '700px', marginBottom: '3rem', borderTop: '4px solid var(--admin-primary)' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1.5rem', textAlign: 'center', color: '#1e293b' }}>Nouvel Article</h2>
                    <form action={addArticle} onSubmit={() => setIsAdding(false)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label className="admin-label">Titre *</label>
                            <input type="text" name="title" className="admin-input" required style={{ background: '#faf8f5', fontWeight: '600' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                            <div className="admin-dropzone" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                                <label htmlFor="article-file-new" style={{ display: 'block', width: '100%', height: '100%', cursor: 'pointer', textAlign: 'center' }}>
                                    <ImageIcon size={32} style={{ marginBottom: '0.75rem', color: '#94a3b8' }} />
                                    <span style={{ display: 'block', color: '#475569', fontWeight: '600', marginBottom: '0.25rem' }}>Image depuis votre PC</span>
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>Optionnel</span>
                                    <input id="article-file-new" type="file" name="image_file" accept="image/*" style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                </label>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <label className="admin-label">Ou lien web</label>
                                <input type="url" name="image_url" placeholder="https://..." className="admin-input" style={{ background: '#faf8f5' }} />
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>L&apos;image PC est prioritaire si les deux sont fournis.</p>
                            </div>
                        </div>
                        <div>
                            <label className="admin-label">Contenu de l&apos;article *</label>
                            <textarea name="content" className="admin-input" rows="6" required style={{ background: '#faf8f5', lineHeight: '1.6' }}></textarea>
                        </div>
                        <div style={{ paddingTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                            <button type="submit" className="admin-btn admin-btn-primary" style={{ padding: '14px 40px' }}>
                                Publier l&apos;article
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ width: '100%' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#1e293b', marginBottom: '1.5rem', textAlign: 'center' }}>
                    Tous les articles ({articles.length})
                </h2>

                <div className="admin-grid-articles">
                    {articles.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8', fontStyle: 'italic', background: 'white', borderRadius: '20px' }}>
                            Aucun article publié.
                        </div>
                    ) : articles.map(article => (
                        editingId === article.id ? (
                            <div key={article.id} className="admin-card" style={{ gridColumn: '1/-1', borderTop: '4px solid var(--admin-accent)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h2 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Édition</h2>
                                    <button type="button" onClick={() => setEditingId(null)} style={{ color: '#94a3b8', cursor: 'pointer', background: '#f1f5f9', padding: '8px', borderRadius: '50%', border: 'none' }}>
                                        <X size={20} />
                                    </button>
                                </div>
                                <form action={editArticle} onSubmit={() => setEditingId(null)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <input type="hidden" name="id" value={article.id} />
                                    <div>
                                        <label className="admin-label">Titre</label>
                                        <input type="text" name="title" defaultValue={article.title} className="admin-input" required style={{ background: '#faf8f5', fontWeight: '600' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                        <div className="admin-dropzone" style={{ position: 'relative', padding: '1.5rem' }}>
                                            <label htmlFor={`article-file-${article.id}`} style={{ display: 'block', width: '100%', cursor: 'pointer', textAlign: 'center' }}>
                                                <span style={{ fontWeight: '600', color: '#475569' }}>Remplacer l&apos;image</span>
                                                <input id={`article-file-${article.id}`} type="file" name="image_file" accept="image/*" style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                            </label>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <label className="admin-label">Nouveau lien (vide = conserver)</label>
                                            <input type="url" name="image_url" className="admin-input" style={{ background: '#faf8f5' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="admin-label">Contenu</label>
                                        <textarea name="content" defaultValue={article.content} className="admin-input" rows="5" required style={{ background: '#faf8f5', lineHeight: '1.6' }}></textarea>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #f1ede8' }}>
                                        <button type="button" onClick={() => setEditingId(null)} className="admin-btn admin-btn-secondary">Annuler</button>
                                        <button type="submit" className="admin-btn admin-btn-primary">Enregistrer</button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div key={article.id} className="admin-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.3s', borderRadius: '20px' }}>
                                <div className="admin-thumb-article" style={{ position: 'relative' }}>
                                    {article.image_url ? (
                                        <Image src={article.image_url} alt="" width={800} height={450} style={{ width: '100%', height: '100%', objectFit: 'cover' }} unoptimized />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', background: '#f8fafc' }}>
                                            <ImageIcon size={40} style={{ opacity: 0.4 }} />
                                        </div>
                                    )}
                                    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.4rem' }}>
                                        <button onClick={() => { setEditingId(article.id); setIsAdding(false); }} style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.95)', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', border: 'none' }} title="Modifier">
                                            <Pencil size={16} />
                                        </button>
                                        <form action={deleteArticle}>
                                            <input type="hidden" name="id" value={article.id} />
                                            <button type="submit" style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.95)', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444', border: 'none' }} title="Supprimer">
                                                <Trash2 size={16} />
                                            </button>
                                        </form>
                                    </div>
                                </div>
                                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1e293b', marginBottom: '0.4rem' }}>{article.title}</h3>
                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                                        {new Date(article.created_at).toLocaleDateString('fr-FR')}
                                    </p>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {article.content}
                                    </p>
                                </div>
                            </div>
                        )
                    ))}
                </div>
            </div>
        </div>
    );
}

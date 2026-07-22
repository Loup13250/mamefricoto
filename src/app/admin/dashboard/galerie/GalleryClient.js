'use client';
import { useState } from 'react';
import Image from 'next/image';
import { addGalleryPost, deleteGalleryPost } from '@/app/actions';
import { Camera, Plus, Trash2, X, Image as ImageIcon } from 'lucide-react';

export default function GalleryClient({ posts }) {
    const [isAdding, setIsAdding] = useState(false);

    return (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>
                    Galerie Instagram / Stories de Cuisine
                </h1>
                <p style={{ color: '#64748b', maxWidth: '600px', marginBottom: '1.5rem' }}>
                    Postez ici les photos de vos réalisations, buffets et stories quotidiennes. Elles s&apos;afficheront sous forme de feed Instagram sur la page d&apos;accueil.
                </p>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="admin-btn admin-btn-primary"
                >
                    {isAdding ? <><X size={16} /> Annuler</> : <><Plus size={16} /> Publier une Photo / Story</>}
                </button>
            </div>

            {isAdding && (
                <div className="admin-card" style={{ width: '100%', maxWidth: '700px', marginBottom: '3rem', borderTop: '4px solid var(--admin-primary)' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1e293b' }}>
                        Ajouter une photo à la galerie
                    </h2>
                    <form action={addGalleryPost} onSubmit={() => setIsAdding(false)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label className="admin-label">Titre / Nom du plat (optionnel)</label>
                            <input type="text" name="title" className="admin-input" placeholder="Ex: Risotto aux gambas" style={{ background: '#faf8f5' }} />
                        </div>

                        <div>
                            <label className="admin-label">Légende / Description (optionnel)</label>
                            <textarea name="caption" className="admin-input" rows="3" placeholder="Ex: Préparation du buffet dînatoire pour 20 personnes..." style={{ background: '#faf8f5' }}></textarea>
                        </div>

                        <div className="admin-dropzone" style={{ position: 'relative' }}>
                            <label htmlFor="story-file-upload" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', cursor: 'pointer', padding: '2rem 0' }}>
                                <Camera size={40} style={{ marginBottom: '1rem', color: 'var(--admin-primary)' }} />
                                <span style={{ display: 'block', color: '#1e293b', fontWeight: '700', marginBottom: '0.25rem' }}>
                                    Cliquez pour choisir une photo
                                </span>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                    Formats JPG/PNG/WEBP acceptés
                                </span>
                                <input id="story-file-upload" type="file" name="image_file" accept="image/*" style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                            </label>
                        </div>

                        <div>
                            <label className="admin-label">Ou coller l&apos;URL d&apos;une image web</label>
                            <input type="url" name="image_url" placeholder="https://..." className="admin-input" style={{ background: '#faf8f5' }} />
                        </div>

                        <div style={{ paddingTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                            <button type="submit" className="admin-btn admin-btn-primary" style={{ padding: '14px 40px' }}>
                                Publier la photo
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ width: '100%' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#1e293b', marginBottom: '1.5rem', textAlign: 'center' }}>
                    Photos publiées ({posts.length})
                </h2>

                <div className="admin-grid-carousel" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                    {posts.map(post => (
                        <div key={post.id} className="admin-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                            <div style={{ height: '200px', width: '100%', overflow: 'hidden', position: 'relative', background: '#f8fafc' }}>
                                <Image src={post.image_url} alt={post.title || ''} width={400} height={400} style={{ width: '100%', height: '100%', objectFit: 'cover' }} unoptimized />
                                <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                                    <form action={deleteGalleryPost}>
                                        <input type="hidden" name="id" value={post.id} />
                                        <button type="submit" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.95)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }} title="Supprimer">
                                            <Trash2 size={14} />
                                        </button>
                                    </form>
                                </div>
                            </div>
                            <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                {post.title && <h3 style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1e293b', marginBottom: '0.25rem' }}>{post.title}</h3>}
                                {post.caption && <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: '1.5' }}>{post.caption}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

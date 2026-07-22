'use client';
import { useState } from 'react';
import Image from 'next/image';
import { addCarouselImage, deleteCarouselImage } from '@/app/actions';
import { Image as ImageIcon, Plus, Trash2, X } from 'lucide-react';

export default function CarouselClient({ images }) {
    const [isAdding, setIsAdding] = useState(false);

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1e293b' }}>Gestion du Carrousel</h1>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="admin-btn admin-btn-primary"
                >
                    {isAdding ? <><X size={16} /> Annuler</> : <><Plus size={16} /> Nouvelle Photo</>}
                </button>
            </div>

            {isAdding && (
                <div className="admin-card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--admin-primary)' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.25rem', color: '#1e293b' }}>Ajouter une image au carrousel</h2>
                    <form action={addCarouselImage} onSubmit={() => setIsAdding(false)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="admin-label">Titre principal</label>
                                <input type="text" name="title" className="admin-input" required style={{ background: '#faf8f5' }} />
                            </div>
                            <div>
                                <label className="admin-label">Sous-titre</label>
                                <input type="text" name="subtitle" className="admin-input" required style={{ background: '#faf8f5' }} />
                            </div>
                        </div>

                        <div className="admin-dropzone" style={{ position: 'relative' }}>
                            <label htmlFor="carousel-file-upload" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', cursor: 'pointer', padding: '1.5rem 0' }}>
                                <ImageIcon size={32} style={{ marginBottom: '0.75rem', color: '#94a3b8' }} />
                                <span style={{ display: 'block', color: '#475569', fontWeight: '600', marginBottom: '0.25rem' }}>Cliquez pour ajouter une image</span>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Recommandé : 1920x1080 (paysage)</span>
                                <input id="carousel-file-upload" type="file" name="image_file" accept="image/*" style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                            </label>
                        </div>

                        <div>
                            <label className="admin-label">Ou URL d&apos;image web</label>
                            <input type="url" name="image_url" placeholder="https://..." className="admin-input" style={{ background: '#faf8f5' }} />
                        </div>

                        <div style={{ paddingTop: '0.5rem', textAlign: 'right' }}>
                            <button type="submit" className="admin-btn admin-btn-primary">
                                Publier la photo
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="admin-grid-carousel">
                {images.map(img => (
                    <div key={img.id} className="admin-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s' }}>
                        <div className="admin-thumb-carousel">
                            {img.image_url ? (
                                <Image
                                    src={img.image_url}
                                    alt={img.title}
                                    width={1200}
                                    height={675}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    unoptimized
                                />
                            ) : (
                                <ImageIcon size={32} style={{ color: '#cbd5e1' }} />
                            )}
                            <div style={{ position: 'absolute', top: '6px', right: '6px', display: 'flex', gap: '0.35rem' }}>
                                <form action={deleteCarouselImage}>
                                    <input type="hidden" name="id" value={img.id} />
                                    <button type="submit" style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }} title="Supprimer">
                                        <Trash2 size={14} />
                                    </button>
                                </form>
                            </div>
                        </div>
                        <div style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <h3 style={{ fontWeight: '700', fontSize: '0.85rem', color: '#1e293b' }}>{img.title}</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.15rem' }}>{img.subtitle}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

'use client';
import { useState, useRef, useTransition } from 'react';
import Image from 'next/image';
import { addCarouselImage, deleteCarouselImage, editCarouselImage } from '@/app/actions';
import { Image as ImageIcon, Plus, Trash2, Pencil, X, UploadCloud, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

async function compressImageFile(file, maxWidth = 1200, quality = 0.75) {
    if (!file || !file.type.startsWith('image/') || file.type.includes('svg')) return file;
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            resolve(file);
                            return;
                        }
                        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => resolve(file);
            img.src = e.target.result;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
}

function CarouselForm({ onCancel }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const inputRef = useRef(null);
    const formRef = useRef(null);

    const handleFileSelect = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Format non supporté. Veuillez choisir une image (JPG, PNG, WEBP).');
            return;
        }
        setError('');
        setSelectedFile(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const formData = new FormData(e.target);

        formData.delete('image_file');
        if (selectedFile) {
            const compressed = await compressImageFile(selectedFile, 1200, 0.75);
            formData.append('image_file', compressed);
        }

        if (!selectedFile && !formData.get('image_url')) {
            setError('Veuillez sélectionner une image ou fournir une URL.');
            return;
        }

        startTransition(async () => {
            const result = await addCarouselImage(formData);
            if (result?.error) {
                setError(result.error);
            } else {
                setSuccess(true);
                setTimeout(() => onCancel(), 1200);
            }
        });
    };

    if (success) {
        return (
            <div style={{
                padding: '2.5rem', textAlign: 'center',
                background: 'rgba(34,197,94,0.06)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: '8px',
            }}>
                <CheckCircle2 size={40} style={{ color: '#22c55e', marginBottom: '0.75rem' }} />
                <p style={{ color: '#86efac', fontWeight: '600' }}>Photo ajoutée au carrousel avec succès !</p>
            </div>
        );
    }

    return (
        <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                    <label className="admin-label">Titre principal *</label>
                    <input type="text" name="title" className="admin-input" placeholder="Ex: Cuisine Maison avec Amour" required />
                </div>
                <div>
                    <label className="admin-label">Sous-titre (optionnel)</label>
                    <input type="text" name="subtitle" className="admin-input" placeholder="Ex: Des plats faits maison livrés chez vous" />
                </div>
            </div>

            {/* Zone de prévisualisation ou Dropzone */}
            <div>
                <label className="admin-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Photo de bannière *</label>

                {selectedFile ? (
                    <div style={{
                        position: 'relative',
                        background: '#0E0D0C',
                        border: '1px solid rgba(200,169,110,0.3)',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        aspectRatio: '16 / 9',
                        maxHeight: '260px',
                    }}>
                        <Image
                            src={URL.createObjectURL(selectedFile)}
                            alt="Aperçu carrousel"
                            width={1200}
                            height={675}
                            style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block' }}
                            unoptimized
                        />
                        <button
                            type="button"
                            onClick={() => setSelectedFile(null)}
                            title="Retirer"
                            style={{
                                position: 'absolute', top: '10px', right: '10px',
                                width: '32px', height: '32px',
                                background: 'rgba(239,68,68,0.9)',
                                border: 'none', borderRadius: '4px', color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            <X size={16} />
                        </button>
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            padding: '6px 12px', background: 'rgba(14,13,12,0.75)',
                            fontSize: '0.75rem', color: '#C8A96E', textAlign: 'center',
                        }}>
                            {selectedFile.name} (Optimisé automatiquement)
                        </div>
                    </div>
                ) : (
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                        style={{
                            border: `2px dashed ${isDragging ? '#C8A96E' : 'rgba(200,169,110,0.3)'}`,
                            background: isDragging ? 'rgba(200,169,110,0.06)' : 'rgba(255,255,255,0.02)',
                            borderRadius: '6px',
                            padding: '2rem 1rem',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            gap: '0.5rem', cursor: 'pointer',
                            transition: 'all 0.25s ease',
                        }}
                    >
                        <UploadCloud size={36} style={{ color: isDragging ? '#C8A96E' : 'rgba(200,169,110,0.5)' }} />
                        <span style={{ fontWeight: '600', color: '#F5F0E8', fontSize: '0.95rem' }}>
                            Glisser une image ici, ou cliquer pour choisir
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'rgba(245,240,232,0.4)' }}>
                            Optimisation automatique pour affichage ultra-rapide
                        </span>
                        <input
                            ref={inputRef}
                            type="file"
                            name="image_file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileSelect(file);
                                e.target.value = '';
                            }}
                        />
                    </div>
                )}

                {!selectedFile && (
                    <div style={{ marginTop: '0.75rem' }}>
                        <label className="admin-label" style={{ marginBottom: '0.35rem', display: 'block' }}>Ou URL d&apos;image web</label>
                        <input type="url" name="image_url" placeholder="https://..." className="admin-input" />
                    </div>
                )}
            </div>

            {error && (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.85rem 1rem', borderRadius: '4px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '0.85rem' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid rgba(200,169,110,0.08)' }}>
                <button type="button" onClick={onCancel} className="admin-btn admin-btn-secondary" disabled={isPending}>
                    Annuler
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={isPending} style={{ minWidth: '150px' }}>
                    {isPending ? (
                        <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Publication...</>
                    ) : 'Publier la photo'}
                </button>
            </div>
        </form>
    );
}

function EditCarouselForm({ item, onCancel }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const inputRef = useRef(null);

    const handleFileSelect = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Format non supporté. Veuillez choisir une image.');
            return;
        }
        setError('');
        setSelectedFile(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const formData = new FormData(e.target);
        formData.append('id', item.id);

        if (selectedFile) {
            const compressed = await compressImageFile(selectedFile, 1200, 0.75);
            formData.set('image_file', compressed);
        }

        startTransition(async () => {
            const result = await editCarouselImage(formData);
            if (result?.error) {
                setError(result.error);
            } else {
                setSuccess(true);
                setTimeout(() => onCancel(), 1000);
            }
        });
    };

    if (success) {
        return (
            <div style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(34,197,94,0.06)', borderRadius: '6px' }}>
                <CheckCircle2 size={32} style={{ color: '#22c55e', marginBottom: '0.5rem' }} />
                <p style={{ color: '#86efac', fontWeight: '600', fontSize: '0.9rem' }}>Modifications enregistrées avec succès !</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                    <label className="admin-label">Titre principal *</label>
                    <input type="text" name="title" defaultValue={item.title || ''} className="admin-input" required />
                </div>
                <div>
                    <label className="admin-label">Ordre d'affichage</label>
                    <input type="number" name="display_order" defaultValue={item.display_order || 1} min="1" className="admin-input" />
                </div>
            </div>

            <div>
                <label className="admin-label">Sous-titre / Description</label>
                <input type="text" name="subtitle" defaultValue={item.subtitle || ''} className="admin-input" placeholder="Ex: Livraison & Retrait à Eyguières" />
            </div>

            <div>
                <label className="admin-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Photo actuelle (ou cliquer pour remplacer)</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '120px', height: '70px', borderRadius: '4px', overflow: 'hidden', background: '#000', border: '1px solid rgba(200,169,110,0.3)' }}>
                        <Image
                            src={selectedFile ? URL.createObjectURL(selectedFile) : item.image_url}
                            alt="Aperçu"
                            width={240}
                            height={140}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            unoptimized
                        />
                    </div>
                    <div>
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="admin-btn admin-btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                        >
                            Changer la photo
                        </button>
                        <input
                            ref={inputRef}
                            type="file"
                            name="image_file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileSelect(e.target.files?.[0])}
                        />
                        <input type="hidden" name="image_url" defaultValue={item.image_url || ''} />
                    </div>
                </div>
            </div>

            {error && (
                <div style={{ color: '#fca5a5', fontSize: '0.85rem' }}>{error}</div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={onCancel} className="admin-btn admin-btn-secondary" disabled={isPending}>
                    Annuler
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={isPending}>
                    {isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Enregistrer'}
                </button>
            </div>
        </form>
    );
}

export default function CarouselClient({ images }) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleting, startDeleteTransition] = useTransition();

    const handleDelete = (id) => {
        startDeleteTransition(async () => {
            await deleteCarouselImage(id);
            setDeleteId(null);
        });
    };

    return (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#F5F0E8' }}>Gestion du Carrousel</h1>
                    <p style={{ color: 'rgba(245,240,232,0.5)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        Gérez les bannières d&apos;accueil, leurs titres, descriptions et visuels.
                    </p>
                </div>
                {!isAdding && !editingItem && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="admin-btn admin-btn-primary"
                    >
                        <Plus size={16} /> Nouvelle Photo
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="admin-card" style={{ width: '100%', maxWidth: '800px', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(200,169,110,0.08)' }}>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#F5F0E8' }}>Ajouter une bannière</h2>
                        <button type="button" onClick={() => setIsAdding(false)} style={{ color: 'rgba(245,240,232,0.4)', cursor: 'pointer', padding: '4px', background: 'none', border: 'none' }}>
                            <X size={18} />
                        </button>
                    </div>
                    <CarouselForm onCancel={() => setIsAdding(false)} />
                </div>
            )}

            {editingItem && (
                <div className="admin-card" style={{ width: '100%', maxWidth: '800px', marginBottom: '2.5rem', border: '1px solid rgba(200,169,110,0.4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(200,169,110,0.1)' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#C8A96E', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Pencil size={16} /> Modifier la bannière
                        </h2>
                        <button type="button" onClick={() => setEditingItem(null)} style={{ color: 'rgba(245,240,232,0.4)', cursor: 'pointer', padding: '4px', background: 'none', border: 'none' }}>
                            <X size={18} />
                        </button>
                    </div>
                    <EditCarouselForm item={editingItem} onCancel={() => setEditingItem(null)} />
                </div>
            )}

            <div style={{ width: '100%', maxWidth: '800px' }}>
                <h2 style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.35)', marginBottom: '1rem' }}>
                    Bannières actuelles ({images.length})
                </h2>

                {images.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3.5rem 2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(200,169,110,0.08)', borderRadius: '6px', color: 'rgba(245,240,232,0.35)' }}>
                        Aucune photo dans le carrousel.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                        {images.map(img => (
                            <div key={img.id} className="admin-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                <div style={{ height: '150px', width: '100%', overflow: 'hidden', position: 'relative', background: '#000' }}>
                                    {img.image_url ? (
                                        <Image
                                            src={img.image_url}
                                            alt={img.title || ''}
                                            width={600}
                                            height={337}
                                            style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                                            unoptimized
                                        />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(245,240,232,0.2)' }}>
                                            <ImageIcon size={32} />
                                        </div>
                                    )}

                                    {/* Action Buttons: Edit + Delete */}
                                    <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '6px' }}>
                                        <button
                                            onClick={() => { setEditingItem(img); setIsAdding(false); }}
                                            style={{ width: '30px', height: '30px', borderRadius: '4px', background: 'rgba(14,13,12,0.75)', border: '1px solid rgba(200,169,110,0.3)', color: '#C8A96E', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
                                            title="Modifier les textes et l'image"
                                        >
                                            <Pencil size={14} />
                                        </button>

                                        {deleteId === img.id ? (
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button
                                                    onClick={() => handleDelete(img.id)}
                                                    disabled={isDeleting}
                                                    style={{ padding: '4px 10px', background: 'rgba(239,68,68,0.9)', border: 'none', color: 'white', borderRadius: '3px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                                                >
                                                    {isDeleting ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : 'Confirmer'}
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(null)}
                                                    style={{ width: '26px', height: '26px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setDeleteId(img.id)}
                                                style={{ width: '30px', height: '30px', borderRadius: '4px', background: 'rgba(14,13,12,0.75)', border: '1px solid rgba(200,169,110,0.3)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
                                                title="Supprimer"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div style={{ padding: '0.85rem 1rem' }}>
                                    <h3 style={{ fontWeight: '600', fontSize: '0.9rem', color: '#F5F0E8' }}>{img.title}</h3>
                                    {img.subtitle && <p style={{ color: 'rgba(245,240,232,0.4)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{img.subtitle}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

'use client';
import { useState, useRef, useTransition } from 'react';
import Image from 'next/image';
import { addCarouselImage, deleteCarouselImage, editCarouselImage } from '@/app/actions';
import { Image as ImageIcon, Plus, Trash2, Pencil, X, UploadCloud, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

async function compressImageFile(file, maxDim = 2048, quality = 0.85) {
    if (!file || !file.type.startsWith('image/') || file.type.includes('svg')) return file;
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Use WebP for supreme visual quality with ~30-40% smaller file size
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            canvas.toBlob(
                                (jpegBlob) => {
                                    if (!jpegBlob) {
                                        resolve(file);
                                        return;
                                    }
                                    resolve(new File([jpegBlob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                                        type: 'image/jpeg',
                                        lastModified: Date.now()
                                    }));
                                },
                                'image/jpeg',
                                quality
                            );
                            return;
                        }
                        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                            type: 'image/webp',
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    },
                    'image/webp',
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
    const [desktopFile, setDesktopFile] = useState(null);
    const [mobileFile, setMobileFile] = useState(null);
    const [desktopDragging, setDesktopDragging] = useState(false);
    const [mobileDragging, setMobileDragging] = useState(false);

    const [isPending, startTransition] = useTransition();
    const [isCompressing, setIsCompressing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const desktopInputRef = useRef(null);
    const mobileInputRef = useRef(null);
    const formRef = useRef(null);

    const handleDesktopSelect = (file) => {
        if (!file || !file.type.startsWith('image/')) {
            setError('Format non supporté pour la photo principale.');
            return;
        }
        setError('');
        setDesktopFile(file);
    };

    const handleMobileSelect = (file) => {
        if (!file || !file.type.startsWith('image/')) {
            setError('Format non supporté pour la photo mobile.');
            return;
        }
        setError('');
        setMobileFile(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!desktopFile && !e.target.image_url?.value) {
            setError('Veuillez sélectionner au moins la photo principale pour grand écran.');
            return;
        }

        const formData = new FormData(e.target);
        formData.delete('image_file');
        formData.delete('mobile_image_file');

        setIsCompressing(true);
        try {
            if (desktopFile) {
                const compressedDesktop = await compressImageFile(desktopFile, 2048, 0.85);
                formData.append('image_file', compressedDesktop);
            }
            if (mobileFile) {
                const compressedMobile = await compressImageFile(mobileFile, 2048, 0.85);
                formData.append('mobile_image_file', compressedMobile);
            }
        } catch (err) {
            console.warn('Compression error:', err);
            if (desktopFile) formData.append('image_file', desktopFile);
            if (mobileFile) formData.append('mobile_image_file', mobileFile);
        } finally {
            setIsCompressing(false);
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
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: '8px',
            }}>
                <CheckCircle2 size={40} style={{ color: '#16a34a', marginBottom: '0.75rem' }} />
                <p style={{ color: '#16a34a', fontWeight: '600' }}>Photo ajoutée au carrousel avec succès !</p>
            </div>
        );
    }

    return (
        <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {/* 1. Desktop Photo Upload */}
                <div>
                    <label className="admin-label" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>🖥️ Photo Grand Écran (Ordinateur) *</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--admin-gold)' }}>Paysage (16:9)</span>
                    </label>

                    {desktopFile ? (
                        <div style={{
                            position: 'relative',
                            background: 'var(--admin-surface)',
                            border: '1px solid var(--admin-border)',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            aspectRatio: '16 / 9',
                            maxHeight: '200px',
                        }}>
                            <Image
                                src={URL.createObjectURL(desktopFile)}
                                alt="Aperçu grand écran"
                                width={800}
                                height={450}
                                style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                                unoptimized
                            />
                            <button
                                type="button"
                                onClick={() => setDesktopFile(null)}
                                title="Retirer"
                                style={{
                                    position: 'absolute', top: '8px', right: '8px',
                                    width: '28px', height: '28px',
                                    background: 'rgba(239,68,68,0.9)',
                                    border: 'none', borderRadius: '4px', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer',
                                }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDesktopDragging(true); }}
                            onDragLeave={() => setDesktopDragging(false)}
                            onDrop={(e) => { e.preventDefault(); setDesktopDragging(false); handleDesktopSelect(e.dataTransfer.files?.[0]); }}
                            onClick={() => desktopInputRef.current?.click()}
                            style={{
                                border: `2px dashed ${desktopDragging ? 'var(--admin-gold)' : 'var(--admin-border)'}`,
                                background: desktopDragging ? 'rgba(200,169,110,0.08)' : 'var(--admin-surface)',
                                borderRadius: '6px', padding: '1.75rem 1rem', textAlign: 'center', cursor: 'pointer'
                            }}
                        >
                            <UploadCloud size={28} style={{ color: 'var(--admin-gold)', marginBottom: '0.4rem' }} />
                            <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--admin-text)', fontWeight: '600' }}>Cliquer pour la photo grand écran</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-subtle)' }}>Affichée sur ordinateur et tablette</span>
                        </div>
                    )}
                    <input ref={desktopInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { handleDesktopSelect(e.target.files?.[0]); e.target.value = ''; }} />
                </div>

                {/* 2. Mobile Photo Upload */}
                <div>
                    <label className="admin-label" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>📱 Photo Format Mobile (Optionnelle)</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-subtle)' }}>Portrait (9:16)</span>
                    </label>

                    {mobileFile ? (
                        <div style={{
                            position: 'relative',
                            background: 'var(--admin-surface)',
                            border: '1px solid var(--admin-border)',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            aspectRatio: '16 / 9',
                            maxHeight: '200px',
                        }}>
                            <Image
                                src={URL.createObjectURL(mobileFile)}
                                alt="Aperçu mobile"
                                width={800}
                                height={450}
                                style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                                unoptimized
                            />
                            <button
                                type="button"
                                onClick={() => setMobileFile(null)}
                                title="Retirer"
                                style={{
                                    position: 'absolute', top: '8px', right: '8px',
                                    width: '28px', height: '28px',
                                    background: 'rgba(239,68,68,0.9)',
                                    border: 'none', borderRadius: '4px', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer',
                                }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <div
                            onDragOver={(e) => { e.preventDefault(); setMobileDragging(true); }}
                            onDragLeave={() => setMobileDragging(false)}
                            onDrop={(e) => { e.preventDefault(); setMobileDragging(false); handleMobileSelect(e.dataTransfer.files?.[0]); }}
                            onClick={() => mobileInputRef.current?.click()}
                            style={{
                                border: `2px dashed ${mobileDragging ? 'var(--admin-gold)' : 'var(--admin-border)'}`,
                                background: mobileDragging ? 'rgba(200,169,110,0.08)' : 'var(--admin-surface)',
                                borderRadius: '6px', padding: '1.75rem 1rem', textAlign: 'center', cursor: 'pointer'
                            }}
                        >
                            <UploadCloud size={28} style={{ color: 'var(--admin-text-subtle)', marginBottom: '0.4rem' }} />
                            <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--admin-text)', fontWeight: '600' }}>Cliquer pour la photo mobile</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-subtle)' }}>Si vide, la photo grand écran est utilisée</span>
                        </div>
                    )}
                    <input ref={mobileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { handleMobileSelect(e.target.files?.[0]); e.target.value = ''; }} />
                </div>
            </div>

            {error && (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.85rem 1rem', borderRadius: '4px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#dc2626', fontSize: '0.85rem' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--admin-border-soft)' }}>
                <button type="button" onClick={onCancel} className="admin-btn admin-btn-secondary" disabled={isPending || isCompressing}>
                    Annuler
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={isPending || isCompressing} style={{ minWidth: '150px' }}>
                    {isPending || isCompressing ? (
                        <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Traitement...</>
                    ) : 'Publier la photo'}
                </button>
            </div>
        </form>
    );
}

function EditCarouselForm({ item, onCancel }) {
    const [desktopFile, setDesktopFile] = useState(null);
    const [desktopPreview, setDesktopPreview] = useState(null);

    const [mobileFile, setMobileFile] = useState(null);
    const [mobilePreview, setMobilePreview] = useState(null);
    const [removeMobile, setRemoveMobile] = useState(false);

    const [isPending, startTransition] = useTransition();
    const [isCompressing, setIsCompressing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const desktopInputRef = useRef(null);
    const mobileInputRef = useRef(null);

    const handleDesktopSelect = (file) => {
        if (!file || !file.type.startsWith('image/')) {
            setError('Format non supporté pour la photo principale.');
            return;
        }
        setError('');
        setDesktopFile(file);
        setDesktopPreview(URL.createObjectURL(file));
    };

    const handleMobileSelect = (file) => {
        if (!file || !file.type.startsWith('image/')) {
            setError('Format non supporté pour la photo mobile.');
            return;
        }
        setError('');
        setMobileFile(file);
        setMobilePreview(URL.createObjectURL(file));
        setRemoveMobile(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const formData = new FormData(e.target);
        formData.delete('image_file');
        formData.delete('mobile_image_file');
        formData.set('id', item.id);
        if (removeMobile) formData.set('remove_mobile_image', '1');

        setIsCompressing(true);
        try {
            if (desktopFile) {
                const compressedDesktop = await compressImageFile(desktopFile, 2048, 0.85);
                formData.append('image_file', compressedDesktop);
            }
            if (mobileFile) {
                const compressedMobile = await compressImageFile(mobileFile, 2048, 0.85);
                formData.append('mobile_image_file', compressedMobile);
            }
        } catch (err) {
            console.warn('Compression fallback', err);
            if (desktopFile) formData.append('image_file', desktopFile);
            if (mobileFile) formData.append('mobile_image_file', mobileFile);
        } finally {
            setIsCompressing(false);
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
            <div style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(34,197,94,0.08)', borderRadius: '6px' }}>
                <CheckCircle2 size={32} style={{ color: '#16a34a', marginBottom: '0.5rem' }} />
                <p style={{ color: '#16a34a', fontWeight: '600', fontSize: '0.9rem' }}>Modifications enregistrées avec succès !</p>
            </div>
        );
    }

    const currentDesktopImg = desktopPreview || item.image_url;
    const currentMobileImg = !removeMobile ? (mobilePreview || item.mobile_image_url) : null;

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                    <label className="admin-label">Titre principal *</label>
                    <input type="text" name="title" defaultValue={item.title} className="admin-input" required />
                </div>
                <div>
                    <label className="admin-label">Sous-titre</label>
                    <input type="text" name="subtitle" defaultValue={item.subtitle || ''} className="admin-input" />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {/* 1. Desktop Photo */}
                <div>
                    <label className="admin-label" style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>🖥️ Photo Grand Écran (Ordinateur)</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--admin-gold)' }}>Paysage</span>
                    </label>

                    {currentDesktopImg ? (
                        <div style={{
                            position: 'relative',
                            background: 'var(--admin-surface)',
                            border: '1px solid var(--admin-border)',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            aspectRatio: '16 / 9',
                            maxHeight: '180px',
                        }}>
                            <Image
                                src={currentDesktopImg}
                                alt="Grand écran"
                                width={600}
                                height={337}
                                style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                                unoptimized
                            />
                            <button
                                type="button"
                                onClick={() => desktopInputRef.current?.click()}
                                className="admin-btn admin-btn-secondary"
                                style={{ position: 'absolute', bottom: '8px', right: '8px', fontSize: '0.75rem', padding: '5px 10px', backdropFilter: 'blur(4px)' }}
                            >
                                Remplacer
                            </button>
                        </div>
                    ) : null}
                    <input ref={desktopInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { handleDesktopSelect(e.target.files?.[0]); e.target.value = ''; }} />
                </div>

                {/* 2. Mobile Photo */}
                <div>
                    <label className="admin-label" style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>📱 Photo Format Mobile (Smartphone)</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-subtle)' }}>Portrait (Optionnel)</span>
                    </label>

                    {currentMobileImg ? (
                        <div style={{
                            position: 'relative',
                            background: 'var(--admin-surface)',
                            border: '1px solid var(--admin-border)',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            aspectRatio: '16 / 9',
                            maxHeight: '180px',
                        }}>
                            <Image
                                src={currentMobileImg}
                                alt="Mobile spécifique"
                                width={600}
                                height={337}
                                style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                                unoptimized
                            />
                            <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '6px' }}>
                                <button
                                    type="button"
                                    onClick={() => mobileInputRef.current?.click()}
                                    className="admin-btn admin-btn-secondary"
                                    style={{ fontSize: '0.75rem', padding: '5px 10px', backdropFilter: 'blur(4px)' }}
                                >
                                    Remplacer
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setMobileFile(null); setMobilePreview(null); setRemoveMobile(true); }}
                                    style={{ padding: '5px 8px', background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}
                                    title="Supprimer la photo mobile spécifique"
                                >
                                    <X size={13} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => mobileInputRef.current?.click()}
                            style={{
                                border: '2px dashed var(--admin-border)',
                                background: 'var(--admin-surface)',
                                borderRadius: '6px', padding: '1.5rem 1rem', textAlign: 'center', cursor: 'pointer'
                            }}
                        >
                            <UploadCloud size={24} style={{ color: 'var(--admin-text-subtle)', marginBottom: '0.3rem' }} />
                            <span style={{ display: 'block', fontSize: '0.82rem', color: 'var(--admin-text)', fontWeight: '600' }}>Ajouter une photo dédiée mobile</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-subtle)' }}>Par exemple votre photo portrait verticale</span>
                        </div>
                    )}
                    <input ref={mobileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { handleMobileSelect(e.target.files?.[0]); e.target.value = ''; }} />
                </div>
            </div>

            {error && (
                <div style={{ color: '#dc2626', fontSize: '0.85rem', background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: '4px' }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={onCancel} className="admin-btn admin-btn-secondary" disabled={isPending || isCompressing}>
                    Annuler
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={isPending || isCompressing}>
                    {isPending || isCompressing ? (
                        <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Enregistrement...</>
                    ) : 'Enregistrer'}
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
                    <h1 style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--admin-text)' }}>Gestion du Carrousel</h1>
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--admin-border-soft)' }}>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--admin-text)' }}>Ajouter une bannière</h2>
                        <button type="button" onClick={() => setIsAdding(false)} style={{ color: 'var(--admin-text-subtle)', cursor: 'pointer', padding: '4px', background: 'none', border: 'none' }}>
                            <X size={18} />
                        </button>
                    </div>
                    <CarouselForm onCancel={() => setIsAdding(false)} />
                </div>
            )}

            {editingItem && (
                <div className="admin-card" style={{ width: '100%', maxWidth: '800px', marginBottom: '2.5rem', border: '1px solid var(--admin-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--admin-border-soft)' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--admin-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Pencil size={16} /> Modifier la bannière
                        </h2>
                        <button type="button" onClick={() => setEditingItem(null)} style={{ color: 'var(--admin-text-subtle)', cursor: 'pointer', padding: '4px', background: 'none', border: 'none' }}>
                            <X size={18} />
                        </button>
                    </div>
                    <EditCarouselForm item={editingItem} onCancel={() => setEditingItem(null)} />
                </div>
            )}

            <div style={{ width: '100%', maxWidth: '800px' }}>
                <h2 style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-text-subtle)', marginBottom: '1rem' }}>
                    Bannières actuelles ({images.length})
                </h2>

                {images.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3.5rem 2rem', background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: '6px', color: 'var(--admin-text-muted)' }}>
                        Aucune photo dans le carrousel.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                        {images.map(img => (
                            <div key={img.id} className="admin-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                <div style={{ height: '150px', width: '100%', overflow: 'hidden', position: 'relative', background: 'var(--admin-surface)' }}>
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
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-subtle)' }}>
                                            <ImageIcon size={32} />
                                        </div>
                                    )}

                                    {/* Action Buttons: Edit + Delete */}
                                    <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '6px' }}>
                                        <button
                                            onClick={() => { setEditingItem(img); setIsAdding(false); }}
                                            style={{ width: '30px', height: '30px', borderRadius: '4px', background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
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
                                                style={{ width: '30px', height: '30px', borderRadius: '4px', background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
                                                title="Supprimer"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {img.mobile_image_url && (
                                        <div style={{
                                            position: 'absolute', bottom: '8px', left: '8px',
                                            background: 'rgba(14,13,12,0.85)',
                                            border: '1px solid rgba(200,169,110,0.4)',
                                            color: '#C8A96E', fontSize: '0.68rem', fontWeight: '700',
                                            padding: '2px 7px', borderRadius: '3px',
                                        }}>
                                            📱 Photo Mobile incluse
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '0.85rem 1rem' }}>
                                    <h3 style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--admin-text)' }}>{img.title}</h3>
                                    {img.subtitle && <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{img.subtitle}</p>}
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

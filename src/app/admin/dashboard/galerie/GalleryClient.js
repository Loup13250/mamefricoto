'use client';
import { useState, useRef, useTransition } from 'react';
import Image from 'next/image';
import { addGalleryPost, editGalleryPost, deleteGalleryPost, reorderGalleryPost, moveGalleryPostPosition } from '@/app/actions';
import {
    Plus, Trash2, Pencil, X, Film, UploadCloud, Loader2,
    CheckCircle2, AlertCircle, Play, ArrowLeft, ArrowRight
} from 'lucide-react';

/* =====================================================
   PRÉVISUALISATION MEDIA (image ou vidéo)
   ===================================================== */
function MediaPreview({ file, onRemove }) {
    const isVideo = file.type.startsWith('video/');
    const src = URL.createObjectURL(file);

    return (
        <div style={{
            position: 'relative',
            background: 'var(--admin-surface)',
            border: '1px solid var(--admin-border)',
            borderRadius: '6px',
            overflow: 'hidden',
            aspectRatio: '1 / 1',
        }}>
            {isVideo ? (
                <>
                    <video
                        src={src}
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{
                        position: 'absolute', top: '8px', left: '8px',
                        background: 'rgba(14,13,12,0.85)',
                        border: '1px solid rgba(200,169,110,0.3)',
                        color: '#C8A96E',
                        fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.1em',
                        padding: '3px 8px', borderRadius: '3px', textTransform: 'uppercase',
                        display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                        <Play size={10} fill="currentColor" /> Vidéo
                    </div>
                </>
            ) : (
                <Image
                    src={src}
                    alt="Aperçu"
                    width={300}
                    height={300}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    unoptimized
                />
            )}

            <button
                type="button"
                onClick={onRemove}
                title="Retirer"
                style={{
                    position: 'absolute', top: '8px', right: '8px',
                    width: '28px', height: '28px',
                    background: 'rgba(239,68,68,0.9)',
                    border: 'none', borderRadius: '3px', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                }}
            >
                <X size={14} />
            </button>

            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '4px 6px',
                background: 'rgba(14,13,12,0.85)',
                fontSize: '0.7rem', color: '#FDFBF7',
                textAlign: 'center',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
                {file.name}
            </div>
        </div>
    );
}

/* =====================================================
   COMPRESSION IMAGE
   ===================================================== */
async function compressImageFile(file, maxDim = 1200, quality = 0.80) {
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

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            resolve(file);
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

export default function GalleryClient({ posts }) {
    const [prevPosts, setPrevPosts] = useState(posts);
    const [items, setItems] = useState(posts);
    if (posts !== prevPosts) {
        setPrevPosts(posts);
        setItems(posts);
    }

    const [isAdding, setIsAdding] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [editSuccess, setEditSuccess] = useState(false);
    const [editError, setEditError] = useState('');
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleting, startDeleteTransition] = useTransition();
    const inputRef = useRef(null);
    const formRef = useRef(null);

    const handleFileSelect = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            setError('Format non supporté. Utilisez JPG, PNG, WEBP, MP4, MOV ou WEBM.');
            return;
        }

        const maxMB = 15;
        if (file.size > maxMB * 1024 * 1024) {
            setError(`Ce fichier fait ${(file.size / (1024 * 1024)).toFixed(1)} Mo. Veuillez choisir un fichier de moins de 15 Mo.`);
            setSelectedFile(null);
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

        // On supprime les champs natifs du file input et on injecte notre fichier proprement
        formData.delete('image_file');
        if (selectedFile) {
            if (selectedFile.type.startsWith('image/')) {
                const compressed = await compressImageFile(selectedFile, 1200, 0.80);
                formData.append('image_file', compressed);
            } else {
                formData.append('image_file', selectedFile);
            }
        }

        if (selectedFile?.type.startsWith('video/')) {
            formData.set('media_type', 'video');
        }

        if (!selectedFile && !formData.get('image_url')) {
            setError('Veuillez sélectionner un fichier ou coller une URL.');
            return;
        }

        startTransition(async () => {
            const result = await addGalleryPost(formData);
            if (result?.error) {
                setError(result.error);
            } else {
                setSuccess(true);
                setSelectedFile(null);
                formRef.current?.reset();
                setTimeout(() => {
                    setSuccess(false);
                    setIsAdding(false);
                }, 1500);
            }
        });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditError('');
        const formData = new FormData(e.target);
        startTransition(async () => {
            const result = await editGalleryPost(formData);
            if (result?.error) {
                setEditError(result.error);
            } else {
                setEditSuccess(true);
                setTimeout(() => {
                    setEditSuccess(false);
                    setEditingPost(null);
                }, 900);
            }
        });
    };

    const handleReorder = (id, direction) => {
        setItems(prev => {
            const idx = prev.findIndex(p => p.id === id);
            if (idx === -1) return prev;
            const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (targetIdx < 0 || targetIdx >= prev.length) return prev;
            const next = [...prev];
            const [moved] = next.splice(idx, 1);
            next.splice(targetIdx, 0, moved);
            return next;
        });
        startDeleteTransition(async () => {
            await reorderGalleryPost(id, direction);
        });
    };

    const handleMovePosition = (id, targetPos) => {
        setItems(prev => {
            const idx = prev.findIndex(p => p.id === id);
            if (idx === -1) return prev;
            const targetIdx = Math.max(0, Math.min(prev.length - 1, targetPos - 1));
            if (idx === targetIdx) return prev;
            const next = [...prev];
            const [moved] = next.splice(idx, 1);
            next.splice(targetIdx, 0, moved);
            return next;
        });
        startDeleteTransition(async () => {
            await moveGalleryPostPosition(id, targetPos);
        });
    };

    const handleDelete = (id) => {
        setItems(prev => prev.filter(p => p.id !== id));
        startDeleteTransition(async () => {
            await deleteGalleryPost(id);
            setDeleteId(null);
        });
    };

    const resetForm = () => {
        setIsAdding(false);
        setSelectedFile(null);
        setError('');
        setSuccess(false);
        formRef.current?.reset();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

            {/* Header */}
            <div style={{ width: '100%', maxWidth: '900px', marginBottom: '2rem' }}>
                <h1 className="admin-page-title">Galerie — Photos &amp; Vidéos</h1>
                <p style={{ color: 'var(--admin-text-muted)', marginBottom: '1.25rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    Ajoutez et gérez vos photos et vidéos de cuisine. Modifiez leurs titres et légendes en français et en anglais pour la page publique <strong>Galerie</strong>.
                </p>

                {/* BANDEAU CAPACITÉ */}
                <div style={{
                    background: 'var(--admin-surface, #1e1b18)',
                    border: '1px solid var(--admin-border, #332d27)',
                    borderRadius: '8px',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.5rem',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-gold, #C8A96E)' }}>
                                Capacité de la vitrine
                            </span>
                            <span style={{
                                fontSize: '0.8rem',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: items.length >= 30 ? 'rgba(239,68,68,0.2)' : 'rgba(200,169,110,0.2)',
                                color: items.length >= 30 ? '#ef4444' : 'var(--admin-gold, #C8A96E)',
                                fontWeight: '700'
                            }}>
                                {items.length} / 30 médias
                            </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-subtle, #888)' }}>
                            {items.length >= 30 ? 'Capacité maximale atteinte (30/30)' : `${30 - items.length} emplacement(s) disponible(s)`}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                        width: '100%',
                        height: '6px',
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            width: `${Math.min(100, (items.length / 30) * 100)}%`,
                            height: '100%',
                            background: items.length >= 30 ? '#ef4444' : 'var(--admin-gold, #C8A96E)',
                            transition: 'width 0.4s ease',
                        }} />
                    </div>
                </div>

                {!isAdding && !editingPost && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="admin-btn admin-btn-primary"
                        aria-label="Ajouter une nouvelle photo ou vidéo"
                    >
                        <Plus size={16} /> Ajouter une photo / vidéo
                    </button>
                )}
            </div>

            {/* MODAL ÉDITION FR / EN */}
            {editingPost && (
                <div
                    className="admin-modal-backdrop"
                    onClick={() => setEditingPost(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(6px)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem',
                    }}
                >
                    <div
                        className="admin-modal-card"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'var(--admin-surface, #1e1b18)',
                            border: '1px solid var(--admin-gold, #C8A96E)',
                            borderRadius: '8px',
                            width: '100%',
                            maxWidth: '720px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            padding: '2rem',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                            position: 'relative',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--admin-border-soft, #332d27)' }}>
                            <h2 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--admin-gold, #C8A96E)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                <Pencil size={18} /> Modifier les textes (FR / EN)
                            </h2>
                            <button
                                type="button"
                                onClick={() => setEditingPost(null)}
                                style={{ color: 'var(--admin-text-subtle, #888)', cursor: 'pointer', padding: '6px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                aria-label="Fermer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {editSuccess ? (
                            <div style={{ padding: '2.5rem', textAlign: 'center', background: 'rgba(34,197,94,0.08)', borderRadius: '6px' }}>
                                <CheckCircle2 size={40} style={{ color: '#16a34a', marginBottom: '0.75rem' }} />
                                <p style={{ color: '#16a34a', fontWeight: '600', fontSize: '1.05rem', margin: 0 }}>Modifications enregistrées avec succès !</p>
                            </div>
                        ) : (
                            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <input type="hidden" name="id" value={editingPost.id} />

                                {/* Thumbnail preview */}
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', border: '1px solid var(--admin-border, #332d27)' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, position: 'relative', background: '#000' }}>
                                        {editingPost.media_type === 'video' ? (
                                            <video src={editingPost.image_url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <Image src={editingPost.image_url} alt="Photo" width={64} height={64} style={{ width: '100%', height: '100%', objectFit: 'cover' }} unoptimized />
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text, #FDFBF7)' }}>
                                            {editingPost.title || 'Publication sans titre'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-subtle, #999)', marginTop: '2px' }}>
                                            {editingPost.media_type === 'video' ? 'Vidéo' : 'Photo'} — Modification des textes en français et en anglais
                                        </div>
                                    </div>
                                </div>

                                {/* Titres FR / EN */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                    <div>
                                        <label className="admin-label" style={{ fontWeight: '600', color: 'var(--admin-gold, #C8A96E)' }}>
                                            FR — Titre / Plat (Français)
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            defaultValue={editingPost.title || ''}
                                            className="admin-input"
                                            placeholder="Ex : Risotto crémeux aux gambas"
                                        />
                                    </div>
                                    <div>
                                        <label className="admin-label" style={{ fontWeight: '600', color: 'var(--admin-gold, #C8A96E)' }}>
                                            EN — Title / Dish (English)
                                        </label>
                                        <input
                                            type="text"
                                            name="title_en"
                                            defaultValue={editingPost.title_en || ''}
                                            className="admin-input"
                                            placeholder="e.g. Creamy King Prawn Risotto"
                                        />
                                    </div>
                                </div>

                                {/* Légendes FR / EN */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                    <div>
                                        <label className="admin-label">FR — Légende / Description (Français)</label>
                                        <textarea
                                            name="caption"
                                            defaultValue={editingPost.caption || ''}
                                            className="admin-input"
                                            rows="3"
                                            placeholder="Ex : Préparation du buffet dînatoire en direct du labo..."
                                        />
                                    </div>
                                    <div>
                                        <label className="admin-label">EN — Caption / Description (English)</label>
                                        <textarea
                                            name="caption_en"
                                            defaultValue={editingPost.caption_en || ''}
                                            className="admin-input"
                                            rows="3"
                                            placeholder="e.g. Freshly prepared buffet live from our kitchen..."
                                        />
                                    </div>
                                </div>

                                {editError && (
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem', borderRadius: '4px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#dc2626', fontSize: '0.85rem' }}>
                                        <AlertCircle size={16} /> {editError}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--admin-border-soft, #332d27)' }}>
                                    <button type="button" onClick={() => setEditingPost(null)} className="admin-btn admin-btn-secondary" disabled={isPending}>
                                        Annuler
                                    </button>
                                    <button type="submit" className="admin-btn admin-btn-primary" disabled={isPending} style={{ minWidth: '160px' }}>
                                        {isPending ? (
                                            <><Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Enregistrement...</>
                                        ) : 'Enregistrer les textes'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* FORMULAIRE AJOUT */}
            {isAdding && (
                <div className="admin-card" style={{ width: '100%', maxWidth: '900px', marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--admin-border-soft)' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--admin-text)' }}>Publier une réalisation</h2>
                        <button type="button" onClick={resetForm} style={{ color: 'var(--admin-text-subtle)', cursor: 'pointer', padding: '6px', background: 'none', border: 'none' }}>
                            <X size={20} />
                        </button>
                    </div>

                    {success ? (
                        <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px' }}>
                            <CheckCircle2 size={40} style={{ color: '#16a34a', marginBottom: '1rem' }} />
                            <p style={{ color: '#16a34a', fontWeight: '600' }}>Publication réussie !</p>
                        </div>
                    ) : (
                        <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* Dropzone / Preview */}
                            {selectedFile ? (
                                <div>
                                    <p style={{ fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--admin-gold)', marginBottom: '0.75rem' }}>
                                        Aperçu — Prêt à publier
                                    </p>
                                    <div style={{ maxWidth: '280px' }}>
                                        <MediaPreview file={selectedFile} onRemove={() => setSelectedFile(null)} />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="admin-label" style={{ marginBottom: '0.75rem', display: 'block' }}>
                                        Fichier (image ou vidéo) *
                                    </label>
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={handleDrop}
                                        onClick={() => inputRef.current?.click()}
                                        style={{
                                            border: `2px dashed ${isDragging ? 'var(--admin-gold)' : 'var(--admin-border)'}`,
                                            background: isDragging ? 'rgba(200,169,110,0.08)' : 'var(--admin-surface)',
                                            borderRadius: '6px',
                                            padding: '2.5rem 1rem',
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                            gap: '0.5rem', cursor: 'pointer',
                                            transition: 'all 0.25s ease',
                                        }}
                                    >
                                        <UploadCloud size={36} style={{ color: isDragging ? 'var(--admin-gold)' : 'var(--admin-text-subtle)' }} />
                                        <span style={{ fontWeight: '600', color: 'var(--admin-text)', fontSize: '0.95rem' }}>
                                            Glisser le fichier ici, ou cliquer pour choisir
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-subtle)' }}>
                                            Images (JPG, PNG, WEBP) ou Vidéos (MP4, MOV, WEBM)
                                        </span>
                                        <input
                                            ref={inputRef}
                                            type="file"
                                            name="image_file"
                                            accept="image/*,video/*"
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleFileSelect(file);
                                                e.target.value = '';
                                            }}
                                        />
                                    </div>

                                    {/* URL alternative */}
                                    <div style={{ marginTop: '1rem' }}>
                                        <label className="admin-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                            Ou coller une URL web (optionnel)
                                        </label>
                                        <input
                                            type="url"
                                            name="image_url"
                                            placeholder="https://..."
                                            className="admin-input"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Type de média (hidden auto-détecté) */}
                            <input
                                type="hidden"
                                name="media_type"
                                value={selectedFile?.type.startsWith('video/') ? 'video' : 'image'}
                            />

                            {/* Titres FR / EN */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                <div>
                                    <label className="admin-label">FR — Titre / Plat (Français)</label>
                                    <input
                                        type="text"
                                        name="title"
                                        className="admin-input"
                                        placeholder="Ex : Risotto crémeux aux gambas"
                                    />
                                </div>
                                <div>
                                    <label className="admin-label">EN — Title / Dish (English)</label>
                                    <input
                                        type="text"
                                        name="title_en"
                                        className="admin-input"
                                        placeholder="e.g. Creamy King Prawn Risotto"
                                    />
                                </div>
                            </div>

                            {/* Légendes FR / EN */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                <div>
                                    <label className="admin-label">FR — Légende (Français)</label>
                                    <textarea
                                        name="caption"
                                        className="admin-input"
                                        rows="2"
                                        placeholder="Ex : Préparation du buffet dînatoire en direct du labo..."
                                    />
                                </div>
                                <div>
                                    <label className="admin-label">EN — Caption (English)</label>
                                    <textarea
                                        name="caption_en"
                                        className="admin-input"
                                        rows="2"
                                        placeholder="e.g. Freshly prepared buffet live from our kitchen..."
                                    />
                                </div>
                            </div>

                            {error && (
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '1rem', borderRadius: '4px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#dc2626', fontSize: '0.9rem' }}>
                                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                                    {error}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--admin-border-soft)' }}>
                                <button type="button" onClick={resetForm} className="admin-btn admin-btn-secondary" disabled={isPending}>
                                    Annuler
                                </button>
                                <button type="submit" className="admin-btn admin-btn-primary" disabled={isPending} style={{ minWidth: '160px' }}>
                                    {isPending ? (
                                        <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Upload en cours...</>
                                    ) : 'Publier la réalisation'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* GRILLE DES PUBLICATIONS */}
            <div style={{ width: '100%', maxWidth: '900px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-text-subtle)', margin: 0 }}>
                        Publications ({items.length})
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                        Cliquez sur &quot;Modifier&quot; pour éditer les textes FR et EN
                    </span>
                </div>

                {items.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: '6px', color: 'var(--admin-text-muted)' }}>
                        Aucune publication pour le moment.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                        {items.map((post, idx) => (
                            <div
                                key={post.id}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    background: 'var(--admin-surface, #1e1b18)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--admin-border, #332d27)',
                                    overflow: 'hidden',
                                    transition: 'border-color 0.2s ease',
                                }}
                            >
                                {/* Media Thumbnail */}
                                <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: '#000' }}>
                                    {post.media_type === 'video' ? (
                                        <>
                                            <video src={post.image_url} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.7)', color: 'var(--admin-gold, #C8A96E)', fontSize: '0.65rem', fontWeight: '700', padding: '3px 8px', borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '4px', letterSpacing: '0.08em', textTransform: 'uppercase', border: '1px solid rgba(200,169,110,0.3)' }}>
                                                <Film size={11} /> Vidéo
                                            </div>
                                        </>
                                    ) : (
                                        <Image
                                            src={post.image_url}
                                            alt={post.title || 'Photo galerie'}
                                            width={400}
                                            height={300}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            unoptimized
                                        />
                                    )}

                                    {/* Badge position */}
                                    <div style={{
                                        position: 'absolute', top: '8px', right: '8px',
                                        background: 'rgba(0,0,0,0.75)', color: 'var(--admin-gold, #C8A96E)',
                                        fontSize: '0.7rem', fontWeight: '700',
                                        padding: '2px 8px', borderRadius: '3px',
                                        border: '1px solid rgba(200,169,110,0.3)',
                                    }}>
                                        #{idx + 1}
                                    </div>
                                </div>

                                {/* Text content preview */}
                                <div style={{ padding: '0.9rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text, #FDFBF7)', display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                                        <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '2px', background: 'rgba(200,169,110,0.15)', color: 'var(--admin-gold)', fontWeight: '700' }}>FR</span>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {post.title ? post.title : <em style={{ color: 'var(--admin-text-subtle)', fontWeight: '400' }}>Sans titre</em>}
                                        </span>
                                    </div>

                                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text, #FDFBF7)', display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                                        <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)', color: 'var(--admin-text-subtle)', fontWeight: '700' }}>EN</span>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {post.title_en ? post.title_en : <em style={{ color: 'var(--admin-text-subtle)', fontWeight: '400' }}>No English title</em>}
                                        </span>
                                    </div>

                                    {(post.caption || post.caption_en) && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted, #aaa)', lineHeight: '1.4', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                            {post.caption || post.caption_en}
                                        </div>
                                    )}
                                </div>

                                {/* Card Actions bar */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.6rem 0.8rem',
                                    background: 'rgba(0,0,0,0.2)',
                                    borderTop: '1px solid var(--admin-border-soft, #332d27)',
                                }}>
                                    {/* Reorder Left/Right & Direct Position Select */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <button
                                            onClick={() => handleReorder(post.id, 'up')}
                                            disabled={idx === 0 || isDeleting}
                                            title="Déplacer vers la gauche"
                                            aria-label={`Déplacer ${post.title || 'cette photo'} vers la gauche`}
                                            style={{
                                                width: '28px', height: '28px',
                                                background: idx === 0 ? 'transparent' : 'rgba(200,169,110,0.15)',
                                                border: '1px solid rgba(200,169,110,0.25)',
                                                color: idx === 0 ? 'rgba(255,255,255,0.15)' : 'var(--admin-gold)',
                                                borderRadius: '3px', cursor: idx === 0 ? 'default' : 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}
                                        >
                                            <ArrowLeft size={13} />
                                        </button>
                                        <button
                                            onClick={() => handleReorder(post.id, 'down')}
                                            disabled={idx === items.length - 1 || isDeleting}
                                            title="Déplacer vers la droite"
                                            aria-label={`Déplacer ${post.title || 'cette photo'} vers la droite`}
                                            style={{
                                                width: '28px', height: '28px',
                                                background: idx === items.length - 1 ? 'transparent' : 'rgba(200,169,110,0.15)',
                                                border: '1px solid rgba(200,169,110,0.25)',
                                                color: idx === items.length - 1 ? 'rgba(255,255,255,0.15)' : 'var(--admin-gold)',
                                                borderRadius: '3px', cursor: idx === items.length - 1 ? 'default' : 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}
                                        >
                                            <ArrowRight size={13} />
                                        </button>

                                        {/* Sélecteur de position directe (ex : #1 vers #4) */}
                                        <select
                                            value={idx + 1}
                                            disabled={isDeleting}
                                            onChange={(e) => {
                                                const targetPos = parseInt(e.target.value, 10);
                                                if (targetPos && targetPos !== idx + 1) {
                                                    handleMovePosition(post.id, targetPos);
                                                }
                                            }}
                                            title="Changer directement l'emplacement (ex : placer en #4)"
                                            aria-label={`Changer la position de ${post.title || 'cette réalisation'}`}
                                            style={{
                                                height: '28px',
                                                padding: '0 6px',
                                                background: 'rgba(200,169,110,0.15)',
                                                border: '1px solid rgba(200,169,110,0.3)',
                                                color: 'var(--admin-gold, #C8A96E)',
                                                borderRadius: '3px',
                                                fontSize: '0.75rem',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                outline: 'none',
                                            }}
                                        >
                                            {items.map((_, pIdx) => (
                                                <option key={pIdx + 1} value={pIdx + 1} style={{ background: '#1e1b18', color: '#FDFBF7' }}>
                                                    #{pIdx + 1}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Edit & Delete */}
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <button
                                            onClick={() => setEditingPost(post)}
                                            style={{
                                                padding: '4px 10px',
                                                background: 'rgba(200,169,110,0.2)',
                                                border: '1px solid var(--admin-gold)',
                                                color: 'var(--admin-gold)',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                            }}
                                            title="Modifier les textes FR &amp; EN"
                                            aria-label={`Modifier les textes FR et EN de ${post.title || 'cette publication'}`}
                                        >
                                            <Pencil size={12} /> Modifier
                                        </button>

                                        {deleteId === post.id ? (
                                            <div style={{ display: 'flex', gap: '3px' }}>
                                                <button
                                                    onClick={() => handleDelete(post.id)}
                                                    disabled={isDeleting}
                                                    aria-label="Confirmer la suppression"
                                                    style={{ padding: '4px 8px', background: 'rgba(239,68,68,0.9)', border: 'none', color: 'white', borderRadius: '3px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer' }}
                                                >
                                                    {isDeleting ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : 'Oui'}
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(null)}
                                                    aria-label="Annuler la suppression"
                                                    style={{ width: '24px', height: '24px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setDeleteId(post.id)}
                                                style={{ width: '28px', height: '28px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                title="Supprimer"
                                                aria-label={`Supprimer la publication ${post.title || ''}`}
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .admin-page-title { font-size: 1.6rem; font-weight: 700; color: var(--admin-text); margin-bottom: 0.5rem; }
            `}</style>
        </div>
    );
}

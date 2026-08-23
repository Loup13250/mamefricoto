'use client';
import { useState, useRef, useTransition, useCallback } from 'react';
import Image from 'next/image';
import { addGalleryPost, deleteGalleryPost, reorderGalleryPost } from '@/app/actions';
import {
    Plus, Trash2, X, Film, UploadCloud, Loader2,
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
                        style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block' }}
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
                    style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block' }}
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
   COMPOSANT PRINCIPAL
   ===================================================== */
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
    const [isAdding, setIsAdding] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
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
                const compressed = await compressImageFile(selectedFile, 2048, 0.85);
                formData.append('image_file', compressed);
            } else {
                formData.append('image_file', selectedFile);
            }
        }

        // S'assurer que media_type est correct selon le fichier
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

    const handleDelete = (id) => {
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
            <div style={{ width: '100%', maxWidth: '760px', marginBottom: '2.5rem' }}>
                <h1 className="admin-page-title">Nos Réalisations — Photos &amp; Vidéos</h1>
                <p style={{ color: 'var(--admin-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    Ajoutez vos photos et vidéos de cuisine. Elles s&apos;affichent sur la page publique dédiée <strong>Nos Réalisations (Les Coulisses de la Cuisine)</strong>.
                </p>
                {!isAdding && (
                    <button onClick={() => setIsAdding(true)} className="admin-btn admin-btn-primary">
                        <Plus size={16} /> Ajouter une photo / vidéo
                    </button>
                )}
            </div>

            {/* Formulaire ajout */}
            {isAdding && (
                <div className="admin-card" style={{ width: '100%', maxWidth: '760px', marginBottom: '3rem' }}>
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

                            {/* Prévisualisation du fichier sélectionné */}
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
                                /* Dropzone */
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

                            {/* Titre */}
                            <div>
                                <label className="admin-label">Titre / Nom du plat (optionnel)</label>
                                <input
                                    type="text"
                                    name="title"
                                    className="admin-input"
                                    placeholder="Ex : Risotto crémeux aux gambas"
                                />
                            </div>

                            {/* Légende */}
                            <div>
                                <label className="admin-label">Légende (optionnel)</label>
                                <textarea
                                    name="caption"
                                    className="admin-input"
                                    rows="2"
                                    placeholder="Ex : Préparation du buffet dînatoire en direct du labo..."
                                />
                            </div>

                            {/* Erreur */}
                            {error && (
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '1rem', borderRadius: '4px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#dc2626', fontSize: '0.9rem' }}>
                                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                                    {error}
                                </div>
                            )}

                            {/* Boutons */}
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

            {/* Grille des publications */}
            <div style={{ width: '100%', maxWidth: '760px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-text-subtle)', marginBottom: '1.25rem' }}>
                    Publications ({posts.length})
                </h2>

                {posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: '6px', color: 'var(--admin-text-muted)' }}>
                        Aucune publication pour le moment.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                        {posts.map((post, idx) => (
                            <div key={post.id} style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', background: 'var(--admin-surface)', borderRadius: '6px', border: '1px solid var(--admin-border)' }}>
                                {post.media_type === 'video' ? (
                                    <>
                                        <video src={post.image_url} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'var(--admin-card-bg)', color: 'var(--admin-gold)', fontSize: '0.65rem', fontWeight: '700', padding: '2px 7px', borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '3px', letterSpacing: '0.1em', textTransform: 'uppercase', border: '1px solid var(--admin-border)' }}>
                                            <Film size={10} /> Vidéo
                                        </div>
                                    </>
                                ) : (
                                    <Image src={post.image_url} alt={post.title || ''} width={400} height={400} style={{ width: '100%', height: 'auto', objectFit: 'cover' }} unoptimized />
                                )}

                                {/* Badge position */}
                                <div style={{
                                    position: 'absolute', top: '6px', right: '6px',
                                    background: 'var(--admin-card-bg)', color: 'var(--admin-gold)',
                                    fontSize: '0.65rem', fontWeight: '700',
                                    padding: '2px 7px', borderRadius: '3px',
                                    border: '1px solid var(--admin-border)',
                                }}>
                                    #{idx + 1}
                                </div>

                                {/* Hover overlay with Actions & Reordering */}
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'rgba(14,13,12,0.85)',
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    gap: '0.6rem',
                                    opacity: 0, transition: 'opacity 0.25s',
                                    padding: '0.5rem',
                                }}
                                    className="gallery-item-overlay"
                                >
                                    {post.title && <p style={{ color: '#FDFBF7', fontSize: '0.82rem', fontWeight: '600', textAlign: 'center', margin: 0, lineClamp: 2 }}>{post.title}</p>}

                                    {/* Reorder Buttons */}
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <button
                                            onClick={() => startDeleteTransition(() => reorderGalleryPost(post.id, 'up'))}
                                            disabled={idx === 0 || isDeleting}
                                            title="Déplacer vers la gauche / plus haut"
                                            style={{
                                                width: '30px', height: '30px',
                                                background: idx === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(200,169,110,0.2)',
                                                border: '1px solid rgba(200,169,110,0.3)',
                                                color: idx === 0 ? 'rgba(255,255,255,0.2)' : 'var(--admin-gold)',
                                                borderRadius: '3px', cursor: idx === 0 ? 'default' : 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}
                                        >
                                            <ArrowLeft size={14} />
                                        </button>
                                        <button
                                            onClick={() => startDeleteTransition(() => reorderGalleryPost(post.id, 'down'))}
                                            disabled={idx === posts.length - 1 || isDeleting}
                                            title="Déplacer vers la droite / plus bas"
                                            style={{
                                                width: '30px', height: '30px',
                                                background: idx === posts.length - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(200,169,110,0.2)',
                                                border: '1px solid rgba(200,169,110,0.3)',
                                                color: idx === posts.length - 1 ? 'rgba(255,255,255,0.2)' : 'var(--admin-gold)',
                                                borderRadius: '3px', cursor: idx === posts.length - 1 ? 'default' : 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}
                                        >
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>

                                    {deleteId === post.id ? (
                                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                            <button
                                                onClick={() => handleDelete(post.id)}
                                                disabled={isDeleting}
                                                style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.9)', border: 'none', color: 'white', borderRadius: '3px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                                            >
                                                {isDeleting ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : 'Confirmer ?'}
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(null)}
                                                style={{ width: '28px', height: '28px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setDeleteId(post.id)}
                                            style={{ width: '32px', height: '32px', background: 'rgba(239,68,68,0.85)', border: 'none', color: 'white', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: '2px' }}
                                            title="Supprimer"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .admin-page-title { font-size: 1.6rem; font-weight: 700; color: var(--admin-text); margin-bottom: 0.5rem; }
                .gallery-item-overlay { opacity: 0 !important; }
                div:has(> .gallery-item-overlay):hover .gallery-item-overlay { opacity: 1 !important; }
            `}</style>
        </div>
    );
}

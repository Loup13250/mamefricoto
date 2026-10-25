'use client';
import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { addGalleryPost, editGalleryPost, deleteGalleryPost, reorderGalleryPost, moveGalleryPostPosition, seedSampleGalleryPosts } from '@/app/actions';
import ImageCropperModal, { GALLERY_CROP_TARGETS, uid } from '@/components/admin/ImageCropper';
import {
    Plus, Trash2, Pencil, X, Film, UploadCloud, Loader2,
    CheckCircle2, AlertCircle, Play, ArrowLeft, ArrowRight, Crop, Sparkles, Camera
} from 'lucide-react';

/* =====================================================
   PRÉVISUALISATION MEDIA (image ou vidéo)
   ===================================================== */
function MediaPreview({ file, onRemove, onRecrop }) {
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

            <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                {!isVideo && onRecrop && (
                    <button
                        type="button"
                        onClick={onRecrop}
                        title="Recadrer cette photo"
                        aria-label="Recadrer cette photo"
                        style={{
                            width: '28px', height: '28px',
                            background: 'linear-gradient(135deg, #C85B3F 0%, #B54A2F 100%)',
                            border: 'none', borderRadius: '4px', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                        }}
                    >
                        <Crop size={14} strokeWidth={2.2} />
                    </button>
                )}
                <button
                    type="button"
                    onClick={onRemove}
                    title="Retirer"
                    aria-label="Retirer"
                    style={{
                        width: '28px', height: '28px',
                        background: 'rgba(239,68,68,0.9)',
                        border: 'none', borderRadius: '3px', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <X size={14} />
                </button>
            </div>

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
    const [selectedThumbnail, setSelectedThumbnail] = useState(null);
    const [batchFiles, setBatchFiles] = useState([]); // [{ id, file, thumbnail, name, title, title_en, caption, caption_en }]
    const [batchPublishing, setBatchPublishing] = useState(null); // { done, total }
    const [cropper, setCropper] = useState(null); // { mode: 'new' | 'recrop', post?, items }
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
    const router = useRouter();
    const [isSeeding, setIsSeeding] = useState(false);

    const handleSeed = async () => {
        if (!confirm("Veux-tu restaurer 3 exemples de réalisations culinaires dans la galerie ?")) return;
        setIsSeeding(true);
        try {
            const res = await seedSampleGalleryPosts();
            if (res?.error) {
                alert(res.error);
            } else {
                router.refresh();
            }
        } catch (e) {
            alert("Erreur lors de la restauration : " + e.message);
        } finally {
            setIsSeeding(false);
        }
    };

    const handleFilesSelect = (fileList) => {
        const all = Array.from(fileList || []);
        if (all.length === 0) return;

        const maxMB = 20;
        const tooLarge = all.filter(f => f.size > maxMB * 1024 * 1024);
        if (tooLarge.length > 0) {
            setError(`${tooLarge.length} fichier(s) dépasse(nt) la limite de 20 Mo.`);
            return;
        }

        const valid = all.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
        if (valid.length < all.length) {
            setError(`${all.length - valid.length} fichier(s) ignoré(s) : seuls les formats JPG, PNG, WEBP, MP4, MOV ou WEBM sont acceptés.`);
        } else {
            setError('');
        }

        const videos = valid.filter(f => f.type.startsWith('video/'));
        const images = valid.filter(f => f.type.startsWith('image/'));

        if (videos.length > 0 && images.length === 0) {
            setSelectedFile(videos[0]);
            setBatchFiles([]);
            return;
        }

        if (images.length > 0) {
            setCropper({
                mode: 'new',
                items: images.map(f => ({ id: uid(), file: f, name: f.name })),
            });
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.length > 0) {
            handleFilesSelect(e.dataTransfer.files);
        }
    };

    const handleCropped = (results) => {
        if (!results || results.length === 0) {
            setCropper(null);
            return;
        }

        if (cropper?.mode === 'new') {
            if (results.length === 1) {
                setSelectedFile(results[0].outputs.image || results[0].original);
                setSelectedThumbnail(results[0].outputs.thumbnail || null);
                setBatchFiles([]);
            } else {
                setSelectedFile(null);
                setSelectedThumbnail(null);
                setBatchFiles(results.map(r => ({
                    id: r.id,
                    file: r.outputs.image || r.original,
                    thumbnail: r.outputs.thumbnail || null,
                    name: r.name,
                    title: '',
                    title_en: '',
                    caption: '',
                    caption_en: '',
                })));
            }
        } else if (cropper?.mode === 'recrop') {
            const post = cropper.post;
            const croppedImage = results[0]?.outputs.image || results[0]?.original;
            const croppedThumb = results[0]?.outputs.thumbnail || null;
            if (post && (croppedImage || croppedThumb)) {
                startTransition(async () => {
                    const fd = new FormData();
                    fd.append('id', post.id);
                    if (croppedImage) fd.append('image_file', croppedImage);
                    if (croppedThumb) fd.append('thumbnail_file', croppedThumb);
                    const res = await editGalleryPost(fd);
                    if (res?.error) {
                        setError(res.error);
                    } else {
                        const tempUrl = croppedImage ? URL.createObjectURL(croppedImage) : post.image_url;
                        const tempThumbUrl = croppedThumb ? URL.createObjectURL(croppedThumb) : (post.thumbnail_url || tempUrl);
                        setItems(prev => prev.map(p => p.id === post.id ? { ...p, image_url: tempUrl, thumbnail_url: tempThumbUrl } : p));
                        if (editingPost?.id === post.id) {
                            setEditingPost(prev => prev ? { ...prev, image_url: tempUrl, thumbnail_url: tempThumbUrl } : null);
                        }
                    }
                });
            }
        }
        setCropper(null);
    };

    const handleBatchPublish = async () => {
        if (!batchFiles || batchFiles.length === 0) return;
        setError('');
        setBatchPublishing({ done: 0, total: batchFiles.length });

        try {
            for (let i = 0; i < batchFiles.length; i++) {
                const item = batchFiles[i];
                const fd = new FormData();
                fd.append('image_file', item.file);
                if (item.thumbnail) {
                    fd.append('thumbnail_file', item.thumbnail);
                }
                fd.append('title', item.title || '');
                fd.append('title_en', item.title_en || '');
                fd.append('caption', item.caption || '');
                fd.append('caption_en', item.caption_en || '');
                fd.append('media_type', 'image');
                const res = await addGalleryPost(fd);
                if (res?.error) throw new Error(res.error);
                setBatchPublishing({ done: i + 1, total: batchFiles.length });
            }
            setSuccess(true);
            setBatchFiles([]);
            setTimeout(() => {
                setSuccess(false);
                setIsAdding(false);
                setBatchPublishing(null);
            }, 1200);
        } catch (err) {
            setError(err.message || 'Erreur pendant la publication.');
            setBatchPublishing(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const formData = new FormData(e.target);

        // On supprime les champs natifs du file input et on injecte notre fichier proprement
        formData.delete('image_file');
        if (selectedFile) {
            if (selectedFile.type.startsWith('image/')) {
                const compressed = await compressImageFile(selectedFile, 1800, 0.88);
                formData.append('image_file', compressed);
            } else {
                formData.append('image_file', selectedFile);
            }
        }

        if (selectedThumbnail) {
            const compressedThumb = await compressImageFile(selectedThumbnail, 900, 0.85);
            formData.append('thumbnail_file', compressedThumb);
        }

        if (selectedFile?.type.startsWith('video/')) {
            formData.set('media_type', 'video');
        }

        if (!selectedFile && !formData.get('image_url')) {
            setError('Sélectionne un fichier ou colle une URL.');
            return;
        }

        startTransition(async () => {
            const result = await addGalleryPost(formData);
            if (result?.error) {
                setError(result.error);
            } else {
                setSuccess(true);
                setSelectedFile(null);
                setSelectedThumbnail(null);
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
        setBatchFiles([]);
        setBatchPublishing(null);
        setError('');
        setSuccess(false);
        formRef.current?.reset();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

            {/* En-tête */}
            <div style={{ width: '100%', maxWidth: '900px', marginBottom: '2rem' }}>
                <h1 className="admin-page-title">Galerie - Photos &amp; Vidéos</h1>
                <p style={{ color: 'var(--admin-text-muted)', marginBottom: '1.25rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    Ajoute et gère les photos et vidéos de cuisine. Modifie leurs titres et légendes en français et en anglais pour la page publique <strong>Galerie</strong>.
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

                    {/* Barre de progression */}
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

                                {/* Aperçu de la miniature */}
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', border: '1px solid var(--admin-border, #332d27)' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, position: 'relative', background: '#000' }}>
                                        {editingPost.media_type === 'video' ? (
                                            <video src={editingPost.image_url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <Image src={editingPost.image_url} alt="Photo" width={64} height={64} style={{ width: '100%', height: '100%', objectFit: 'cover' }} unoptimized />
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text, #FDFBF7)' }}>
                                            {editingPost.title || 'Publication sans titre'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-subtle, #999)', marginTop: '2px' }}>
                                            {editingPost.media_type === 'video' ? 'Vidéo' : 'Photo'} - Modification des textes en français et en anglais
                                        </div>
                                        {editingPost.media_type !== 'video' && (
                                            <button
                                                type="button"
                                                onClick={() => setCropper({
                                                    mode: 'recrop',
                                                    post: editingPost,
                                                    items: [{ id: editingPost.id, url: editingPost.image_url, name: editingPost.title || 'Photo' }],
                                                })}
                                                style={{
                                                    marginTop: '6px',
                                                    padding: '5px 12px',
                                                    background: 'linear-gradient(135deg, #C85B3F 0%, #B54A2F 100%)',
                                                    border: '1px solid #A84026',
                                                    color: '#FFFFFF',
                                                    borderRadius: '5px',
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    fontSize: '0.76rem',
                                                    fontWeight: '700',
                                                    boxShadow: '0 2px 5px rgba(194, 87, 45, 0.25)',
                                                }}
                                            >
                                                <Crop size={13} strokeWidth={2.2} /> Recadrer la photo
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Titres FR / EN */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                    <div>
                                        <label className="admin-label" style={{ fontWeight: '600', color: 'var(--admin-gold, #C8A96E)' }}>
                                            FR - Titre / Plat (Français)
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
                                            EN - Title / Dish (English)
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
                                        <label className="admin-label">FR - Légende / Description (Français)</label>
                                        <textarea
                                            name="caption"
                                            defaultValue={editingPost.caption || ''}
                                            className="admin-input"
                                            rows="3"
                                            placeholder="Ex : Préparation du buffet dînatoire en direct du labo..."
                                        />
                                    </div>
                                    <div>
                                        <label className="admin-label">EN - Caption / Description (English)</label>
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

                            {/* Zone de dépôt / aperçu */}
                            {batchFiles.length > 0 ? (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <p style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--admin-gold)', margin: 0 }}>
                                            {batchFiles.length} photos recadrées prêtes à publier
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setBatchFiles([])}
                                            className="admin-btn admin-btn-secondary"
                                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                        >
                                            <X size={13} /> Tout retirer
                                        </button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                        {batchFiles.map((item, bIdx) => {
                                            const previewSrc = URL.createObjectURL(item.file);
                                            return (
                                                <div
                                                    key={item.id}
                                                    style={{
                                                        background: 'rgba(0,0,0,0.3)',
                                                        border: '1px solid var(--admin-border)',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                    }}
                                                >
                                                    <div style={{ position: 'relative', aspectRatio: '1/1', background: '#000' }}>
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={previewSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <span style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(0,0,0,0.75)', color: 'var(--admin-gold)', fontSize: '0.7rem', fontWeight: '700', padding: '2px 7px', borderRadius: '3px' }}>
                                                            #{bIdx + 1}
                                                        </span>
                                                        <div style={{ position: 'absolute', top: '6px', right: '6px', display: 'flex', gap: '3px' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => setCropper({ mode: 'new', items: [{ id: item.id, file: item.file, name: item.name }] })}
                                                                style={{ width: '26px', height: '26px', background: 'linear-gradient(135deg, #C85B3F 0%, #B54A2F 100%)', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.25)' }}
                                                                title="Recadrer cette photo"
                                                            >
                                                                <Crop size={13} strokeWidth={2.2} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setBatchFiles(prev => prev.filter((_, i) => i !== bIdx))}
                                                                style={{ width: '24px', height: '24px', background: 'rgba(239, 68, 68, 0.9)', border: 'none', borderRadius: '3px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                title="Retirer"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                        <input
                                                            type="text"
                                                            placeholder="Titre FR (optionnel)"
                                                            value={item.title}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setBatchFiles(prev => prev.map((x, i) => i === bIdx ? { ...x, title: val } : x));
                                                            }}
                                                            className="admin-input"
                                                            style={{ fontSize: '0.78rem', padding: '5px 8px' }}
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Titre EN (optional)"
                                                            value={item.title_en}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setBatchFiles(prev => prev.map((x, i) => i === bIdx ? { ...x, title_en: val } : x));
                                                            }}
                                                            className="admin-input"
                                                            style={{ fontSize: '0.78rem', padding: '5px 8px' }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--admin-border-soft)' }}>
                                        <button type="button" onClick={resetForm} className="admin-btn admin-btn-secondary" disabled={!!batchPublishing}>
                                            Annuler
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleBatchPublish}
                                            className="admin-btn admin-btn-primary"
                                            disabled={!!batchPublishing}
                                            style={{ minWidth: '180px' }}
                                        >
                                            {batchPublishing ? (
                                                <><Loader2 size={16} className="ic-spin" /> Publication {batchPublishing.done}/{batchPublishing.total}…</>
                                            ) : (
                                                `Tout publier (${batchFiles.length} photos)`
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : selectedFile ? (
                                <div>
                                    <p style={{ fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--admin-gold)', marginBottom: '0.75rem' }}>
                                        Aperçu - Prêt à publier
                                    </p>
                                    <div style={{ maxWidth: '280px' }}>
                                        <MediaPreview
                                            file={selectedFile}
                                            onRemove={() => setSelectedFile(null)}
                                            onRecrop={selectedFile.type.startsWith('image/') ? () => setCropper({
                                                mode: 'new',
                                                items: [{ id: uid(), file: selectedFile, name: selectedFile.name }],
                                            }) : undefined}
                                        />
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
                                            Glisser les fichiers ici, ou cliquer pour choisir
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-subtle)' }}>
                                            Images (cadrage intégré, plusieurs à la fois possibles) ou Vidéos
                                        </span>
                                        <input
                                            ref={inputRef}
                                            type="file"
                                            name="image_file"
                                            accept="image/*,video/*"
                                            multiple
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                handleFilesSelect(e.target.files);
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

                            {/* Type de média (champ caché, détecté automatiquement) */}
                            <input
                                type="hidden"
                                name="media_type"
                                value={selectedFile?.type.startsWith('video/') ? 'video' : 'image'}
                            />

                            {/* Titres FR / EN */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                <div>
                                    <label className="admin-label">FR - Titre / Plat (Français)</label>
                                    <input
                                        type="text"
                                        name="title"
                                        className="admin-input"
                                        placeholder="Ex : Risotto crémeux aux gambas"
                                    />
                                </div>
                                <div>
                                    <label className="admin-label">EN - Title / Dish (English)</label>
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
                                    <label className="admin-label">FR - Légende (Français)</label>
                                    <textarea
                                        name="caption"
                                        className="admin-input"
                                        rows="2"
                                        placeholder="Ex : Préparation du buffet dînatoire en direct du labo..."
                                    />
                                </div>
                                <div>
                                    <label className="admin-label">EN - Caption (English)</label>
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
                    <div style={{
                        textAlign: 'center',
                        padding: '3.5rem 2rem',
                        background: '#FFFFFF',
                        border: '1.5px dashed rgba(194, 87, 45, 0.3)',
                        borderRadius: '14px',
                        boxShadow: '0 4px 20px rgba(42, 30, 23, 0.04)',
                    }}>
                        <div style={{
                            width: '58px',
                            height: '58px',
                            margin: '0 auto 1.25rem',
                            borderRadius: '50%',
                            background: 'rgba(194, 87, 45, 0.09)',
                            color: '#C2572D',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Camera size={28} />
                        </div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#2A1E17', marginBottom: '0.5rem' }}>
                            Aucune photo publiée pour le moment
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: '#665A51', maxWidth: '520px', margin: '0 auto 1.75rem', lineHeight: '1.6' }}>
                            La galerie en ligne est actuellement vide (peut-être après une session de test ou de suppression). Tu peux ajouter tes nouvelles photos ci-dessus, ou restaurer 3 exemples culinaires en 1 clic.
                        </p>
                        <button
                            type="button"
                            onClick={handleSeed}
                            disabled={isSeeding}
                            className="admin-btn admin-btn-secondary"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                padding: '12px 24px',
                                background: '#FAF7F2',
                                border: '1.5px solid #C2572D',
                                color: '#C2572D',
                                fontWeight: '700',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                boxShadow: '0 2px 8px rgba(194, 87, 45, 0.1)',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                            }}
                        >
                            {isSeeding ? (
                                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Restauration en cours...</>
                            ) : (
                                <><Sparkles size={16} /> Restaurer 3 exemples culinaires</>
                            )}
                        </button>
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
                                {/* Miniature du média */}
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
                                            src={post.thumbnail_url || post.image_url}
                                            alt={post.title || 'Photo galerie'}
                                            width={400}
                                            height={300}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            priority={idx < 4}
                                            unoptimized
                                        />
                                    )}

                                    {/* Badge de position */}
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

                                {/* Aperçu du texte */}
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

                                {/* Barre d'actions de la carte */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    padding: '0.75rem 0.8rem',
                                    background: 'var(--admin-surface, #F5EFE6)',
                                    borderTop: '1px solid rgba(184, 139, 70, 0.25)',
                                }}>
                                    {/* Ligne 1 : déplacement gauche/droite, choix direct de la position et suppression */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleReorder(post.id, 'up')}
                                                disabled={idx === 0 || isDeleting}
                                                title="Déplacer vers la gauche"
                                                aria-label={`Déplacer ${post.title || 'cette photo'} vers la gauche`}
                                                style={{
                                                    width: '30px', height: '30px',
                                                    background: idx === 0 ? 'rgba(0,0,0,0.04)' : '#FFFFFF',
                                                    border: '1px solid rgba(184, 139, 70, 0.4)',
                                                    color: idx === 0 ? 'rgba(36, 30, 25, 0.25)' : 'var(--admin-text, #241E19)',
                                                    borderRadius: '5px',
                                                    cursor: idx === 0 ? 'default' : 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: idx === 0 ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                                                }}
                                            >
                                                <ArrowLeft size={13} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleReorder(post.id, 'down')}
                                                disabled={idx === items.length - 1 || isDeleting}
                                                title="Déplacer vers la droite"
                                                aria-label={`Déplacer ${post.title || 'cette photo'} vers la droite`}
                                                style={{
                                                    width: '30px', height: '30px',
                                                    background: idx === items.length - 1 ? 'rgba(0,0,0,0.04)' : '#FFFFFF',
                                                    border: '1px solid rgba(184, 139, 70, 0.4)',
                                                    color: idx === items.length - 1 ? 'rgba(36, 30, 25, 0.25)' : 'var(--admin-text, #241E19)',
                                                    borderRadius: '5px',
                                                    cursor: idx === items.length - 1 ? 'default' : 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: idx === items.length - 1 ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
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
                                                    height: '30px',
                                                    padding: '0 8px',
                                                    background: '#FFFFFF',
                                                    border: '1px solid rgba(184, 139, 70, 0.45)',
                                                    color: 'var(--admin-text, #241E19)',
                                                    borderRadius: '5px',
                                                    fontSize: '0.78rem',
                                                    fontWeight: '700',
                                                    cursor: 'pointer',
                                                    outline: 'none',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                }}
                                            >
                                                {items.map((_, pIdx) => (
                                                     <option key={pIdx + 1} value={pIdx + 1}>
                                                         #{pIdx + 1}
                                                     </option>
                                                 ))}
                                            </select>
                                        </div>

                                        {/* Bouton de suppression ou confirmation */}
                                        <div>
                                            {deleteId === post.id ? (
                                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(post.id)}
                                                        disabled={isDeleting}
                                                        aria-label="Confirmer la suppression"
                                                        style={{ padding: '5px 10px', background: '#DC2626', border: 'none', color: 'white', borderRadius: '5px', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer' }}
                                                    >
                                                        {isDeleting ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : 'Confirmer'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteId(null)}
                                                        aria-label="Annuler la suppression"
                                                        style={{ width: '28px', height: '28px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.15)', color: 'var(--admin-text, #241E19)', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                    >
                                                        <X size={13} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteId(post.id)}
                                                    style={{ width: '30px', height: '30px', background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                    title="Supprimer cette publication"
                                                    aria-label={`Supprimer la publication ${post.title || ''}`}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ligne 2 : boutons d'action (Recadrer et Modifier) */}
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', marginTop: '2px' }}>
                                        {post.media_type !== 'video' && (
                                            <button
                                                type="button"
                                                onClick={() => setCropper({
                                                    mode: 'recrop',
                                                    post,
                                                    items: [{ id: post.id, url: post.image_url, name: post.title || 'Photo' }],
                                                })}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px 12px',
                                                    background: 'linear-gradient(135deg, #C85B3F 0%, #B54A2F 100%)',
                                                    border: '1px solid #A84026',
                                                    color: '#FFFFFF',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px',
                                                    fontSize: '0.82rem',
                                                    fontWeight: '700',
                                                    letterSpacing: '0.01em',
                                                    whiteSpace: 'nowrap',
                                                    boxShadow: '0 2px 6px rgba(194, 87, 45, 0.35)',
                                                    transition: 'all 0.15s ease',
                                                }}
                                                title="Recadrer cette photo"
                                                aria-label={`Recadrer ${post.title || 'cette photo'}`}
                                            >
                                                <Crop size={14} strokeWidth={2.2} /> Recadrer
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => setEditingPost(post)}
                                            style={{
                                                flex: post.media_type === 'video' ? 'none' : 1,
                                                width: post.media_type === 'video' ? '100%' : 'auto',
                                                padding: '8px 12px',
                                                background: '#FFFFFF',
                                                border: '1.5px solid rgba(184, 139, 70, 0.5)',
                                                color: 'var(--admin-text, #241E19)',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                fontSize: '0.82rem',
                                                fontWeight: '700',
                                                letterSpacing: '0.01em',
                                                whiteSpace: 'nowrap',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                                transition: 'all 0.15s ease',
                                            }}
                                            title="Modifier les textes FR &amp; EN"
                                            aria-label={`Modifier les textes FR et EN de ${post.title || 'cette publication'}`}
                                         >
                                             <Pencil size={14} strokeWidth={2.2} /> Modifier
                                         </button>
                                     </div>
                                 </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {cropper && (
                <ImageCropperModal
                    items={cropper.items}
                    targets={GALLERY_CROP_TARGETS}
                    heroPreview={false}
                    title={cropper.mode === 'recrop' ? `Recadrer : ${cropper.post?.title || 'Photo galerie'}` : 'Cadrer les photos de la galerie'}
                    confirmLabel={cropper.mode === 'recrop' ? 'Enregistrer le cadrage' : undefined}
                    onCancel={() => setCropper(null)}
                    onConfirm={handleCropped}
                />
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .admin-page-title { font-size: 1.6rem; font-weight: 700; color: var(--admin-text); margin-bottom: 0.5rem; }
            `}</style>
        </div>
    );
}

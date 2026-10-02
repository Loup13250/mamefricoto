'use client';
import { useState, useRef, useTransition, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { addWeeklyMenu, editWeeklyMenu, deleteWeeklyMenu, reorderWeeklyMenuImage, deleteWeeklyMenuImage, deleteWeeklyMenuImages } from '@/app/actions';
import {
    Pencil, Trash2, Plus, X, Image as ImageIcon, CalendarDays,
    CheckCircle2, Images, ArrowUp, ArrowDown,
    Loader2, UploadCloud, AlertCircle, AlertTriangle, Check
} from 'lucide-react';

/* =====================================================
   PREVIEW ITEM (Images sélectionnées prêtes à uploader)
   ===================================================== */
function PreviewItem({ file, index, total, onRemove, onMoveUp, onMoveDown }) {
    const src = typeof file === 'string' ? file : URL.createObjectURL(file);
    return (
        <div style={{
            position: 'relative',
            background: 'var(--admin-surface)',
            border: '1px solid var(--admin-border)',
            borderRadius: '6px',
            overflow: 'hidden',
            aspectRatio: '1 / 1',
        }}>
            <Image
                src={src}
                alt={`Aperçu ${index + 1}`}
                width={300}
                height={300}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                unoptimized
            />

            {/* Badge numéro */}
            <div style={{
                position: 'absolute', top: '8px', left: '8px',
                background: 'rgba(14,13,12,0.85)',
                border: '1px solid rgba(200,169,110,0.4)',
                color: '#C8A96E',
                fontSize: '0.72rem', fontWeight: '700',
                padding: '3px 9px', borderRadius: '3px',
                backdropFilter: 'blur(4px)',
            }}>{index + 1} / {total}</div>

            {/* Boutons ordre */}
            <div style={{
                position: 'absolute', top: '8px', right: '8px',
                display: 'flex', flexDirection: 'column', gap: '3px',
            }}>
                <button
                    type="button"
                    onClick={() => onMoveUp(index)}
                    disabled={index === 0}
                    title="Monter"
                    style={{
                        width: '26px', height: '26px',
                        background: 'rgba(14,13,12,0.85)',
                        border: '1px solid rgba(200,169,110,0.3)',
                        color: index === 0 ? 'rgba(200,169,110,0.3)' : '#C8A96E',
                        borderRadius: '3px', cursor: index === 0 ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(4px)',
                        transition: 'all 0.2s',
                    }}
                >
                    <ArrowUp size={13} />
                </button>
                <button
                    type="button"
                    onClick={() => onMoveDown(index)}
                    disabled={index === total - 1}
                    title="Descendre"
                    style={{
                        width: '26px', height: '26px',
                        background: 'rgba(14,13,12,0.85)',
                        border: '1px solid rgba(200,169,110,0.3)',
                        color: index === total - 1 ? 'rgba(200,169,110,0.3)' : '#C8A96E',
                        borderRadius: '3px', cursor: index === total - 1 ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(4px)',
                        transition: 'all 0.2s',
                    }}
                >
                    <ArrowDown size={13} />
                </button>
            </div>

            {/* Bouton supprimer */}
            <button
                type="button"
                onClick={() => onRemove(index)}
                title="Retirer cette image"
                style={{
                    position: 'absolute', bottom: '8px', right: '8px',
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
    );
}

/* =====================================================
   DROPZONE
   ===================================================== */
function DropZone({ onFiles, isDragging, setIsDragging, inputName = "image_files", label = "Glisser les images ici, ou cliquer pour choisir" }) {
    const inputRef = useRef(null);

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (dropped.length > 0) onFiles(dropped);
    };

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
                border: `2px dashed ${isDragging ? 'var(--admin-gold)' : 'var(--admin-border)'}`,
                background: isDragging ? 'rgba(200,169,110,0.08)' : 'var(--admin-surface)',
                borderRadius: '6px',
                padding: '2rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
            }}
        >
            <UploadCloud size={32} style={{ color: isDragging ? 'var(--admin-gold)' : 'var(--admin-text-subtle)' }} />
            <span style={{ fontWeight: '600', color: 'var(--admin-text)', fontSize: '0.9rem', textAlign: 'center' }}>
                {label}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-subtle)' }}>
                JPG, PNG, WEBP · Plusieurs images possibles
            </span>
            <input
                ref={inputRef}
                name={inputName}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                    const selected = Array.from(e.target.files || []);
                    if (selected.length > 0) onFiles(selected);
                    e.target.value = '';
                }}
            />
        </div>
    );
}

/* =====================================================
   COMPRESSION IMAGE OPTIMISÉE WEBP (Max 1400px @ 0.80)
   ===================================================== */
async function compressImageFile(file, maxWidth = 1400, quality = 0.80) {
    if (!file || typeof file === 'string' || !file.type?.startsWith('image/')) return file;
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
                            lastModified: Date.now(),
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

/* =====================================================
   FORMULAIRE AJOUT / ÉDITION (BILINGUE FR / EN)
   ===================================================== */
function WeeklyMenuForm({ menu, initialData, onCancel }) {
    const activeMenu = menu || initialData;
    const isEdit = !!activeMenu;

    // Photos sélectionnées en attente d'upload
    const [filesFr, setFilesFr] = useState([]);
    const [filesEn, setFilesEn] = useState([]);

    const [isDraggingFr, setIsDraggingFr] = useState(false);
    const [isDraggingEn, setIsDraggingEn] = useState(false);

    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Helpers FR
    const handleNewFilesFr = useCallback((newFiles) => setFilesFr(prev => [...prev, ...newFiles]), []);
    const handleRemoveFr = useCallback((idx) => setFilesFr(prev => prev.filter((_, i) => i !== idx)), []);
    const handleMoveUpFr = useCallback((idx) => {
        if (idx === 0) return;
        setFilesFr(prev => {
            const next = [...prev];
            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
            return next;
        });
    }, []);
    const handleMoveDownFr = useCallback((idx) => {
        setFilesFr(prev => {
            if (idx >= prev.length - 1) return prev;
            const next = [...prev];
            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
            return next;
        });
    }, []);

    // Helpers EN
    const handleNewFilesEn = useCallback((newFiles) => setFilesEn(prev => [...prev, ...newFiles]), []);
    const handleRemoveEn = useCallback((idx) => setFilesEn(prev => prev.filter((_, i) => i !== idx)), []);
    const handleMoveUpEn = useCallback((idx) => {
        if (idx === 0) return;
        setFilesEn(prev => {
            const next = [...prev];
            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
            return next;
        });
    }, []);
    const handleMoveDownEn = useCallback((idx) => {
        setFilesEn(prev => {
            if (idx >= prev.length - 1) return prev;
            const next = [...prev];
            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
            return next;
        });
    }, []);

    // Photos existantes en ligne (mode édition) avec mise à jour optimiste
    const [prevMenu, setPrevMenu] = useState(activeMenu);
    const [existingFrImages, setExistingFrImages] = useState(() => 
        activeMenu?.images_fr || (activeMenu?.images?.filter(img => img.lang !== 'en') || [])
    );
    const [existingEnImages, setExistingEnImages] = useState(() => 
        activeMenu?.images_en || (activeMenu?.images?.filter(img => img.lang === 'en') || [])
    );

    // Champs de formulaire pour détection des modifications non sauvegardées
    const [title, setTitle] = useState(activeMenu?.title || '');
    const [titleEn, setTitleEn] = useState(activeMenu?.title_en || '');
    const [description, setDescription] = useState(activeMenu?.description || '');
    const [descriptionEn, setDescriptionEn] = useState(activeMenu?.description_en || '');

    // États de multi-sélection pour suppression groupée
    const [selectedFr, setSelectedFr] = useState([]);
    const [selectedEn, setSelectedEn] = useState([]);

    // Modal de confirmation de suppression d'image ({ type: 'single' | 'batch', id, lang })
    const [deleteImageConfirm, setDeleteImageConfirm] = useState(null);

    // Modal de confirmation si modifications non enregistrées
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);

    const formRef = useRef(null);

    if (activeMenu !== prevMenu) {
        setPrevMenu(activeMenu);
        setExistingFrImages(activeMenu?.images_fr || (activeMenu?.images?.filter(img => img.lang !== 'en') || []));
        setExistingEnImages(activeMenu?.images_en || (activeMenu?.images?.filter(img => img.lang === 'en') || []));
        setTitle(activeMenu?.title || '');
        setTitleEn(activeMenu?.title_en || '');
        setDescription(activeMenu?.description || '');
        setDescriptionEn(activeMenu?.description_en || '');
        setSelectedFr([]);
        setSelectedEn([]);
    }

    const isDirty = (
        title !== (activeMenu?.title || '') ||
        titleEn !== (activeMenu?.title_en || '') ||
        description !== (activeMenu?.description || '') ||
        descriptionEn !== (activeMenu?.description_en || '') ||
        filesFr.length > 0 ||
        filesEn.length > 0
    );

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    const requestClose = () => {
        if (isDirty) {
            setShowUnsavedModal(true);
        } else {
            onCancel();
        }
    };

    const toggleSelectImage = (id, lang) => {
        if (lang === 'fr') {
            setSelectedFr(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        } else {
            setSelectedEn(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        }
    };

    const handleReorderExisting = (imgId, direction) => {
        setError('');
        // Optimistic swap immédiat dans le formulaire
        setExistingFrImages(prev => {
            const idx = prev.findIndex(img => img.id === imgId);
            if (idx === -1) return prev;
            const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (targetIdx < 0 || targetIdx >= prev.length) return prev;
            const next = [...prev];
            const [moved] = next.splice(idx, 1);
            next.splice(targetIdx, 0, moved);
            return next;
        });
        setExistingEnImages(prev => {
            const idx = prev.findIndex(img => img.id === imgId);
            if (idx === -1) return prev;
            const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (targetIdx < 0 || targetIdx >= prev.length) return prev;
            const next = [...prev];
            const [moved] = next.splice(idx, 1);
            next.splice(targetIdx, 0, moved);
            return next;
        });

        startTransition(async () => {
            const res = await reorderWeeklyMenuImage(imgId, direction);
            if (res?.error) setError(res.error);
        });
    };

    const handleDeleteExisting = (imgId, lang = 'fr') => {
        setError('');
        if (lang === 'fr') {
            setExistingFrImages(prev => prev.filter(img => img.id !== imgId));
            setSelectedFr(prev => prev.filter(x => x !== imgId));
        } else {
            setExistingEnImages(prev => prev.filter(img => img.id !== imgId));
            setSelectedEn(prev => prev.filter(x => x !== imgId));
        }

        startTransition(async () => {
            const res = await deleteWeeklyMenuImage(imgId);
            if (res?.error) setError(res.error);
        });
    };

    const handleBatchDeleteExisting = (lang) => {
        const targetIds = lang === 'fr' ? selectedFr : selectedEn;
        if (!targetIds || targetIds.length === 0) return;

        setError('');
        if (lang === 'fr') {
            setExistingFrImages(prev => prev.filter(img => !targetIds.includes(img.id)));
            setSelectedFr([]);
        } else {
            setExistingEnImages(prev => prev.filter(img => !targetIds.includes(img.id)));
            setSelectedEn([]);
        }

        startTransition(async () => {
            const res = await deleteWeeklyMenuImages(targetIds);
            if (res?.error) setError(res.error);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const formTarget = e.currentTarget;

        startTransition(async () => {
            try {
                const formData = new FormData(formTarget);
                formData.delete('image_files');
                formData.delete('image_files_fr');
                formData.delete('image_files_en');

                // Compression FR (1400px, 0.80)
                const compressedFr = await Promise.all(filesFr.map(f => compressImageFile(f, 1400, 0.80)));
                for (const file of compressedFr) {
                    formData.append('image_files_fr', file);
                }

                // Compression EN (1400px, 0.80)
                const compressedEn = await Promise.all(filesEn.map(f => compressImageFile(f, 1400, 0.80)));
                for (const file of compressedEn) {
                    formData.append('image_files_en', file);
                }

                const action = isEdit ? editWeeklyMenu : addWeeklyMenu;
                const result = await action(formData);
                if (result?.error) {
                    setError(result.error);
                } else {
                    setSuccess(true);
                    setTimeout(() => onCancel(), 1000);
                }
            } catch (err) {
                console.error("Submit error:", err);
                setError(err.message || 'Une erreur est survenue lors de l\'enregistrement.');
            }
        });
    };

    if (success) {
        return (
            <div style={{
                padding: '3rem', textAlign: 'center',
                background: 'rgba(34,197,94,0.06)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: '8px',
            }}>
                <CheckCircle2 size={40} style={{ color: '#22c55e', marginBottom: '1rem' }} />
                <p style={{ color: '#86efac', fontWeight: '600', fontSize: '1rem' }}>
                    {isEdit ? 'Menu mis à jour !' : 'Menu publié avec succès !'}
                </p>
            </div>
        );
    }

    const currentFrImages = existingFrImages;
    const currentEnImages = existingEnImages;

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--admin-border-soft)' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--admin-text)', margin: 0 }}>
                    {isEdit ? 'Modifier le menu' : 'Nouveau menu de la semaine'}
                </h2>
                <button
                    type="button"
                    onClick={requestClose}
                    style={{ color: 'var(--admin-text-subtle)', cursor: 'pointer', padding: '6px', background: 'none', border: 'none' }}
                    title="Fermer"
                >
                    <X size={20} />
                </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {isEdit && <input type="hidden" name="id" value={activeMenu.id} />}

                {/* Titre FR / EN */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label className="admin-label" style={{ color: 'var(--admin-gold)', fontWeight: '600' }}>
                            FR — Titre du menu (Français) *
                        </label>
                        <input
                            type="text"
                            name="title"
                            className="admin-input"
                            placeholder="Ex : Menu du 15 au 18 Juillet"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="admin-label" style={{ color: 'var(--admin-gold)', fontWeight: '600' }}>
                            EN — Menu Title (English)
                        </label>
                        <input
                            type="text"
                            name="title_en"
                            className="admin-input"
                            placeholder="e.g. Menu for July 15th to 18th"
                            value={titleEn}
                            onChange={(e) => setTitleEn(e.target.value)}
                        />
                    </div>
                </div>

                {/* Description FR / EN */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label className="admin-label">FR — Description des plats (Français)</label>
                        <textarea
                            name="description"
                            className="admin-input"
                            rows="3"
                            placeholder="Ex : Tarte tatin aubergines, Cake citron, Riz safran..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="admin-label">EN — Dishes description (English)</label>
                        <textarea
                            name="description_en"
                            className="admin-input"
                            rows="3"
                            placeholder="e.g. Eggplant tatin, Lemon drizzle cake, Saffron rice..."
                            value={descriptionEn}
                            onChange={(e) => setDescriptionEn(e.target.value)}
                        />
                    </div>
                </div>

                {/* =========================================================
                    SECTION 1 : PHOTOS EN FRANÇAIS (FR)
                    ========================================================= */}
                <div style={{
                    background: 'rgba(0, 0, 0, 0.18)',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '3px', background: 'rgba(200,169,110,0.2)', color: 'var(--admin-gold)', fontWeight: '700' }}>FR</span>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--admin-text)', margin: 0 }}>
                                Photos du menu en Français
                            </h3>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-subtle)' }}>
                            {currentFrImages.length + filesFr.length} photo{(currentFrImages.length + filesFr.length) > 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Photos actuelles FR (mode édition) */}
                    {isEdit && currentFrImages.length > 0 && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--admin-text-muted)', margin: 0 }}>
                                    Photos actuelles en ligne ({currentFrImages.length}) :
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (selectedFr.length === currentFrImages.length) {
                                                setSelectedFr([]);
                                            } else {
                                                setSelectedFr(currentFrImages.map(img => img.id));
                                            }
                                        }}
                                        className="admin-btn admin-btn-secondary"
                                        style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                                    >
                                        {selectedFr.length === currentFrImages.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                                    </button>
                                    {selectedFr.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setDeleteImageConfirm({ type: 'batch', lang: 'fr' })}
                                            className="admin-btn admin-btn-danger"
                                            style={{ fontSize: '0.72rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            <Trash2 size={12} /> Supprimer sélection ({selectedFr.length})
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                                {currentFrImages.map((img, idx) => {
                                    const isSelected = selectedFr.includes(img.id);
                                    return (
                                        <div key={img.id} style={{
                                            border: isSelected ? '2px solid var(--admin-gold)' : '1px solid var(--admin-border)',
                                            boxShadow: isSelected ? '0 0 8px rgba(200, 169, 110, 0.4)' : 'none',
                                            borderRadius: '6px', overflow: 'hidden',
                                            aspectRatio: '1 / 1', position: 'relative',
                                            background: 'var(--admin-surface)',
                                        }}>
                                            <Image
                                                src={img.image_url}
                                                alt={`Photo FR ${idx + 1}`}
                                                width={200}
                                                height={200}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                unoptimized
                                            />
                                            <div style={{ position: 'absolute', top: '5px', left: '5px', background: 'rgba(14,13,12,0.85)', color: '#C8A96E', fontSize: '0.65rem', fontWeight: '700', padding: '2px 6px', borderRadius: '2px', zIndex: 2 }}>
                                                #{idx + 1}
                                            </div>
                                            <div style={{ position: 'absolute', top: '5px', right: '5px', display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 2 }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleReorderExisting(img.id, 'up')}
                                                    disabled={idx === 0 || isPending}
                                                    title="Monter"
                                                    aria-label={`Monter la photo FR numéro ${idx + 1}`}
                                                    style={{ width: '22px', height: '22px', background: 'rgba(14,13,12,0.85)', border: 'none', color: '#C8A96E', borderRadius: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    <ArrowUp size={11} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleReorderExisting(img.id, 'down')}
                                                    disabled={idx === currentFrImages.length - 1 || isPending}
                                                    title="Descendre"
                                                    aria-label={`Descendre la photo FR numéro ${idx + 1}`}
                                                    style={{ width: '22px', height: '22px', background: 'rgba(14,13,12,0.85)', border: 'none', color: '#C8A96E', borderRadius: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    <ArrowDown size={11} />
                                                </button>
                                            </div>

                                            {/* Checkbox sélection groupée */}
                                            <button
                                                type="button"
                                                onClick={() => toggleSelectImage(img.id, 'fr')}
                                                title={isSelected ? "Désélectionner" : "Sélectionner pour suppression multiple"}
                                                style={{
                                                    position: 'absolute', bottom: '5px', left: '5px',
                                                    width: '22px', height: '22px',
                                                    borderRadius: '4px',
                                                    background: isSelected ? 'var(--admin-gold)' : 'rgba(0,0,0,0.65)',
                                                    border: isSelected ? '1px solid var(--admin-gold)' : '1px solid rgba(255,255,255,0.4)',
                                                    color: isSelected ? '#000' : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer', zIndex: 2, padding: 0
                                                }}
                                            >
                                                <Check size={13} strokeWidth={3} />
                                            </button>

                                            {/* Bouton supprimer individuel avec confirmation */}
                                            <button
                                                type="button"
                                                onClick={() => setDeleteImageConfirm({ type: 'single', id: img.id, lang: 'fr' })}
                                                disabled={isPending}
                                                title="Supprimer cette photo"
                                                aria-label={`Supprimer la photo FR numéro ${idx + 1}`}
                                                style={{
                                                    position: 'absolute', bottom: '5px', right: '5px',
                                                    width: '24px', height: '24px',
                                                    background: 'rgba(239,68,68,0.95)',
                                                    border: 'none', borderRadius: '3px', color: 'white',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer', zIndex: 2,
                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
                                                }}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Dropzone FR */}
                    <DropZone
                        onFiles={handleNewFilesFr}
                        isDragging={isDraggingFr}
                        setIsDragging={setIsDraggingFr}
                        inputName="image_files_fr"
                        label="Ajouter des photos pour le menu Français"
                    />

                    {/* Aperçu nouvelles photos FR */}
                    {filesFr.length > 0 && (
                        <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-gold)', marginBottom: '0.5rem' }}>
                                Nouvelles photos FR prêtes à être ajoutées :
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                                {filesFr.map((file, idx) => (
                                    <PreviewItem
                                        key={idx}
                                        file={file}
                                        index={idx}
                                        total={filesFr.length}
                                        onRemove={handleRemoveFr}
                                        onMoveUp={handleMoveUpFr}
                                        onMoveDown={handleMoveDownFr}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* =========================================================
                    SECTION 2 : PHOTOS EN ANGLAIS (EN) — OPTIONNEL
                    ========================================================= */}
                <div style={{
                    background: 'rgba(0, 0, 0, 0.18)',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', color: 'var(--admin-text-subtle)', fontWeight: '700' }}>EN</span>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--admin-text)', margin: 0 }}>
                                Photos du menu en Anglais (Optionnel)
                            </h3>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--admin-gold)', fontStyle: 'italic' }}>
                            Si aucune photo n&apos;est ajoutée ici, le site affichera automatiquement les photos françaises
                        </span>
                    </div>

                    {/* Photos actuelles EN (mode édition) */}
                    {isEdit && currentEnImages.length > 0 && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--admin-text-muted)', margin: 0 }}>
                                    Photos actuelles en version anglaise ({currentEnImages.length}) :
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (selectedEn.length === currentEnImages.length) {
                                                setSelectedEn([]);
                                            } else {
                                                setSelectedEn(currentEnImages.map(img => img.id));
                                            }
                                        }}
                                        className="admin-btn admin-btn-secondary"
                                        style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                                    >
                                        {selectedEn.length === currentEnImages.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                                    </button>
                                    {selectedEn.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setDeleteImageConfirm({ type: 'batch', lang: 'en' })}
                                            className="admin-btn admin-btn-danger"
                                            style={{ fontSize: '0.72rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            <Trash2 size={12} /> Supprimer sélection ({selectedEn.length})
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                                {currentEnImages.map((img, idx) => {
                                    const isSelected = selectedEn.includes(img.id);
                                    return (
                                        <div key={img.id} style={{
                                            border: isSelected ? '2px solid var(--admin-gold)' : '1px solid var(--admin-border)',
                                            boxShadow: isSelected ? '0 0 8px rgba(200, 169, 110, 0.4)' : 'none',
                                            borderRadius: '6px', overflow: 'hidden',
                                            aspectRatio: '1 / 1', position: 'relative',
                                            background: 'var(--admin-surface)',
                                        }}>
                                            <Image
                                                src={img.image_url}
                                                alt={`Photo EN ${idx + 1}`}
                                                width={200}
                                                height={200}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                unoptimized
                                            />
                                            <div style={{ position: 'absolute', top: '5px', left: '5px', background: 'rgba(14,13,12,0.85)', color: '#C8A96E', fontSize: '0.65rem', fontWeight: '700', padding: '2px 6px', borderRadius: '2px', zIndex: 2 }}>
                                                #{idx + 1}
                                            </div>
                                            <div style={{ position: 'absolute', top: '5px', right: '5px', display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 2 }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleReorderExisting(img.id, 'up')}
                                                    disabled={idx === 0 || isPending}
                                                    title="Monter"
                                                    aria-label={`Monter la photo EN numéro ${idx + 1}`}
                                                    style={{ width: '22px', height: '22px', background: 'rgba(14,13,12,0.85)', border: 'none', color: '#C8A96E', borderRadius: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    <ArrowUp size={11} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleReorderExisting(img.id, 'down')}
                                                    disabled={idx === currentEnImages.length - 1 || isPending}
                                                    title="Descendre"
                                                    aria-label={`Descendre la photo EN numéro ${idx + 1}`}
                                                    style={{ width: '22px', height: '22px', background: 'rgba(14,13,12,0.85)', border: 'none', color: '#C8A96E', borderRadius: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    <ArrowDown size={11} />
                                                </button>
                                            </div>

                                            {/* Checkbox sélection groupée */}
                                            <button
                                                type="button"
                                                onClick={() => toggleSelectImage(img.id, 'en')}
                                                title={isSelected ? "Désélectionner" : "Sélectionner pour suppression multiple"}
                                                style={{
                                                    position: 'absolute', bottom: '5px', left: '5px',
                                                    width: '22px', height: '22px',
                                                    borderRadius: '4px',
                                                    background: isSelected ? 'var(--admin-gold)' : 'rgba(0,0,0,0.65)',
                                                    border: isSelected ? '1px solid var(--admin-gold)' : '1px solid rgba(255,255,255,0.4)',
                                                    color: isSelected ? '#000' : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer', zIndex: 2, padding: 0
                                                }}
                                            >
                                                <Check size={13} strokeWidth={3} />
                                            </button>

                                            {/* Bouton supprimer individuel avec confirmation */}
                                            <button
                                                type="button"
                                                onClick={() => setDeleteImageConfirm({ type: 'single', id: img.id, lang: 'en' })}
                                                disabled={isPending}
                                                title="Supprimer cette photo anglaise"
                                                aria-label={`Supprimer la photo EN numéro ${idx + 1}`}
                                                style={{
                                                    position: 'absolute', bottom: '5px', right: '5px',
                                                    width: '24px', height: '24px',
                                                    background: 'rgba(239,68,68,0.95)',
                                                    border: 'none', borderRadius: '3px', color: 'white',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer', zIndex: 2,
                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
                                                }}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Dropzone EN */}
                    <DropZone
                        onFiles={handleNewFilesEn}
                        isDragging={isDraggingEn}
                        setIsDragging={setIsDraggingEn}
                        inputName="image_files_en"
                        label="Ajouter des photos spécifiques pour la version Anglaise (Optionnel)"
                    />

                    {/* Aperçu nouvelles photos EN */}
                    {filesEn.length > 0 && (
                        <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-gold)', marginBottom: '0.5rem' }}>
                                Nouvelles photos EN prêtes à être ajoutées :
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                                {filesEn.map((file, idx) => (
                                    <PreviewItem
                                        key={idx}
                                        file={file}
                                        index={idx}
                                        total={filesEn.length}
                                        onRemove={handleRemoveEn}
                                        onMoveUp={handleMoveUpEn}
                                        onMoveDown={handleMoveDownEn}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Statut menu en cours */}
                {isEdit && activeMenu?.is_current === 1 ? (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.85rem 1.25rem',
                        background: 'rgba(34,197,94,0.08)',
                        border: '1px solid rgba(34,197,94,0.25)',
                        borderRadius: '6px',
                    }}>
                        <input type="hidden" name="is_current" value="on" />
                        <span style={{
                            fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em',
                            padding: '3px 9px', background: 'rgba(34,197,94,0.2)', color: '#22c55e',
                            border: '1px solid rgba(34,197,94,0.3)', borderRadius: '3px'
                        }}>
                            En ligne
                        </span>
                        <span style={{ color: '#86efac', fontSize: '0.88rem', fontWeight: '600' }}>
                            Ce menu est actuellement le menu en cours affiché sur la page d&apos;accueil.
                        </span>
                    </div>
                ) : (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '1rem 1.25rem',
                        background: 'rgba(34,197,94,0.05)',
                        border: '1px solid rgba(34,197,94,0.15)',
                        borderRadius: '4px',
                    }}>
                        <input
                            type="checkbox"
                            name="is_current"
                            id={`is_current_${activeMenu?.id || 'new'}`}
                            defaultChecked={activeMenu ? !!activeMenu.is_current : true}
                            style={{ width: '18px', height: '18px', accentColor: '#22c55e', flexShrink: 0 }}
                        />
                        <label htmlFor={`is_current_${activeMenu?.id || 'new'}`} style={{ cursor: 'pointer', color: '#86efac', fontSize: '0.9rem', fontWeight: '600' }}>
                            {isEdit ? 'Définir comme menu en cours sur la page d\'accueil' : 'Afficher comme menu en cours sur la page d\'accueil'}
                        </label>
                    </div>
                )}

                {/* Erreur */}
                {error && (
                    <div style={{
                        display: 'flex', gap: '0.75rem', alignItems: 'center',
                        padding: '1rem', borderRadius: '4px',
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        color: '#fca5a5', fontSize: '0.9rem',
                    }}>
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid rgba(200,169,110,0.08)' }}>
                    <button type="button" onClick={requestClose} className="admin-btn admin-btn-secondary" disabled={isPending}>
                        Annuler
                    </button>
                    <button type="submit" className="admin-btn admin-btn-primary" disabled={isPending} style={{ minWidth: '160px' }}>
                        {isPending ? (
                            <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Upload en cours...</>
                        ) : (
                            isEdit ? 'Enregistrer les modifications' : 'Publier ce menu'
                        )}
                    </button>
                </div>
            </form>

            {/* MINI POP-UP DE CONFIRMATION: SUPPRESSION D'IMAGE(S) */}
            {deleteImageConfirm && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.75)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 350,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem'
                }}>
                    <div className="admin-card anim-fade" style={{ maxWidth: '420px', width: '100%', border: '1px solid rgba(220, 38, 38, 0.4)' }}>
                        <h3 style={{ fontSize: '1.15rem', color: 'var(--admin-text)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertTriangle size={20} style={{ color: '#C4593A' }} />
                            {deleteImageConfirm.type === 'batch' 
                                ? `Supprimer ${deleteImageConfirm.lang === 'fr' ? selectedFr.length : selectedEn.length} image(s) ?`
                                : "Supprimer cette photo ?"
                            }
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                            {deleteImageConfirm.type === 'batch'
                                ? "Cette action supprimera définitivement toutes les images sélectionnées de ce menu. Êtes-vous sûr(e) ?"
                                : "Cette action supprimera définitivement cette photo du menu. Cette action est irréversible."
                            }
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button
                                type="button"
                                onClick={() => setDeleteImageConfirm(null)}
                                className="admin-btn admin-btn-secondary"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => {
                                    const target = deleteImageConfirm;
                                    setDeleteImageConfirm(null);
                                    if (target.type === 'single') {
                                        handleDeleteExisting(target.id, target.lang);
                                    } else if (target.type === 'batch') {
                                        handleBatchDeleteExisting(target.lang);
                                    }
                                }}
                                className="admin-btn admin-btn-danger"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                                {isPending ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                                Confirmer la suppression
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE CONFIRMATION: MODIFICATIONS NON ENREGISTRÉES */}
            {showUnsavedModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.75)',
                    backdropFilter: 'blur(5px)',
                    zIndex: 350,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem'
                }}>
                    <div className="admin-card anim-fade" style={{ maxWidth: '460px', width: '100%', border: '1px solid rgba(200, 169, 110, 0.5)' }}>
                        <h3 style={{ fontSize: '1.15rem', color: 'var(--admin-text)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={20} style={{ color: 'var(--admin-gold)' }} />
                            Modifications non enregistrées
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                            Vous avez apporté des modifications à ce menu qui n&apos;ont pas encore été enregistrées. Que souhaitez-vous faire ?
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => {
                                    setShowUnsavedModal(false);
                                    formRef.current?.requestSubmit();
                                }}
                                className="admin-btn admin-btn-primary"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}
                            >
                                <CheckCircle2 size={16} /> Enregistrer les modifications
                            </button>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowUnsavedModal(false)}
                                    className="admin-btn admin-btn-secondary"
                                    style={{ flex: 1, textAlign: 'center' }}
                                >
                                    Continuer l&apos;édition
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowUnsavedModal(false);
                                        onCancel();
                                    }}
                                    className="admin-btn"
                                    style={{
                                        flex: 1,
                                        background: 'rgba(196, 89, 58, 0.15)',
                                        border: '1px solid rgba(196, 89, 58, 0.5)',
                                        color: '#E06D53',
                                        cursor: 'pointer',
                                        borderRadius: '6px',
                                        fontWeight: '600',
                                        fontSize: '0.85rem',
                                        padding: '0.6rem 0.8rem'
                                    }}
                                >
                                    Quitter sans sauvegarder
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* =====================================================
   COMPOSANT PRINCIPAL
   ===================================================== */
export default function WeeklyMenuClient({ menus }) {
    const [editingId, setEditingId] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [isPending, startTransition] = useTransition();

    const handleDelete = (id) => {
        startTransition(async () => {
            const res = await deleteWeeklyMenu(id);
            if (res?.error) {
                alert(res.error);
            }
            setDeleteId(null);
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ width: '100%', maxWidth: '850px', marginBottom: '2.5rem' }}>
                <h1 className="admin-page-title">Menu de la Semaine</h1>
                <p style={{ color: 'var(--admin-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    Créez ou modifiez le menu de la semaine affiché sur le site. Vous pouvez séparer les photos en français et en anglais : les visiteurs anglophones verront automatiquement la version anglaise (ou française si non renseignée).
                </p>
                {!isAdding && !editingId && (
                    <button onClick={() => setIsAdding(true)} className="admin-btn admin-btn-primary">
                        <Plus size={16} /> Créer un nouveau menu
                    </button>
                )}
            </div>

            {/* Formulaire Création */}
            {isAdding && (
                <div className="admin-card" style={{ width: '100%', maxWidth: '850px', marginBottom: '3rem' }}>
                    <WeeklyMenuForm onCancel={() => setIsAdding(false)} />
                </div>
            )}

            {/* Formulaire Édition */}
            {editingId && (
                <div className="admin-card" style={{ width: '100%', maxWidth: '850px', marginBottom: '3rem', border: '1px solid var(--admin-border)' }}>
                    <WeeklyMenuForm initialData={menus.find(m => m.id === editingId)} onCancel={() => setEditingId(null)} />
                </div>
            )}

            {/* Liste des Menus */}
            <div style={{ width: '100%', maxWidth: '850px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-text-subtle)', marginBottom: '1.25rem' }}>
                    Historique des menus ({menus.length})
                </h2>

                {menus.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: '6px', color: 'var(--admin-text-muted)' }}>
                        Aucun menu publié pour le moment.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {menus.map(menu => {
                            const frCount = menu.images_fr ? menu.images_fr.length : (menu.images?.filter(i => i.lang !== 'en').length || 0);
                            const enCount = menu.images_en ? menu.images_en.length : (menu.images?.filter(i => i.lang === 'en').length || 0);
                            const mainImg = menu.images_fr?.[0]?.image_url || menu.images?.[0]?.image_url || menu.image_url;

                            return (
                                <div key={menu.id} className="admin-menu-item-row" style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'minmax(60px, 80px) 1fr auto',
                                    gap: '1.25rem',
                                    alignItems: 'center',
                                    padding: '1.1rem 1.25rem',
                                    background: 'var(--admin-surface, #1e1b18)',
                                    border: '1px solid var(--admin-border, #332d27)',
                                    borderRadius: '6px',
                                    transition: 'background 0.2s',
                                }}>
                                    {/* Thumbnail */}
                                    <div style={{ width: '80px', height: '60px', borderRadius: '4px', overflow: 'hidden', background: '#000', flexShrink: 0, border: '1px solid var(--admin-border)' }}>
                                        {mainImg ? (
                                            <Image
                                                src={mainImg}
                                                alt={menu.title}
                                                width={160}
                                                height={120}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                unoptimized
                                            />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-subtle)' }}>
                                                <ImageIcon size={22} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                                            <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--admin-text, #FDFBF7)', margin: 0 }}>
                                                {menu.title}
                                            </h3>
                                            {menu.title_en && (
                                                <span style={{ fontSize: '0.82rem', color: 'var(--admin-gold)', fontStyle: 'italic' }}>
                                                    EN — {menu.title_en}
                                                </span>
                                            )}
                                            {menu.is_current === 1 && (
                                                <span style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 8px', background: 'rgba(34,197,94,0.15)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '3px' }}>
                                                    En ligne
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--admin-text-subtle)' }}>
                                            <span>📷 FR : {frCount} photo{frCount > 1 ? 's' : ''}</span>
                                            <span>•</span>
                                            <span>📷 EN : {enCount > 0 ? `${enCount} photo${enCount > 1 ? 's' : ''}` : 'Idem FR'}</span>
                                            <span>•</span>
                                            <span>Créé le {new Date(menu.created_at).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => { setEditingId(menu.id); setIsAdding(false); }}
                                            title="Modifier ce menu"
                                            style={{ width: '34px', height: '34px', background: 'rgba(200,169,110,0.15)', border: '1px solid var(--admin-gold)', color: 'var(--admin-gold)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                                        >
                                            <Pencil size={15} />
                                        </button>

                                        {deleteId === menu.id ? (
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button
                                                    onClick={() => handleDelete(menu.id)}
                                                    disabled={isPending}
                                                    style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.9)', border: 'none', color: 'white', borderRadius: '3px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                                                >
                                                    {isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Confirmer'}
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(null)}
                                                    style={{ width: '34px', height: '34px', background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-subtle)', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setDeleteId(menu.id)}
                                                title="Supprimer ce menu"
                                                style={{ width: '34px', height: '34px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#dc2626', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
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

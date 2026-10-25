'use client';
import { useState, useRef, useTransition, useEffect, useCallback } from 'react';
import { addCarouselImage, deleteCarouselImage, editCarouselImage, reorderCarouselImage } from '@/app/actions';
import ImageCropperModal, { HERO_CROP_TARGETS, uid } from '@/components/admin/ImageCropper';
import {
    Image as ImageIcon,
    Plus,
    Trash2,
    Pencil,
    X,
    UploadCloud,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Crop,
    Monitor,
    Smartphone,
    Images,
} from 'lucide-react';
import './CarouselClient.css';

/* Anciens fichiers : un navigateur ne reconnaît pas toujours le type MIME (ex. HEIC sous Windows) */
const IMAGE_EXT_RE = /\.(jpe?g|png|webp|gif|avif|bmp|jfif|heic|heif)$/i;
const isImageFile = (file) => !!file && (file.type?.startsWith('image/') || IMAGE_EXT_RE.test(file.name || ''));

/** Garde la trace des URL temporaires (aperçus) et les libère à la fermeture du composant. */
function useObjectUrls() {
    const ref = useRef(new Set());
    useEffect(() => {
        const urls = ref.current;
        return () => urls.forEach((u) => URL.revokeObjectURL(u));
    }, []);
    const make = useCallback((file) => {
        const url = URL.createObjectURL(file);
        ref.current.add(url);
        return url;
    }, []);
    const release = useCallback((url) => {
        if (url && ref.current.has(url)) {
            URL.revokeObjectURL(url);
            ref.current.delete(url);
        }
    }, []);
    return { make, release };
}

/** Zone de dépôt multi-fichiers (glisser-déposer ou clic). */
function PhotoDropzone({ onFiles, onError, compact = false, label, sublabel }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const handle = (fileList) => {
        const all = Array.from(fileList || []);
        const images = all.filter(isImageFile);
        if (all.length > images.length) {
            onError?.(`${all.length - images.length} fichier(s) ignoré(s) : seules les images sont acceptées.`);
        } else {
            onError?.('');
        }
        if (images.length) onFiles(images);
    };

    return (
        <>
            <button
                type="button"
                className={`cr-dropzone ${dragging ? 'is-dragging' : ''} ${compact ? 'is-compact' : ''}`}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files); }}
            >
                <UploadCloud size={compact ? 22 : 34} />
                <strong>{label || 'Glisse tes photos ici ou clique pour les choisir'}</strong>
                <span>{sublabel || 'Tu peux en sélectionner plusieurs à la fois - tu les cadreras ensuite une par une.'}</span>
            </button>
            <input
                ref={inputRef}
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => { handle(e.target.files); e.target.value = ''; }}
            />
        </>
    );
}

/* ==========================================================================
   AJOUT : plusieurs photos à la fois, cadrées puis publiées en une fois
   ========================================================================== */
function AddSlidesFlow({ onCancel }) {
    const [slides, setSlides] = useState([]);
    const [cropper, setCropper] = useState(null); // { mode: 'new' | 'recrop', items }
    const [publishing, setPublishing] = useState(null);
    const [error, setError] = useState('');
    const [successCount, setSuccessCount] = useState(0);
    const { make, release } = useObjectUrls();
    const addMoreRef = useRef(null);

    const openCropperForFiles = (files) => {
        setCropper({ mode: 'new', items: files.map((f) => ({ id: uid(), file: f, name: f.name })) });
    };

    const recrop = (slide, enableMobile = false) => {
        const crops = { ...(slide.crops || {}) };
        if (enableMobile) crops.mobile = { ...(crops.mobile || {}), enabled: true };
        setCropper({
            mode: 'recrop',
            items: [{ id: slide.id, file: slide.original || slide.desktop, name: slide.name, crops }],
        });
    };

    const handleCropped = (results) => {
        if (cropper.mode === 'new') {
            const added = results.map((r) => ({
                id: r.id,
                name: r.name,
                original: r.original,
                crops: r.crops,
                unreadable: r.unreadable,
                desktop: r.outputs.desktop || null,
                mobile: r.outputs.mobile || null,
                desktopUrl: r.outputs.desktop ? make(r.outputs.desktop) : null,
                mobileUrl: r.outputs.mobile ? make(r.outputs.mobile) : null,
                title: '', title_en: '', subtitle: '', subtitle_en: '',
            }));
            setSlides((prev) => [...prev, ...added]);
        } else {
            setSlides((prev) => prev.map((s) => {
                const r = results.find((x) => x.id === s.id);
                if (!r) return s;
                release(s.desktopUrl);
                release(s.mobileUrl);
                const desktop = r.outputs.desktop || s.desktop;
                const mobile = r.outputs.mobile || null;
                return {
                    ...s,
                    crops: r.crops,
                    desktop,
                    mobile,
                    desktopUrl: desktop ? make(desktop) : null,
                    mobileUrl: mobile ? make(mobile) : null,
                };
            }));
        }
        setCropper(null);
    };

    const updateSlide = (id, patch) => setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

    const removeSlide = (slide) => {
        release(slide.desktopUrl);
        release(slide.mobileUrl);
        setSlides((prev) => prev.filter((s) => s.id !== slide.id));
    };

    const publish = async () => {
        if (!slides.length || publishing) return;
        setError('');
        const total = slides.length;
        let done = 0;
        setPublishing({ done, total });
        try {
            for (const slide of [...slides]) {
                const fd = new FormData();
                fd.set('title', slide.title.trim());
                fd.set('title_en', slide.title_en.trim());
                fd.set('subtitle', slide.subtitle.trim());
                fd.set('subtitle_en', slide.subtitle_en.trim());
                if (slide.desktop) fd.append('image_file', slide.desktop);
                if (slide.mobile) fd.append('mobile_image_file', slide.mobile);

                const res = await addCarouselImage(fd);
                if (res?.error) {
                    setError(`« ${slide.title || slide.name || 'Photo'} » : ${res.error}`);
                    setPublishing(null);
                    return;
                }
                done += 1;
                release(slide.desktopUrl);
                release(slide.mobileUrl);
                setSlides((prev) => prev.filter((s) => s.id !== slide.id));
                setPublishing({ done, total });
            }
            setPublishing(null);
            setSuccessCount(done);
            setTimeout(() => onCancel(), 1600);
        } catch (err) {
            console.error('Publish error:', err);
            setError('La publication a échoué (connexion ou fichiers trop lourds). Les photos déjà publiées restent en ligne ; tu peux réessayer pour les autres.');
            setPublishing(null);
        }
    };

    if (successCount > 0) {
        return (
            <div className="cr-success">
                <CheckCircle2 size={42} />
                <p>{successCount > 1 ? `${successCount} photos ajoutées au carrousel avec succès !` : 'Photo ajoutée au carrousel avec succès !'}</p>
            </div>
        );
    }

    return (
        <div className="cr-flow">
            {slides.length === 0 ? (
                <PhotoDropzone onFiles={openCropperForFiles} onError={setError} />
            ) : (
                <>
                    <div className="cr-flow-head">
                        <p>
                            <strong>{slides.length} photo{slides.length > 1 ? 's' : ''} prête{slides.length > 1 ? 's' : ''}</strong>
                            {' '} - ajoute un titre (facultatif), puis publie. Si le titre est vide, le titre par défaut du site s&apos;affiche.
                        </p>
                        <button type="button" className="admin-btn admin-btn-secondary" onClick={() => addMoreRef.current?.click()} disabled={!!publishing}>
                            <Plus size={15} /> Ajouter d&apos;autres photos
                        </button>
                        <input
                            ref={addMoreRef}
                            type="file"
                            accept="image/*,.heic,.heif"
                            multiple
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []).filter(isImageFile);
                                e.target.value = '';
                                if (files.length) openCropperForFiles(files);
                            }}
                        />
                    </div>

                    <div className="cr-slides">
                        {slides.map((slide, idx) => (
                            <article key={slide.id} className="cr-slide">
                                <div className="cr-slide-media">
                                    <div className="cr-media-block">
                                        <span className="cr-media-label"><Monitor size={12} /> Ordinateur</span>
                                        <div className="cr-media-desktop">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            {slide.desktopUrl && <img src={slide.desktopUrl} alt="" />}
                                        </div>
                                    </div>
                                    <div className="cr-media-block">
                                        <span className="cr-media-label"><Smartphone size={12} /> Mobile</span>
                                        {slide.mobileUrl ? (
                                            <div className="cr-media-mobile">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={slide.mobileUrl} alt="" />
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                className="cr-media-mobile is-empty"
                                                onClick={() => recrop(slide, true)}
                                                disabled={!!publishing || slide.unreadable}
                                                title="Créer le format mobile"
                                            >
                                                <Plus size={16} />
                                                <span>Ajouter</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="cr-slide-fields">
                                    <div className="cr-slide-title-row">
                                        <span className="cr-slide-num">#{idx + 1}</span>
                                        <span className="cr-slide-name" title={slide.name}>{slide.name}</span>
                                        <div className="cr-slide-actions">
                                            <button type="button" className="admin-btn admin-btn-secondary cr-small" onClick={() => recrop(slide)} disabled={!!publishing || slide.unreadable} title={slide.unreadable ? 'Format non lisible : recadrage impossible' : 'Modifier le cadrage'}>
                                                <Crop size={14} /> Recadrer
                                            </button>
                                            <button type="button" className="admin-btn admin-btn-danger cr-small" onClick={() => removeSlide(slide)} disabled={!!publishing} aria-label="Retirer cette photo">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="cr-fields-grid">
                                        <div>
                                            <label className="admin-label">Titre (FR)</label>
                                            <input type="text" className="admin-input" value={slide.title} onChange={(e) => updateSlide(slide.id, { title: e.target.value })} placeholder="Ex : Cuisine maison avec amour" />
                                        </div>
                                        <div>
                                            <label className="admin-label">Title (EN)</label>
                                            <input type="text" className="admin-input" value={slide.title_en} onChange={(e) => updateSlide(slide.id, { title_en: e.target.value })} placeholder="Ex: Homemade cuisine with love" />
                                        </div>
                                        <div>
                                            <label className="admin-label">Sous-titre (FR)</label>
                                            <input type="text" className="admin-input" value={slide.subtitle} onChange={(e) => updateSlide(slide.id, { subtitle: e.target.value })} placeholder="Ex : Des plats faits maison livrés à domicile" />
                                        </div>
                                        <div>
                                            <label className="admin-label">Subtitle (EN)</label>
                                            <input type="text" className="admin-input" value={slide.subtitle_en} onChange={(e) => updateSlide(slide.id, { subtitle_en: e.target.value })} placeholder="Ex: Homemade dishes delivered to your door" />
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </>
            )}

            {error && (
                <div className="cr-alert">
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                </div>
            )}

            <div className="cr-flow-footer">
                <button type="button" onClick={onCancel} className="admin-btn admin-btn-secondary" disabled={!!publishing}>
                    Annuler
                </button>
                {slides.length > 0 && (
                    <button type="button" onClick={publish} className="admin-btn admin-btn-primary" disabled={!!publishing} style={{ minWidth: '190px' }}>
                        {publishing ? (
                            <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Publication {publishing.done}/{publishing.total}…</>
                        ) : (
                            <><Images size={16} /> Publier {slides.length > 1 ? `les ${slides.length} photos` : 'la photo'}</>
                        )}
                    </button>
                )}
            </div>

            {cropper && (
                <ImageCropperModal
                    items={cropper.items}
                    targets={HERO_CROP_TARGETS}
                    heroPreview={true}
                    title={cropper.mode === 'new' ? (cropper.items.length > 1 ? 'Cadre tes photos' : 'Cadre ta photo') : 'Modifier le cadrage'}
                    onCancel={() => setCropper(null)}
                    onConfirm={handleCropped}
                />
            )}
        </div>
    );
}

/* ==========================================================================
   MODIFICATION d'une bannière existante
   ========================================================================== */
function EditCarouselForm({ item, onCancel }) {
    const [desktopFile, setDesktopFile] = useState(null);
    const [desktopPreview, setDesktopPreview] = useState(null);
    const [mobileFile, setMobileFile] = useState(null);
    const [mobilePreview, setMobilePreview] = useState(null);
    const [removeMobile, setRemoveMobile] = useState(false);
    const [cropper, setCropper] = useState(null);

    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const { make, release } = useObjectUrls();
    const desktopInputRef = useRef(null);
    const mobileInputRef = useRef(null);

    const currentDesktopImg = desktopPreview || item.image_url;
    const currentMobileImg = !removeMobile ? (mobilePreview || item.mobile_image_url) : null;
    const hasMobile = !!currentMobileImg;

    const targetOnly = (key, extra = {}) => {
        const base = HERO_CROP_TARGETS.find((t) => t.key === key);
        return [{ ...base, optional: false, ...extra }];
    };

    // Source "courante" d'un format : fichier tout juste recadré, sinon image enregistrée
    const currentSource = (kind) => {
        if (kind === 'desktop') return desktopFile ? { file: desktopFile } : { url: item.image_url };
        return mobileFile ? { file: mobileFile } : { url: item.mobile_image_url };
    };

    const pickFiles = (kind, fileList) => {
        const file = Array.from(fileList || []).find(isImageFile);
        if (!file) {
            setError('Format non supporté. Choisissez une image (JPG, PNG, WebP…).');
            return;
        }
        setError('');
        if (kind === 'desktop') {
            // Nouvelle photo principale : on propose aussi le format mobile, activé seulement s'il n'y en a pas déjà un
            const mobileTarget = { ...HERO_CROP_TARGETS[1], defaultEnabled: !hasMobile };
            setCropper({ items: [{ id: uid(), file, name: file.name }], targets: [HERO_CROP_TARGETS[0], mobileTarget], title: 'Cadrer la nouvelle photo' });
        } else {
            setCropper({ items: [{ id: uid(), file, name: file.name }], targets: targetOnly('mobile'), title: 'Cadrer la photo mobile' });
        }
    };

    const recropExisting = (kind) => {
        setError('');
        setCropper({
            items: [{ id: uid(), name: kind === 'desktop' ? 'photo-ordinateur' : 'photo-mobile', ...currentSource(kind) }],
            targets: targetOnly(kind),
            title: kind === 'desktop' ? 'Recadrer la photo ordinateur' : 'Recadrer la photo mobile',
        });
    };

    // Crée le format mobile à partir de la photo ordinateur déjà publiée
    const createMobileFromDesktop = () => {
        setError('');
        setCropper({
            items: [{ id: uid(), name: 'photo-mobile', ...currentSource('desktop') }],
            targets: targetOnly('mobile'),
            title: 'Créer le format mobile',
        });
    };

    const handleCropped = (results) => {
        const out = results[0]?.outputs || {};
        if (!out.desktop && !out.mobile) {
            setError("Cette image ne peut pas être recadrée ici. Importe-la de nouveau depuis ton appareil.");
            setCropper(null);
            return;
        }
        let newDesktop = null;
        let newMobile = null;
        if (out.desktop) {
            release(desktopPreview);
            setDesktopFile(out.desktop);
            setDesktopPreview(make(out.desktop));
            newDesktop = out.desktop;
        }
        if (out.mobile) {
            release(mobilePreview);
            setMobileFile(out.mobile);
            setMobilePreview(make(out.mobile));
            setRemoveMobile(false);
            newMobile = out.mobile;
        }
        setCropper(null);

        // Sauvegarde directe automatique du recadrage
        const formData = new FormData();
        formData.set('id', item.id);
        formData.set('title', item.title || '');
        formData.set('title_en', item.title_en || '');
        formData.set('subtitle', item.subtitle || '');
        formData.set('subtitle_en', item.subtitle_en || '');
        if (newDesktop) formData.append('image_file', newDesktop);
        if (newMobile) formData.append('mobile_image_file', newMobile);

        startTransition(async () => {
            try {
                const result = await editCarouselImage(formData);
                if (result?.error) {
                    setError(result.error);
                } else {
                    setSuccess(true);
                    setTimeout(() => setSuccess(false), 2500);
                }
            } catch (err) {
                console.error(err);
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        const formData = new FormData(e.target);
        formData.delete('image_file');
        formData.delete('mobile_image_file');
        formData.set('id', item.id);
        if (removeMobile) formData.set('remove_mobile_image', '1');
        if (desktopFile) formData.append('image_file', desktopFile);
        if (mobileFile && !removeMobile) formData.append('mobile_image_file', mobileFile);

        startTransition(async () => {
            try {
                const result = await editCarouselImage(formData);
                if (result?.error) {
                    setError(result.error);
                } else {
                    setSuccess(true);
                    setTimeout(() => onCancel(), 1000);
                }
            } catch (err) {
                console.error(err);
                setError("L'enregistrement a échoué (connexion ou fichier trop lourd).");
            }
        });
    };

    if (success) {
        return (
            <div className="cr-success is-small">
                <CheckCircle2 size={32} />
                <p>Modifications enregistrées avec succès !</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="cr-edit-form">
            <div className="cr-fields-grid">
                <div>
                    <label className="admin-label">Titre (FR)</label>
                    <input type="text" name="title" defaultValue={item.title} className="admin-input" />
                </div>
                <div>
                    <label className="admin-label">Title (EN)</label>
                    <input type="text" name="title_en" defaultValue={item.title_en || ''} placeholder="Title in English..." className="admin-input" />
                </div>
                <div>
                    <label className="admin-label">Sous-titre (FR)</label>
                    <input type="text" name="subtitle" defaultValue={item.subtitle || ''} className="admin-input" />
                </div>
                <div>
                    <label className="admin-label">Subtitle (EN)</label>
                    <input type="text" name="subtitle_en" defaultValue={item.subtitle_en || ''} placeholder="Subtitle in English..." className="admin-input" />
                </div>
            </div>

            <div className="cr-slots">
                {/* Ordinateur */}
                <div className="cr-slot cr-slot-desktop">
                    <div className="cr-slot-head">
                        <span><Monitor size={15} /> Photo ordinateur</span>
                        <em>16:9</em>
                    </div>
                    <div className="cr-slot-preview is-desktop">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {currentDesktopImg ? <img src={currentDesktopImg} alt="Photo ordinateur" /> : <ImageIcon size={32} />}
                    </div>
                    <div className="cr-slot-actions">
                        {currentDesktopImg && (
                            <button type="button" className="admin-btn admin-btn-secondary cr-small" onClick={() => recropExisting('desktop')}>
                                <Crop size={14} /> Recadrer
                            </button>
                        )}
                        <button type="button" className="admin-btn admin-btn-secondary cr-small" onClick={() => desktopInputRef.current?.click()}>
                            <UploadCloud size={14} /> Remplacer la photo
                        </button>
                    </div>
                    <input ref={desktopInputRef} type="file" accept="image/*,.heic,.heif" style={{ display: 'none' }} onChange={(e) => { pickFiles('desktop', e.target.files); e.target.value = ''; }} />
                </div>

                {/* Mobile */}
                <div className="cr-slot cr-slot-mobile">
                    <div className="cr-slot-head">
                        <span><Smartphone size={15} /> Photo mobile</span>
                        <em>9:16</em>
                    </div>
                    {hasMobile ? (
                        <>
                            <div className="cr-slot-preview is-mobile">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={currentMobileImg} alt="Photo mobile" />
                            </div>
                            <div className="cr-slot-actions">
                                <button type="button" className="admin-btn admin-btn-secondary cr-small" onClick={() => recropExisting('mobile')}>
                                    <Crop size={14} /> Recadrer
                                </button>
                                <button type="button" className="admin-btn admin-btn-secondary cr-small" onClick={() => mobileInputRef.current?.click()}>
                                    <UploadCloud size={14} /> Remplacer
                                </button>
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-danger cr-small"
                                    onClick={() => { release(mobilePreview); setMobileFile(null); setMobilePreview(null); setRemoveMobile(true); }}
                                    title="Supprimer la photo mobile spécifique"
                                    aria-label="Supprimer la photo mobile"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="cr-slot-empty">
                            <Smartphone size={26} />
                            <p>Aucun format mobile : sur téléphone, la photo ordinateur est utilisée et coupée sur les côtés.</p>
                            <button type="button" className="admin-btn admin-btn-primary cr-small" onClick={createMobileFromDesktop} disabled={!currentDesktopImg}>
                                <Crop size={14} /> Créer depuis la photo ordinateur
                            </button>
                            <button type="button" className="admin-btn admin-btn-secondary cr-small" onClick={() => mobileInputRef.current?.click()}>
                                <UploadCloud size={14} /> Importer une photo mobile
                            </button>
                        </div>
                    )}
                    <input ref={mobileInputRef} type="file" accept="image/*,.heic,.heif" style={{ display: 'none' }} onChange={(e) => { pickFiles('mobile', e.target.files); e.target.value = ''; }} />
                </div>
            </div>

            {error && <div className="cr-alert"><AlertCircle size={16} style={{ flexShrink: 0 }} /><span>{error}</span></div>}

            <div className="cr-flow-footer">
                <button type="button" onClick={onCancel} className="admin-btn admin-btn-secondary" disabled={isPending}>
                    Annuler
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={isPending}>
                    {isPending ? (
                        <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Enregistrement...</>
                    ) : 'Enregistrer'}
                </button>
            </div>

            {cropper && (
                <ImageCropperModal
                    items={cropper.items}
                    targets={cropper.targets}
                    heroPreview={true}
                    title={cropper.title}
                    onCancel={() => setCropper(null)}
                    onConfirm={handleCropped}
                />
            )}
        </form>
    );
}

/* ==========================================================================
   PAGE : liste des bannières
   ========================================================================== */
export default function CarouselClient({ images }) {
    const [prevImages, setPrevImages] = useState(images);
    const [carouselImages, setCarouselImages] = useState(images);
    if (images !== prevImages) {
        setPrevImages(images);
        setCarouselImages(images);
    }

    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleting, startDeleteTransition] = useTransition();
    const [isReordering, startReorderTransition] = useTransition();

    const handleReorder = (id, direction) => {
        setCarouselImages(prev => {
            const idx = prev.findIndex(img => img.id === id);
            if (idx === -1) return prev;
            const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (targetIdx < 0 || targetIdx >= prev.length) return prev;
            const next = [...prev];
            const [moved] = next.splice(idx, 1);
            next.splice(targetIdx, 0, moved);
            return next;
        });

        startReorderTransition(async () => {
            await reorderCarouselImage(id, direction);
        });
    };

    const handleDelete = (id) => {
        startDeleteTransition(async () => {
            await deleteCarouselImage(id);
            setDeleteId(null);
        });
    };

    return (
        <div className="animate-fade cr-page">
            <div className="cr-page-head">
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--admin-text)' }}>Gestion du Carrousel</h1>
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        Gérez les bannières d&apos;accueil : photos (cadrées pour ordinateur et mobile), titres et descriptions.
                    </p>
                </div>
                {!isAdding && !editingItem && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="admin-btn admin-btn-primary"
                    >
                        <Plus size={16} /> Nouvelles photos
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="admin-card cr-panel">
                    <div className="cr-panel-head">
                        <h2 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--admin-text)' }}>Ajouter des bannières</h2>
                        <button type="button" onClick={() => setIsAdding(false)} className="cr-close" aria-label="Fermer">
                            <X size={18} />
                        </button>
                    </div>
                    <AddSlidesFlow onCancel={() => setIsAdding(false)} />
                </div>
            )}

            {editingItem && (
                <div className="admin-card cr-panel">
                    <div className="cr-panel-head">
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--admin-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Pencil size={16} /> Modifier la bannière
                        </h2>
                        <button type="button" onClick={() => setEditingItem(null)} className="cr-close" aria-label="Fermer">
                            <X size={18} />
                        </button>
                    </div>
                    <EditCarouselForm key={editingItem.id} item={editingItem} onCancel={() => setEditingItem(null)} />
                </div>
            )}

            <div style={{ width: '100%', maxWidth: '1000px' }}>
                <h2 style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-text-subtle)', marginBottom: '1rem' }}>
                    Bannières actuelles ({carouselImages.length})
                </h2>

                {carouselImages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3.5rem 2rem', background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: '6px', color: 'var(--admin-text-muted)' }}>
                        Aucune photo dans le carrousel.
                    </div>
                ) : (
                    <div className="cr-grid">
                        {carouselImages.map((img, idx) => (
                            <div key={img.id} className="admin-card cr-card">
                                <div className="cr-card-media">
                                    {img.image_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={img.image_url} alt={img.title || ''} loading="lazy" />
                                    ) : (
                                        <div className="cr-card-noimg"><ImageIcon size={32} /></div>
                                    )}

                                    {/* Position & réorganisation */}
                                    <div className="cr-card-order">
                                        <span className="cr-badge">#{idx + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleReorder(img.id, 'up')}
                                            disabled={idx === 0 || isReordering}
                                            title="Monter / Déplacer vers la gauche"
                                            aria-label="Monter d'une position"
                                            className="cr-mini-btn"
                                        >
                                            <ChevronLeft size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleReorder(img.id, 'down')}
                                            disabled={idx === carouselImages.length - 1 || isReordering}
                                            title="Descendre / Déplacer vers la droite"
                                            aria-label="Descendre d'une position"
                                            className="cr-mini-btn"
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>

                                    {/* Modifier / Supprimer */}
                                    <div className="cr-card-actions">
                                        <button
                                            type="button"
                                            onClick={() => { setEditingItem(img); setIsAdding(false); }}
                                            className="cr-action-btn is-edit"
                                            title="Modifier les textes et recadrer les photos"
                                            aria-label="Modifier cette bannière"
                                        >
                                            <Pencil size={14} />
                                        </button>

                                        {deleteId === img.id ? (
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(img.id)}
                                                    disabled={isDeleting}
                                                    style={{ padding: '4px 10px', background: 'rgba(239,68,68,0.95)', border: 'none', color: 'white', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                                                >
                                                    {isDeleting ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : 'Confirmer'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteId(null)}
                                                    style={{ width: '28px', height: '28px', background: 'rgba(0,0,0,0.65)', border: 'none', color: 'white', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                    aria-label="Annuler la suppression"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setDeleteId(img.id)}
                                                className="cr-action-btn is-delete"
                                                title="Supprimer"
                                                aria-label="Supprimer cette bannière"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Miniature du format mobile */}
                                    {img.mobile_image_url ? (
                                        <div className="cr-card-phone" title="Photo affichée sur téléphone">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={img.mobile_image_url} alt="" loading="lazy" />
                                        </div>
                                    ) : (
                                        <div className="cr-card-nomobile" title="Aucune photo mobile : la photo ordinateur est utilisée">
                                            <Smartphone size={11} /> Pas de photo mobile
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '0.85rem 1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                        <h3 style={{ fontWeight: '600', fontSize: '0.9rem', color: img.title ? 'var(--admin-text)' : 'var(--admin-text-subtle)', margin: 0, fontStyle: img.title ? 'normal' : 'italic' }}>
                                            {img.title || 'Titre par défaut du site'}
                                        </h3>
                                        {img.title_en && (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--admin-gold)', fontStyle: 'italic' }}>
                                                EN - {img.title_en}
                                            </span>
                                        )}
                                    </div>
                                    {img.subtitle && <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem', marginTop: '0.2rem', marginBottom: 0 }}>{img.subtitle}</p>}
                                    {img.subtitle_en && <p style={{ color: 'var(--admin-gold)', opacity: 0.85, fontSize: '0.75rem', marginTop: '0.1rem', marginBottom: 0, fontStyle: 'italic' }}>EN - {img.subtitle_en}</p>}
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

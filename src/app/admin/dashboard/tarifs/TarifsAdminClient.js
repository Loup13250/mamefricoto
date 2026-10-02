'use client';

import { useState, useRef, useTransition } from 'react';
import { 
    addPricingDocument, 
    editPricingDocument, 
    deletePricingDocument, 
    reorderPricingDocument,
    deletePricingDocumentImage,
    deletePricingDocumentImages,
    reorderPricingDocumentImage
} from '@/app/actions';
import { 
    Plus, 
    Trash2, 
    Edit3, 
    X, 
    CheckCircle2, 
    AlertCircle, 
    ArrowUp, 
    ArrowDown, 
    Loader2, 
    FileText, 
    Sparkles, 
    ExternalLink,
    Image as ImageIcon,
    UploadCloud,
    ChevronLeft,
    ChevronRight,
    Languages,
    AlertTriangle,
    Check
} from 'lucide-react';

/* Utilitaire de compression client-side haute performance */
async function compressImageFile(file, maxWidth = 1400, quality = 0.80) {
    if (!file || !file.type.startsWith('image/')) return file;
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let w = img.width;
                let h = img.height;
                if (w > maxWidth) {
                    h = Math.round((h * maxWidth) / w);
                    w = maxWidth;
                }
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                canvas.toBlob(
                    (blob) => {
                        if (blob && blob.size < file.size) {
                            const newFile = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
                                type: 'image/webp',
                                lastModified: Date.now(),
                            });
                            resolve(newFile);
                        } else {
                            resolve(file);
                        }
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

export default function TarifsAdminClient({ pricingDocuments = [] }) {
    const [prevDocs, setPrevDocs] = useState(pricingDocuments);
    const [docList, setDocList] = useState(pricingDocuments);
    if (pricingDocuments !== prevDocs) {
        setPrevDocs(pricingDocuments);
        setDocList(pricingDocuments);
    }

    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleteModal, setDeleteModal] = useState(null); // { id, title }

    const [isAddingDoc, setIsAddingDoc] = useState(false);
    const [editingDoc, setEditingDoc] = useState(null);

    // Multi-selection state for batch image deletion
    const [selectedImagesFr, setSelectedImagesFr] = useState([]);
    const [selectedImagesEn, setSelectedImagesEn] = useState([]);

    // Confirmation pop-up for image deletion (single or batch)
    const [deleteImageConfirm, setDeleteImageConfirm] = useState(null); // { type: 'single' | 'batch', id?: string, ids?: [], lang: 'fr' | 'en' }

    // Form state pour ajout
    const [addDocType, setAddDocType] = useState('image'); // 'image' | 'pdf'
    const [addImagesFr, setAddImagesFr] = useState([]); // Array of { file, preview }
    const [addImagesEn, setAddImagesEn] = useState([]); // Array of { file, preview }
    const [addFormState, setAddFormState] = useState({ title: '', title_en: '', description: '', description_en: '' });

    // Form state pour édition
    const [editImagesFr, setEditImagesFr] = useState([]); // newly attached files
    const [editImagesEn, setEditImagesEn] = useState([]); // newly attached files
    const [editFormState, setEditFormState] = useState({ title: '', title_en: '', description: '', description_en: '' });

    // Pop-up confirmation pour quitter avec modifications non enregistrées
    const [unsavedConfirmModal, setUnsavedConfirmModal] = useState(null); // 'add' | 'edit' | null

    const docFormRef = useRef(null);
    const docEditFormRef = useRef(null);

    const isAddDirty = Boolean(
        addFormState.title.trim() !== '' ||
        addFormState.title_en.trim() !== '' ||
        addFormState.description.trim() !== '' ||
        addFormState.description_en.trim() !== '' ||
        addImagesFr.length > 0 ||
        addImagesEn.length > 0
    );

    const isEditDirty = Boolean(
        editingDoc && (
            editFormState.title !== (editingDoc.title || '') ||
            editFormState.title_en !== (editingDoc.title_en || '') ||
            editFormState.description !== (editingDoc.description || '') ||
            editFormState.description_en !== (editingDoc.description_en || '') ||
            editImagesFr.length > 0 ||
            editImagesEn.length > 0
        )
    );

    // Navigation / beforeunload protection when form is dirty
    useEffect(() => {
        const isDirty = (isAddingDoc && isAddDirty) || (editingDoc && isEditDirty);
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isAddingDoc, isAddDirty, editingDoc, isEditDirty]);

    const showNotification = (msg, isErr = false) => {
        if (isErr) {
            setError(msg);
            setTimeout(() => setError(''), 4500);
        } else {
            setSuccess(msg);
            setTimeout(() => setSuccess(''), 3500);
        }
    };

    const openAddModal = () => {
        setIsAddingDoc(true);
        setAddDocType('image');
        setAddImagesFr([]);
        setAddImagesEn([]);
        setAddFormState({ title: '', title_en: '', description: '', description_en: '' });
    };

    const openEditModal = (doc) => {
        setEditingDoc(doc);
        setEditFormState({
            title: doc.title || '',
            title_en: doc.title_en || '',
            description: doc.description || '',
            description_en: doc.description_en || ''
        });
        setEditImagesFr([]);
        setEditImagesEn([]);
        setSelectedImagesFr([]);
        setSelectedImagesEn([]);
    };

    const requestCloseAdd = () => {
        if (isAddDirty) {
            setUnsavedConfirmModal('add');
        } else {
            setIsAddingDoc(false);
            setAddImagesFr([]);
            setAddImagesEn([]);
            setAddFormState({ title: '', title_en: '', description: '', description_en: '' });
        }
    };

    const requestCloseEdit = () => {
        if (isEditDirty) {
            setUnsavedConfirmModal('edit');
        } else {
            setEditingDoc(null);
            setEditImagesFr([]);
            setEditImagesEn([]);
            setSelectedImagesFr([]);
            setSelectedImagesEn([]);
        }
    };

    const toggleSelectImage = (imgId, lang = 'fr') => {
        if (lang === 'fr') {
            setSelectedImagesFr(prev => prev.includes(imgId) ? prev.filter(id => id !== imgId) : [...prev, imgId]);
        } else {
            setSelectedImagesEn(prev => prev.includes(imgId) ? prev.filter(id => id !== imgId) : [...prev, imgId]);
        }
    };

    const selectAllImages = (lang = 'fr') => {
        if (!editingDoc) return;
        if (lang === 'fr') {
            const allFr = (editingDoc.images_fr || []).map(img => img.id);
            setSelectedImagesFr(allFr);
        } else {
            const allEn = (editingDoc.images_en || []).map(img => img.id);
            setSelectedImagesEn(allEn);
        }
    };

    const clearSelectedImages = (lang = 'fr') => {
        if (lang === 'fr') setSelectedImagesFr([]);
        else setSelectedImagesEn([]);
    };

    // Gestion de l'ajout d'images pour le formulaire de création
    const handleAddImagesSelect = async (files, lang = 'fr') => {
        const fileArr = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (fileArr.length === 0) return;

        const newItems = await Promise.all(fileArr.map(async (file) => {
            const compressed = await compressImageFile(file);
            return {
                file: compressed,
                preview: URL.createObjectURL(compressed)
            };
        }));

        if (lang === 'fr') {
            setAddImagesFr(prev => [...prev, ...newItems]);
        } else {
            setAddImagesEn(prev => [...prev, ...newItems]);
        }
    };

    const removeAddImage = (index, lang = 'fr') => {
        if (lang === 'fr') {
            setAddImagesFr(prev => prev.filter((_, i) => i !== index));
        } else {
            setAddImagesEn(prev => prev.filter((_, i) => i !== index));
        }
    };

    // Gestion de l'ajout d'images pour le formulaire d'édition
    const handleEditImagesSelect = async (files, lang = 'fr') => {
        const fileArr = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (fileArr.length === 0) return;

        const newItems = await Promise.all(fileArr.map(async (file) => {
            const compressed = await compressImageFile(file);
            return {
                file: compressed,
                preview: URL.createObjectURL(compressed)
            };
        }));

        if (lang === 'fr') {
            setEditImagesFr(prev => [...prev, ...newItems]);
        } else {
            setEditImagesEn(prev => [...prev, ...newItems]);
        }
    };

    const removeEditNewImage = (index, lang = 'fr') => {
        if (lang === 'fr') {
            setEditImagesFr(prev => prev.filter((_, i) => i !== index));
        } else {
            setEditImagesEn(prev => prev.filter((_, i) => i !== index));
        }
    };

    // Suppression d'une sous-image existante dans la DB (édition)
    const handleDeleteExistingImage = (imageId) => {
        // Optimistic removal from modal immediately
        setEditingDoc(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                images_fr: prev.images_fr ? prev.images_fr.filter(img => img.id !== imageId) : [],
                images_en: prev.images_en ? prev.images_en.filter(img => img.id !== imageId) : []
            };
        });

        setSelectedImagesFr(prev => prev.filter(id => id !== imageId));
        setSelectedImagesEn(prev => prev.filter(id => id !== imageId));
        setDeleteImageConfirm(null);

        startTransition(async () => {
            const res = await deletePricingDocumentImage(imageId);
            if (res?.error) {
                showNotification(res.error, true);
            } else {
                showNotification('Image supprimée de la carte.');
            }
        });
    };

    // Suppression groupée de sous-images existantes (édition)
    const handleBatchDeleteExistingImages = (imageIds, lang = 'fr') => {
        if (!imageIds || imageIds.length === 0) return;
        const idsSet = new Set(imageIds);

        // Optimistic removal
        setEditingDoc(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                images_fr: prev.images_fr ? prev.images_fr.filter(img => !idsSet.has(img.id)) : [],
                images_en: prev.images_en ? prev.images_en.filter(img => !idsSet.has(img.id)) : []
            };
        });

        if (lang === 'fr') setSelectedImagesFr([]);
        else setSelectedImagesEn([]);
        setDeleteImageConfirm(null);

        startTransition(async () => {
            const res = await deletePricingDocumentImages(imageIds);
            if (res?.error) {
                showNotification(res.error, true);
            } else {
                showNotification(`${imageIds.length} image${imageIds.length > 1 ? 's' : ''} supprimée${imageIds.length > 1 ? 's' : ''} avec succès.`);
            }
        });
    };

    // Réordonner une sous-image existante (édition)
    const handleReorderExistingImage = (imageId, direction) => {
        setEditingDoc(prev => {
            if (!prev) return prev;
            const isFr = prev.images_fr?.some(img => img.id === imageId);
            const key = isFr ? 'images_fr' : 'images_en';
            const list = [...(prev[key] || [])];
            const idx = list.findIndex(img => img.id === imageId);
            if (idx === -1) return prev;
            const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (targetIdx < 0 || targetIdx >= list.length) return prev;
            const [moved] = list.splice(idx, 1);
            list.splice(targetIdx, 0, moved);
            return {
                ...prev,
                [key]: list
            };
        });

        startTransition(async () => {
            const res = await reorderPricingDocumentImage(imageId, direction);
            if (res?.error) {
                showNotification(res.error, true);
            }
        });
    };

    // SOUMISSION: AJOUT
    const handleAddDoc = async (e) => {
        e.preventDefault();
        setError('');
        const form = e.target;
        const formData = new FormData();

        formData.append('title', form.title.value);
        formData.append('title_en', form.title_en?.value || '');
        formData.append('description', form.description.value);
        formData.append('description_en', form.description_en?.value || '');
        formData.append('doc_type', addDocType);

        if (addDocType === 'image') {
            if (addImagesFr.length === 0) {
                showNotification('Veuillez ajouter au moins une image en Français pour cette carte.', true);
                return;
            }
            addImagesFr.forEach(item => formData.append('image_files_fr', item.file));
            addImagesEn.forEach(item => formData.append('image_files_en', item.file));
        } else {
            const pdfFr = form.file_fr?.files?.[0];
            const pdfEn = form.file_en?.files?.[0];
            if (!pdfFr) {
                showNotification('Veuillez sélectionner un fichier PDF en Français.', true);
                return;
            }
            formData.append('file_fr', pdfFr);
            if (pdfEn) formData.append('file_en', pdfEn);
        }

        startTransition(async () => {
            const res = await addPricingDocument(formData);
            if (res?.error) {
                showNotification(res.error, true);
            } else {
                showNotification('Carte / Tarif ajouté avec succès !');
                setIsAddingDoc(false);
                setAddImagesFr([]);
                setAddImagesEn([]);
                setAddFormState({ title: '', title_en: '', description: '', description_en: '' });
                docFormRef.current?.reset();
            }
        });
    };

    // SOUMISSION: MODIFICATION
    const handleEditDoc = async (e) => {
        e.preventDefault();
        if (!editingDoc) return;
        setError('');
        const form = e.target;
        const formData = new FormData();

        formData.append('id', editingDoc.id);
        formData.append('title', form.title.value);
        formData.append('title_en', form.title_en?.value || '');
        formData.append('description', form.description.value);
        formData.append('description_en', form.description_en?.value || '');

        if (editingDoc.file_type === 'pdf') {
            const pdfFr = form.file_fr?.files?.[0];
            const pdfEn = form.file_en?.files?.[0];
            if (pdfFr) formData.append('file_fr', pdfFr);
            if (pdfEn) formData.append('file_en', pdfEn);
        } else {
            // Append newly attached images
            editImagesFr.forEach(item => formData.append('image_files_fr', item.file));
            editImagesEn.forEach(item => formData.append('image_files_en', item.file));
        }

        startTransition(async () => {
            const res = await editPricingDocument(formData);
            if (res?.error) {
                showNotification(res.error, true);
            } else {
                showNotification('Carte / Tarif mis à jour avec succès !');
                setEditingDoc(null);
                setEditImagesFr([]);
                setEditImagesEn([]);
                setSelectedImagesFr([]);
                setSelectedImagesEn([]);
            }
        });
    };

    const handleDeleteDoc = (id) => {
        startTransition(async () => {
            const res = await deletePricingDocument(id);
            if (res?.error) {
                showNotification(res.error, true);
            } else {
                showNotification('Carte / Tarif supprimé.');
                setDeleteModal(null);
            }
        });
    };

    const handleReorderDoc = (id, direction) => {
        setDocList(prev => {
            const idx = prev.findIndex(d => d.id === id);
            if (idx === -1) return prev;
            const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (targetIdx < 0 || targetIdx >= prev.length) return prev;
            const next = [...prev];
            const [moved] = next.splice(idx, 1);
            next.splice(targetIdx, 0, moved);
            return next;
        });

        startTransition(async () => {
            const res = await reorderPricingDocument(id, direction);
            if (res?.error) {
                showNotification(res.error, true);
            }
        });
    };

    return (
        <div className="anim-fade" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div>
                    <span className="label" style={{ display: 'block', marginBottom: '0.4rem' }}>
                        Gestion des Cartes & Formules
                    </span>
                    <h1 className="title-md" style={{ color: 'var(--admin-text)', marginBottom: '0.3rem' }}>
                        Tarifs & Cartes Gourmandes
                    </h1>
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.95rem' }}>
                        Gérez ici les cartes, menus et grilles de tarifs affichés sur la page publique <strong>/tarifs</strong>.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <a
                        href="/tarifs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-btn admin-btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                    >
                        <ExternalLink size={15} /> Voir la page /tarifs
                    </a>
                    {!isAddingDoc && (
                        <button
                            type="button"
                            onClick={openAddModal}
                            className="admin-btn admin-btn-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                        >
                            <Plus size={16} /> Ajouter un Tarif / Carte
                        </button>
                    )}
                </div>
            </div>

            {/* Notifications */}
            {error && (
                <div className="admin-alert admin-alert-error" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}
            {success && (
                <div className="admin-alert admin-alert-success" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <CheckCircle2 size={18} />
                    <span>{success}</span>
                </div>
            )}

            {/* FORMULAIRE: AJOUT */}
            {isAddingDoc && (
                <div className="admin-card" style={{ marginBottom: '2.5rem', border: '1px solid rgba(200, 169, 110, 0.4)' }}>
                    <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Plus size={18} style={{ color: 'var(--admin-gold)' }} />
                            Nouveau Tarif / Nouvelle Carte
                        </h2>
                        <button
                            type="button"
                            onClick={requestCloseAdd}
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                            <X size={15} /> Annuler
                        </button>
                    </div>

                    <form ref={docFormRef} onSubmit={handleAddDoc} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Type de document selector */}
                        <div>
                            <label className="admin-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                Format du document
                            </label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    border: addDocType === 'image' ? '1px solid var(--admin-gold)' : '1px solid var(--admin-border)',
                                    background: addDocType === 'image' ? 'rgba(200, 169, 110, 0.1)' : 'var(--admin-card-bg)',
                                    fontWeight: addDocType === 'image' ? '600' : 'normal',
                                    color: 'var(--admin-text)'
                                }}>
                                    <input
                                        type="radio"
                                        name="doc_type_choice"
                                        value="image"
                                        checked={addDocType === 'image'}
                                        onChange={() => setAddDocType('image')}
                                    />
                                    <ImageIcon size={18} style={{ color: 'var(--admin-gold)' }} />
                                    Galerie d&apos;Images / Cartes (Multi-photos carrousel)
                                </label>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    border: addDocType === 'pdf' ? '1px solid var(--admin-gold)' : '1px solid var(--admin-border)',
                                    background: addDocType === 'pdf' ? 'rgba(200, 169, 110, 0.1)' : 'var(--admin-card-bg)',
                                    fontWeight: addDocType === 'pdf' ? '600' : 'normal',
                                    color: 'var(--admin-text)'
                                }}>
                                    <input
                                        type="radio"
                                        name="doc_type_choice"
                                        value="pdf"
                                        checked={addDocType === 'pdf'}
                                        onChange={() => setAddDocType('pdf')}
                                    />
                                    <FileText size={18} style={{ color: 'var(--admin-gold)' }} />
                                    Fichier PDF téléchargeable
                                </label>
                            </div>
                        </div>

                        {/* Titres FR / EN */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                            <div>
                                <label className="admin-label" htmlFor="doc_title_fr">
                                    Titre de la carte (Français) *
                                </label>
                                <input
                                    id="doc_title_fr"
                                    type="text"
                                    name="title"
                                    required
                                    value={addFormState.title}
                                    onChange={(e) => setAddFormState(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Ex: Carte des Buffets & Cocktails"
                                    className="admin-input"
                                />
                            </div>
                            <div>
                                <label className="admin-label" htmlFor="doc_title_en" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Languages size={14} style={{ color: 'var(--admin-gold)' }} /> Titre en Anglais (Optionnel)
                                </label>
                                <input
                                    id="doc_title_en"
                                    type="text"
                                    name="title_en"
                                    value={addFormState.title_en}
                                    onChange={(e) => setAddFormState(prev => ({ ...prev, title_en: e.target.value }))}
                                    placeholder="Ex: Buffet & Cocktail Menu"
                                    className="admin-input"
                                />
                            </div>
                        </div>

                        {/* Descriptions FR / EN */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                            <div>
                                <label className="admin-label" htmlFor="doc_desc_fr">
                                    Description / Détails (Français)
                                </label>
                                <textarea
                                    id="doc_desc_fr"
                                    name="description"
                                    rows={2}
                                    value={addFormState.description}
                                    onChange={(e) => setAddFormState(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Ex: Formules complètes pour réceptions, mariages et séminaires."
                                    className="admin-textarea"
                                />
                            </div>
                            <div>
                                <label className="admin-label" htmlFor="doc_desc_en" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Languages size={14} style={{ color: 'var(--admin-gold)' }} /> Description en Anglais (Optionnel)
                                </label>
                                <textarea
                                    id="doc_desc_en"
                                    name="description_en"
                                    rows={2}
                                    value={addFormState.description_en}
                                    onChange={(e) => setAddFormState(prev => ({ ...prev, description_en: e.target.value }))}
                                    placeholder="Ex: Complete packages for receptions, weddings and corporate events."
                                    className="admin-textarea"
                                />
                            </div>
                        </div>

                        {/* Upload section selon doc_type */}
                        {addDocType === 'image' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '0.5rem' }}>
                                {/* Multi-images FR */}
                                <div style={{ background: 'var(--admin-surface)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                                    <label className="admin-label" style={{ fontWeight: '600', color: 'var(--admin-text)', display: 'block', marginBottom: '0.5rem' }}>
                                        🇫🇷 Images en Français (Une ou plusieurs photos / pages) *
                                    </label>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginBottom: '0.75rem' }}>
                                        Sélectionnez vos pages de menus. Si plusieurs photos sont ajoutées, un carrousel interactif sera automatiquement créé sur le site.
                                    </p>
                                    
                                    <label className="admin-dropzone" style={{ cursor: 'pointer', display: 'block', textAlign: 'center', padding: '1.5rem', border: '2px dashed var(--admin-border)', borderRadius: '8px' }}>
                                        <UploadCloud size={28} style={{ color: 'var(--admin-gold)', margin: '0 auto 0.5rem' }} />
                                        <span style={{ fontSize: '0.85rem', color: 'var(--admin-text)', fontWeight: '500', display: 'block' }}>
                                            Cliquez ou glissez vos images FR
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>JPG, PNG ou WebP</span>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleAddImagesSelect(e.target.files, 'fr')}
                                        />
                                    </label>

                                    {/* Previews FR */}
                                    {addImagesFr.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
                                            {addImagesFr.map((item, idx) => (
                                                <div key={idx} style={{ position: 'relative', width: '80px', height: '100px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--admin-border)' }}>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={item.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <span style={{ position: 'absolute', bottom: '2px', left: '2px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px' }}>
                                                        #{idx + 1}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAddImage(idx, 'fr')}
                                                        aria-label="Supprimer l'image"
                                                        style={{ position: 'absolute', top: '2px', right: '2px', background: '#C4593A', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Multi-images EN */}
                                <div style={{ background: 'var(--admin-surface)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                                    <label className="admin-label" style={{ fontWeight: '600', color: 'var(--admin-text)', display: 'block', marginBottom: '0.5rem' }}>
                                        🇬🇧 Images en Anglais (Optionnel)
                                    </label>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginBottom: '0.75rem' }}>
                                        Si vous avez une version traduite de cette carte en anglais, importez-la ici.
                                    </p>
                                    
                                    <label className="admin-dropzone" style={{ cursor: 'pointer', display: 'block', textAlign: 'center', padding: '1.5rem', border: '2px dashed var(--admin-border)', borderRadius: '8px' }}>
                                        <UploadCloud size={28} style={{ color: 'var(--admin-gold)', margin: '0 auto 0.5rem' }} />
                                        <span style={{ fontSize: '0.85rem', color: 'var(--admin-text)', fontWeight: '500', display: 'block' }}>
                                            Cliquez ou glissez vos images EN
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>JPG, PNG ou WebP</span>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleAddImagesSelect(e.target.files, 'en')}
                                        />
                                    </label>

                                    {/* Previews EN */}
                                    {addImagesEn.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
                                            {addImagesEn.map((item, idx) => (
                                                <div key={idx} style={{ position: 'relative', width: '80px', height: '100px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--admin-border)' }}>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={item.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <span style={{ position: 'absolute', bottom: '2px', left: '2px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px' }}>
                                                        #{idx + 1}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAddImage(idx, 'en')}
                                                        aria-label="Supprimer l'image"
                                                        style={{ position: 'absolute', top: '2px', right: '2px', background: '#C4593A', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* PDF Upload FR & EN */
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '0.5rem' }}>
                                <div>
                                    <label className="admin-label" htmlFor="doc_pdf_fr">
                                        Fichier PDF (Français) *
                                    </label>
                                    <input
                                        id="doc_pdf_fr"
                                        type="file"
                                        name="file_fr"
                                        accept=".pdf,application/pdf"
                                        required
                                        className="admin-input"
                                    />
                                </div>
                                <div>
                                    <label className="admin-label" htmlFor="doc_pdf_en" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <Languages size={14} style={{ color: 'var(--admin-gold)' }} /> Fichier PDF (Anglais - Optionnel)
                                    </label>
                                    <input
                                        id="doc_pdf_en"
                                        type="file"
                                        name="file_en"
                                        accept=".pdf,application/pdf"
                                        className="admin-input"
                                    />
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                            <button
                                type="button"
                                onClick={requestCloseAdd}
                                className="admin-btn admin-btn-secondary"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="admin-btn admin-btn-primary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                {isPending ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                                Enregistrer et Publier le Tarif
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL: ÉDITION */}
            {editingDoc && (
                <div 
                    onClick={requestCloseEdit}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(5px)',
                        zIndex: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem',
                        overflowY: 'auto'
                    }}
                >
                    <div 
                        className="admin-card anim-fade" 
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', margin: 'auto' }}
                    >
                        <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Edit3 size={18} style={{ color: 'var(--admin-gold)' }} />
                                Modifier la carte : {editingDoc.title}
                            </h2>
                            <button
                                type="button"
                                onClick={requestCloseEdit}
                                style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form ref={docEditFormRef} onSubmit={handleEditDoc} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Titres FR / EN */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                                <div>
                                    <label className="admin-label" htmlFor="edit_doc_title_fr">
                                        Titre (Français) *
                                    </label>
                                    <input
                                        id="edit_doc_title_fr"
                                        type="text"
                                        name="title"
                                        required
                                        value={editFormState.title}
                                        onChange={(e) => setEditFormState(prev => ({ ...prev, title: e.target.value }))}
                                        className="admin-input"
                                    />
                                </div>
                                <div>
                                    <label className="admin-label" htmlFor="edit_doc_title_en" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <Languages size={14} style={{ color: 'var(--admin-gold)' }} /> Titre (Anglais)
                                    </label>
                                    <input
                                        id="edit_doc_title_en"
                                        type="text"
                                        name="title_en"
                                        value={editFormState.title_en}
                                        onChange={(e) => setEditFormState(prev => ({ ...prev, title_en: e.target.value }))}
                                        className="admin-input"
                                    />
                                </div>
                            </div>

                            {/* Descriptions FR / EN */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                                <div>
                                    <label className="admin-label" htmlFor="edit_doc_desc_fr">
                                        Description (Français)
                                    </label>
                                    <textarea
                                        id="edit_doc_desc_fr"
                                        name="description"
                                        rows={2}
                                        value={editFormState.description}
                                        onChange={(e) => setEditFormState(prev => ({ ...prev, description: e.target.value }))}
                                        className="admin-textarea"
                                    />
                                </div>
                                <div>
                                    <label className="admin-label" htmlFor="edit_doc_desc_en" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <Languages size={14} style={{ color: 'var(--admin-gold)' }} /> Description (Anglais)
                                    </label>
                                    <textarea
                                        id="edit_doc_desc_en"
                                        name="description_en"
                                        rows={2}
                                        value={editFormState.description_en}
                                        onChange={(e) => setEditFormState(prev => ({ ...prev, description_en: e.target.value }))}
                                        className="admin-textarea"
                                    />
                                </div>
                            </div>

                            {/* Images / PDF management */}
                            {editingDoc.file_type === 'pdf' ? (
                                <div style={{ background: 'var(--admin-surface)', padding: '1.25rem', borderRadius: '8px' }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--admin-text)', marginBottom: '1rem' }}>
                                        Fichier PDF actuel : <a href={editingDoc.file_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--admin-gold)' }}>Consulter le PDF</a>
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                                        <div>
                                            <label className="admin-label" htmlFor="edit_doc_pdf_fr">
                                                Remplacer le PDF (Français)
                                            </label>
                                            <input id="edit_doc_pdf_fr" type="file" name="file_fr" accept=".pdf,application/pdf" className="admin-input" />
                                        </div>
                                        <div>
                                            <label className="admin-label" htmlFor="edit_doc_pdf_en">
                                                Remplacer le PDF (Anglais)
                                            </label>
                                            <input id="edit_doc_pdf_en" type="file" name="file_en" accept=".pdf,application/pdf" className="admin-input" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                                    {/* GESTION IMAGES FR */}
                                    <div style={{ background: 'var(--admin-surface)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--admin-text)', margin: 0 }}>
                                                🇫🇷 Images Françaises ({editingDoc.images_fr?.length || 0})
                                            </h3>
                                            {(editingDoc.images_fr?.length || 0) > 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (selectedImagesFr.length === editingDoc.images_fr.length) {
                                                                clearSelectedImages('fr');
                                                            } else {
                                                                selectAllImages('fr');
                                                            }
                                                        }}
                                                        className="admin-btn admin-btn-secondary"
                                                        style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                                                    >
                                                        {selectedImagesFr.length === editingDoc.images_fr.length ? 'Désélectionner tout' : 'Tout sélectionner'}
                                                    </button>
                                                    {selectedImagesFr.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteImageConfirm({ type: 'batch', ids: [...selectedImagesFr], lang: 'fr' })}
                                                            style={{
                                                                padding: '3px 9px',
                                                                fontSize: '0.72rem',
                                                                background: '#ef4444',
                                                                color: '#fff',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                fontWeight: '600'
                                                            }}
                                                        >
                                                            <Trash2 size={12} /> Supprimer sélection ({selectedImagesFr.length})
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Existing images list */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                                            {(editingDoc.images_fr || []).map((img, idx) => {
                                                const isSelected = selectedImagesFr.includes(img.id);
                                                return (
                                                    <div 
                                                        key={img.id} 
                                                        style={{ 
                                                            position: 'relative', 
                                                            width: '90px', 
                                                            height: '120px', 
                                                            borderRadius: '6px', 
                                                            overflow: 'hidden', 
                                                            border: isSelected ? '2px solid var(--admin-gold)' : '1px solid var(--admin-border)',
                                                            boxShadow: isSelected ? '0 0 8px rgba(200, 169, 110, 0.4)' : 'none'
                                                        }}
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <span style={{ position: 'absolute', bottom: '2px', left: '2px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px' }}>
                                                            #{idx + 1}
                                                        </span>
                                                        
                                                        {/* Boutons réordonner */}
                                                        <div style={{ position: 'absolute', top: '2px', left: '2px', display: 'flex', gap: '2px' }}>
                                                            {idx > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleReorderExistingImage(img.id, 'up')}
                                                                    style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '3px', width: '18px', height: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                >
                                                                    <ChevronLeft size={12} />
                                                                </button>
                                                            )}
                                                            {idx < (editingDoc.images_fr.length - 1) && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleReorderExistingImage(img.id, 'down')}
                                                                    style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '3px', width: '18px', height: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                >
                                                                    <ChevronRight size={12} />
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Bouton suppression unique avec confirmation pop-up */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteImageConfirm({ type: 'single', id: img.id, lang: 'fr' })}
                                                            title="Supprimer cette image"
                                                            style={{ position: 'absolute', top: '2px', right: '2px', background: '#C4593A', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
                                                        >
                                                            <Trash2 size={11} />
                                                        </button>

                                                        {/* Checkbox sélection groupée */}
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSelectImage(img.id, 'fr')}
                                                            title={isSelected ? "Désélectionner" : "Sélectionner pour suppression multiple"}
                                                            style={{
                                                                position: 'absolute',
                                                                bottom: '2px',
                                                                right: '2px',
                                                                width: '20px',
                                                                height: '20px',
                                                                borderRadius: '4px',
                                                                background: isSelected ? 'var(--admin-gold)' : 'rgba(0,0,0,0.65)',
                                                                border: isSelected ? '1px solid var(--admin-gold)' : '1px solid rgba(255,255,255,0.4)',
                                                                color: isSelected ? '#000' : 'transparent',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                cursor: 'pointer',
                                                                zIndex: 2,
                                                                padding: 0
                                                            }}
                                                        >
                                                            <Check size={13} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Dropzone pour ajouter de nouvelles images FR */}
                                        <label className="admin-dropzone" style={{ cursor: 'pointer', display: 'block', textAlign: 'center', padding: '1rem', border: '2px dashed var(--admin-border)', borderRadius: '8px' }}>
                                            <UploadCloud size={22} style={{ color: 'var(--admin-gold)', margin: '0 auto 0.25rem' }} />
                                            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text)', fontWeight: '500', display: 'block' }}>
                                                + Ajouter des photos FR
                                            </span>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={(e) => handleEditImagesSelect(e.target.files, 'fr')}
                                            />
                                        </label>

                                        {/* Nouvelles images FR en attente d'enregistrement */}
                                        {editImagesFr.length > 0 && (
                                            <div style={{ marginTop: '0.75rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--admin-gold)', fontWeight: '600' }}>
                                                    Nouvelles images à enregistrer :
                                                </span>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
                                                    {editImagesFr.map((item, idx) => (
                                                        <div key={idx} style={{ position: 'relative', width: '60px', height: '80px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--admin-gold)' }}>
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={item.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeEditNewImage(idx, 'fr')}
                                                                style={{ position: 'absolute', top: '1px', right: '1px', background: '#C4593A', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* GESTION IMAGES EN */}
                                    <div style={{ background: 'var(--admin-surface)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--admin-text)', margin: 0 }}>
                                                🇬🇧 Images Anglaises ({editingDoc.images_en?.length || 0})
                                            </h3>
                                            {(editingDoc.images_en?.length || 0) > 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (selectedImagesEn.length === editingDoc.images_en.length) {
                                                                clearSelectedImages('en');
                                                            } else {
                                                                selectAllImages('en');
                                                            }
                                                        }}
                                                        className="admin-btn admin-btn-secondary"
                                                        style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                                                    >
                                                        {selectedImagesEn.length === editingDoc.images_en.length ? 'Désélectionner tout' : 'Tout sélectionner'}
                                                    </button>
                                                    {selectedImagesEn.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteImageConfirm({ type: 'batch', ids: [...selectedImagesEn], lang: 'en' })}
                                                            style={{
                                                                padding: '3px 9px',
                                                                fontSize: '0.72rem',
                                                                background: '#ef4444',
                                                                color: '#fff',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                fontWeight: '600'
                                                            }}
                                                        >
                                                            <Trash2 size={12} /> Supprimer sélection ({selectedImagesEn.length})
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Existing images EN */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                                            {(editingDoc.images_en || []).map((img, idx) => {
                                                const isSelected = selectedImagesEn.includes(img.id);
                                                return (
                                                    <div 
                                                        key={img.id} 
                                                        style={{ 
                                                            position: 'relative', 
                                                            width: '90px', 
                                                            height: '120px', 
                                                            borderRadius: '6px', 
                                                            overflow: 'hidden', 
                                                            border: isSelected ? '2px solid var(--admin-gold)' : '1px solid var(--admin-border)',
                                                            boxShadow: isSelected ? '0 0 8px rgba(200, 169, 110, 0.4)' : 'none'
                                                        }}
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <span style={{ position: 'absolute', bottom: '2px', left: '2px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px' }}>
                                                            #{idx + 1}
                                                        </span>

                                                        {/* Boutons réordonner */}
                                                        <div style={{ position: 'absolute', top: '2px', left: '2px', display: 'flex', gap: '2px' }}>
                                                            {idx > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleReorderExistingImage(img.id, 'up')}
                                                                    style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '3px', width: '18px', height: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                >
                                                                    <ChevronLeft size={12} />
                                                                </button>
                                                            )}
                                                            {idx < (editingDoc.images_en.length - 1) && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleReorderExistingImage(img.id, 'down')}
                                                                    style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '3px', width: '18px', height: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                >
                                                                    <ChevronRight size={12} />
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Bouton suppression unique avec confirmation pop-up */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteImageConfirm({ type: 'single', id: img.id, lang: 'en' })}
                                                            title="Supprimer cette image"
                                                            style={{ position: 'absolute', top: '2px', right: '2px', background: '#C4593A', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
                                                        >
                                                            <Trash2 size={11} />
                                                        </button>

                                                        {/* Checkbox sélection groupée */}
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSelectImage(img.id, 'en')}
                                                            title={isSelected ? "Désélectionner" : "Sélectionner pour suppression multiple"}
                                                            style={{
                                                                position: 'absolute',
                                                                bottom: '2px',
                                                                right: '2px',
                                                                width: '20px',
                                                                height: '20px',
                                                                borderRadius: '4px',
                                                                background: isSelected ? 'var(--admin-gold)' : 'rgba(0,0,0,0.65)',
                                                                border: isSelected ? '1px solid var(--admin-gold)' : '1px solid rgba(255,255,255,0.4)',
                                                                color: isSelected ? '#000' : 'transparent',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                cursor: 'pointer',
                                                                zIndex: 2,
                                                                padding: 0
                                                            }}
                                                        >
                                                            <Check size={13} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Dropzone pour ajouter de nouvelles images EN */}
                                        <label className="admin-dropzone" style={{ cursor: 'pointer', display: 'block', textAlign: 'center', padding: '1rem', border: '2px dashed var(--admin-border)', borderRadius: '8px' }}>
                                            <UploadCloud size={22} style={{ color: 'var(--admin-gold)', margin: '0 auto 0.25rem' }} />
                                            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text)', fontWeight: '500', display: 'block' }}>
                                                + Ajouter des photos EN
                                            </span>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={(e) => handleEditImagesSelect(e.target.files, 'en')}
                                            />
                                        </label>

                                        {/* Nouvelles images EN en attente */}
                                        {editImagesEn.length > 0 && (
                                            <div style={{ marginTop: '0.75rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--admin-gold)', fontWeight: '600' }}>
                                                    Nouvelles images à enregistrer :
                                                </span>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
                                                    {editImagesEn.map((item, idx) => (
                                                        <div key={idx} style={{ position: 'relative', width: '60px', height: '80px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--admin-gold)' }}>
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={item.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeEditNewImage(idx, 'en')}
                                                                style={{ position: 'absolute', top: '1px', right: '1px', background: '#C4593A', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={requestCloseEdit}
                                    className="admin-btn admin-btn-secondary"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="admin-btn admin-btn-primary"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    {isPending ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />}
                                    Mettre à jour la carte
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* LISTE DES CARTES DE TARIFS */}
            <div className="admin-card">
                <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 className="admin-card-title">Cartes et Formules publiées</h2>
                        <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                            {docList.length} carte(s) configurée(s)
                        </span>
                    </div>
                </div>

                {docList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                        <ImageIcon size={48} style={{ color: 'var(--admin-gold)', opacity: 0.5, margin: '0 auto 1rem' }} />
                        <h3 style={{ fontSize: '1.1rem', color: 'var(--admin-text)', marginBottom: '0.5rem' }}>
                            Aucune carte de tarif pour le moment
                        </h3>
                        <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', maxWidth: '460px', margin: '0 auto 1.5rem' }}>
                            Ajoutez votre première carte (buffet, menus traiteur, cocktails...) pour qu&apos;elle s&apos;affiche sur la page publique <strong>/tarifs</strong>.
                        </p>
                        <button
                            type="button"
                            onClick={openAddModal}
                            className="admin-btn admin-btn-primary"
                        >
                            <Plus size={16} /> Ajouter une Carte de Tarif
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {docList.map((doc, idx) => {
                            const isPdf = doc.file_type === 'pdf';
                            const frCount = doc.images_fr?.length || (doc.file_url ? 1 : 0);
                            const enCount = doc.images_en?.length || (doc.file_url_en ? 1 : 0);
                            const thumbUrl = (doc.images_fr && doc.images_fr.length > 0) ? doc.images_fr[0].image_url : doc.file_url;

                            return (
                                <div
                                    key={doc.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '1rem',
                                        padding: '1.25rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--admin-border)',
                                        background: 'var(--admin-surface)',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, minWidth: '280px' }}>
                                        {/* Reorder Buttons */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleReorderDoc(doc.id, 'up')}
                                                disabled={idx === 0 || isPending}
                                                aria-label="Monter d'une position"
                                                style={{
                                                    background: 'none',
                                                    border: '1px solid var(--admin-border)',
                                                    borderRadius: '4px',
                                                    padding: '3px',
                                                    cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                                    color: idx === 0 ? 'var(--admin-border)' : 'var(--admin-text)',
                                                    opacity: idx === 0 ? 0.4 : 1,
                                                }}
                                            >
                                                <ArrowUp size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleReorderDoc(doc.id, 'down')}
                                                disabled={idx === docList.length - 1 || isPending}
                                                aria-label="Descendre d'une position"
                                                style={{
                                                    background: 'none',
                                                    border: '1px solid var(--admin-border)',
                                                    borderRadius: '4px',
                                                    padding: '3px',
                                                    cursor: idx === docList.length - 1 ? 'not-allowed' : 'pointer',
                                                    color: idx === docList.length - 1 ? 'var(--admin-border)' : 'var(--admin-text)',
                                                    opacity: idx === docList.length - 1 ? 0.4 : 1,
                                                }}
                                            >
                                                <ArrowDown size={14} />
                                            </button>
                                        </div>

                                        {/* Thumbnail preview */}
                                        <div style={{
                                            width: '64px',
                                            height: '76px',
                                            borderRadius: '6px',
                                            overflow: 'hidden',
                                            background: 'rgba(0,0,0,0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '1px solid var(--admin-border)',
                                            flexShrink: 0
                                        }}>
                                            {isPdf ? (
                                                <FileText size={28} style={{ color: 'var(--admin-gold)' }} />
                                            ) : thumbUrl ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={thumbUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <ImageIcon size={24} style={{ color: 'var(--admin-border)' }} />
                                            )}
                                        </div>

                                        {/* Card Info */}
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-gold)', background: 'rgba(200,169,110,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                                                    #{idx + 1}
                                                </span>
                                                <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--admin-text)', margin: 0 }}>
                                                    {doc.title}
                                                </h3>
                                                {doc.title_en && (
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                                                        ({doc.title_en})
                                                    </span>
                                                )}
                                            </div>

                                            {doc.description && (
                                                <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', margin: '0 0 0.4rem 0' }}>
                                                    {doc.description}
                                                </p>
                                            )}

                                            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', fontSize: '0.78rem' }}>
                                                <span style={{ background: isPdf ? 'rgba(59, 130, 246, 0.12)' : 'rgba(200, 169, 110, 0.12)', color: isPdf ? '#3b82f6' : 'var(--admin-gold)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                                                    {isPdf ? 'Document PDF' : `Images : 🇫🇷 ${frCount} photo${frCount > 1 ? 's' : ''} ${enCount > 0 ? `| 🇬🇧 ${enCount}` : ''}`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(doc)}
                                            className="admin-btn admin-btn-secondary"
                                            style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                        >
                                            <Edit3 size={15} /> Modifier
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteModal({ id: doc.id, title: doc.title })}
                                            className="admin-btn admin-btn-danger"
                                            aria-label="Supprimer cette carte"
                                            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

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
                                ? `Supprimer ${deleteImageConfirm.lang === 'fr' ? selectedImagesFr.length : selectedImagesEn.length} image(s) ?`
                                : "Supprimer cette image ?"
                            }
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                            {deleteImageConfirm.type === 'batch'
                                ? "Cette action supprimera définitivement toutes les images sélectionnées de cette carte. Êtes-vous sûr(e) ?"
                                : "Cette action supprimera définitivement cette photo de la carte. Cette action est irréversible."
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
                                        handleDeleteExistingImage(target.id, target.lang);
                                    } else if (target.type === 'batch') {
                                        handleBatchDeleteExistingImages(target.lang);
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
            {unsavedConfirmModal && (
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
                            Vous avez apporté des modifications qui n&apos;ont pas encore été enregistrées. Que souhaitez-vous faire ?
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => {
                                    const target = unsavedConfirmModal;
                                    setUnsavedConfirmModal(null);
                                    if (target === 'add') {
                                        docFormRef.current?.requestSubmit();
                                    } else if (target === 'edit') {
                                        docEditFormRef.current?.requestSubmit();
                                    }
                                }}
                                className="admin-btn admin-btn-primary"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}
                            >
                                <CheckCircle2 size={16} /> Enregistrer les modifications
                            </button>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setUnsavedConfirmModal(null)}
                                    className="admin-btn admin-btn-secondary"
                                    style={{ flex: 1, textAlign: 'center' }}
                                >
                                    Continuer l&apos;édition
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const target = unsavedConfirmModal;
                                        setUnsavedConfirmModal(null);
                                        if (target === 'add') {
                                            setIsAddingDoc(false);
                                            setAddImagesFr([]);
                                            setAddImagesEn([]);
                                            setAddFormState({ title: '', title_en: '', description: '', description_en: '' });
                                            docFormRef.current?.reset();
                                        } else if (target === 'edit') {
                                            setEditingDoc(null);
                                            setEditImagesFr([]);
                                            setEditImagesEn([]);
                                            setSelectedImagesFr([]);
                                            setSelectedImagesEn([]);
                                            setEditFormState({ title: '', title_en: '', description: '', description_en: '' });
                                        }
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

            {/* MODAL DE CONFIRMATION DE SUPPRESSION DE DOCUMENT */}
            {deleteModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 250,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem'
                }}>
                    <div className="admin-card anim-fade" style={{ maxWidth: '420px', width: '100%' }}>
                        <h3 style={{ fontSize: '1.15rem', color: 'var(--admin-text)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={20} style={{ color: '#C4593A' }} />
                            Confirmer la suppression
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                            Êtes-vous sûr(e) de vouloir supprimer définitivement le tarif <strong>&quot;{deleteModal.title}&quot;</strong> ? Toutes les images associées seront retirées.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button
                                type="button"
                                onClick={() => setDeleteModal(null)}
                                className="admin-btn admin-btn-secondary"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteDoc(deleteModal.id)}
                                disabled={isPending}
                                className="admin-btn admin-btn-danger"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                                {isPending ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

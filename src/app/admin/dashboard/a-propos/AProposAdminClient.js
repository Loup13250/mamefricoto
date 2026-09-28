'use client';

import { useState, useRef, useTransition } from 'react';
import { 
    updateAboutInfo, 
    addService, 
    editService, 
    deleteService, 
    reorderService 
} from '@/app/actions';
import { 
    Heart, 
    Sparkles, 
    Plus, 
    Trash2, 
    Edit3, 
    X, 
    CheckCircle2, 
    AlertCircle, 
    ArrowUp, 
    ArrowDown, 
    Loader2, 
    UploadCloud, 
    ExternalLink, 
    Languages, 
    Layers,
    Save
} from 'lucide-react';

/* Utilitaire de compression client-side */
async function compressImageFile(file, maxWidth = 1400, quality = 0.82) {
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

export default function AProposAdminClient({ info = {}, services = [] }) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Prestations state
    const [isAddingService, setIsAddingService] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [deleteModal, setDeleteModal] = useState(null); // { id, title }

    // About Photo state
    const [aboutPhotoPreview, setAboutPhotoPreview] = useState(info?.about_image || null);
    const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);

    const serviceFormRef = useRef(null);
    const storyFormRef = useRef(null);

    const showNotification = (msg, isErr = false) => {
        if (isErr) {
            setError(msg);
            setTimeout(() => setError(''), 4500);
        } else {
            setSuccess(msg);
            setTimeout(() => setSuccess(''), 3500);
        }
    };

    // Gestion du choix de la photo À Propos
    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const compressed = await compressImageFile(file);
        setSelectedPhotoFile(compressed);
        setAboutPhotoPreview(URL.createObjectURL(compressed));
    };

    // Soumission du formulaire Histoire & Photo
    const handleSaveAboutStory = (e) => {
        e.preventDefault();
        setError('');
        const form = e.target;
        const formData = new FormData();

        formData.append('about_text', form.about_text.value);
        formData.append('about_text_en', form.about_text_en?.value || '');
        formData.append('tagline', form.tagline?.value || '');
        formData.append('tagline_en', form.tagline_en?.value || '');

        if (selectedPhotoFile) {
            formData.append('about_file', selectedPhotoFile);
        }

        startTransition(async () => {
            const res = await updateAboutInfo(formData);
            if (res?.error) {
                showNotification(res.error, true);
            } else {
                showNotification('Présentation et photo "À Propos" enregistrées avec succès !');
                setSelectedPhotoFile(null);
            }
        });
    };

    // Prestations Handlers
    const handleAddService = (e) => {
        e.preventDefault();
        setError('');
        const formData = new FormData(e.target);
        startTransition(async () => {
            const res = await addService(formData);
            if (res?.error) {
                showNotification(res.error, true);
            } else {
                showNotification('Prestation traiteur ajoutée avec succès !');
                setIsAddingService(false);
                serviceFormRef.current?.reset();
            }
        });
    };

    const handleEditService = (e) => {
        e.preventDefault();
        setError('');
        const formData = new FormData(e.target);
        startTransition(async () => {
            const res = await editService(formData);
            if (res?.error) {
                showNotification(res.error, true);
            } else {
                showNotification('Prestation traiteur mise à jour !');
                setEditingService(null);
            }
        });
    };

    const handleDeleteService = (id) => {
        startTransition(async () => {
            const res = await deleteService(id);
            if (res?.error) {
                showNotification(res.error, true);
            } else {
                showNotification('Prestation supprimée.');
                setDeleteModal(null);
            }
        });
    };

    const handleReorderService = (id, direction) => {
        startTransition(async () => {
            await reorderService(id, direction);
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
                        Page À Propos
                    </span>
                    <h1 className="title-md" style={{ color: 'var(--admin-text)', marginBottom: '0.3rem' }}>
                        À Propos &amp; Prestations
                    </h1>
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.95rem' }}>
                        Gérez ici l&apos;histoire de Mamé Fricoto, la photo officielle et vos prestations traiteur.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <a
                        href="/a-propos"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-btn admin-btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                    >
                        <ExternalLink size={15} /> Voir la page /a-propos
                    </a>
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

            {/* SECTION 1: HISTOIRE & PHOTO OFFICIELLE */}
            <div className="admin-card" style={{ marginBottom: '2.5rem' }}>
                <div className="admin-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Heart size={20} style={{ color: 'var(--admin-gold)' }} />
                        Histoire &amp; Photo Officielle
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                        Section haute de la page /a-propos
                    </span>
                </div>

                <form ref={storyFormRef} onSubmit={handleSaveAboutStory} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                        {/* Colonne gauche : Textes FR / EN */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label className="admin-label" htmlFor="about_story_fr">
                                    Histoire &amp; Philosophie (Français) *
                                </label>
                                <textarea
                                    id="about_story_fr"
                                    name="about_text"
                                    rows={6}
                                    required
                                    defaultValue={info?.about_text || "Mamé Fricoto, c'est l'histoire d'une passionnée de cuisine qui a décidé de partager ses recettes maison avec vous.\n\nChaque plat est préparé dans notre labo à domicile à Eyguières, avec des ingrédients soigneusement sélectionnés auprès de producteurs locaux. Pas d'additifs, pas de raccourcis — juste de la vraie cuisine."}
                                    className="admin-textarea"
                                    placeholder="Racontez la passion de Mamé Fricoto..."
                                />
                            </div>

                            <div>
                                <label className="admin-label" htmlFor="about_story_en" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Languages size={14} style={{ color: 'var(--admin-gold)' }} /> Histoire en Anglais (Optionnel)
                                </label>
                                <textarea
                                    id="about_story_en"
                                    name="about_text_en"
                                    rows={5}
                                    defaultValue={info?.about_text_en || "Mamé Fricoto is the story of a passionate cook who decided to share her generous homemade recipes with you.\n\nEvery dish is prepared in our culinary workshop in Eyguières, using ingredients carefully sourced from local producers. No additives, no shortcuts — just genuine, heartfelt cuisine."}
                                    className="admin-textarea"
                                    placeholder="Story in English..."
                                />
                            </div>

                            {/* Tagline courte FR / EN */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="admin-label" htmlFor="tagline_fr">
                                        Accroche courte (FR)
                                    </label>
                                    <input
                                        id="tagline_fr"
                                        type="text"
                                        name="tagline"
                                        defaultValue={info?.tagline || 'Cuisine maison, généreuse et de saison'}
                                        className="admin-input"
                                    />
                                </div>
                                <div>
                                    <label className="admin-label" htmlFor="tagline_en" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <Languages size={14} style={{ color: 'var(--admin-gold)' }} /> Accroche (EN)
                                    </label>
                                    <input
                                        id="tagline_en"
                                        type="text"
                                        name="tagline_en"
                                        defaultValue={info?.tagline_en || 'Generous homemade seasonal cuisine'}
                                        className="admin-input"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Colonne droite : Photo officielle À Propos */}
                        <div>
                            <label className="admin-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                Photo officielle d&apos;illustration (Portrait ou cuisine)
                            </label>
                            <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginBottom: '0.75rem' }}>
                                Cette photo apparaît à droite de votre histoire sur la page /a-propos.
                            </p>

                            <div style={{
                                width: '100%',
                                maxHeight: '340px',
                                height: '280px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: '1px solid var(--admin-border)',
                                position: 'relative',
                                background: 'rgba(0,0,0,0.1)',
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {aboutPhotoPreview ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={aboutPhotoPreview}
                                        alt="Aperçu photo À Propos"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Aucune photo sélectionnée</span>
                                )}
                            </div>

                            <label className="admin-dropzone" style={{ cursor: 'pointer', display: 'block', textAlign: 'center', padding: '1rem', border: '2px dashed var(--admin-border)', borderRadius: '8px' }}>
                                <UploadCloud size={24} style={{ color: 'var(--admin-gold)', margin: '0 auto 0.25rem' }} />
                                <span style={{ fontSize: '0.85rem', color: 'var(--admin-text)', fontWeight: '500', display: 'block' }}>
                                    {selectedPhotoFile ? selectedPhotoFile.name : 'Changer la photo À Propos'}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>JPG, PNG ou WebP (compression auto)</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handlePhotoChange}
                                />
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--admin-border)' }}>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="admin-btn admin-btn-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '12px 24px' }}
                        >
                            {isPending ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                            Enregistrer l&apos;Histoire et la Photo
                        </button>
                    </div>
                </form>
            </div>

            {/* SECTION 2: NOS PRESTATIONS TRAITEUR */}
            <div className="admin-card">
                <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Layers size={20} style={{ color: 'var(--admin-gold)' }} />
                            Nos Prestations Traiteur
                        </h2>
                        <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                            Cartes présentées dans la section &quot;Nos Prestations&quot; sur la page /a-propos
                        </span>
                    </div>

                    {!isAddingService && (
                        <button
                            type="button"
                            onClick={() => setIsAddingService(true)}
                            className="admin-btn admin-btn-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                        >
                            <Plus size={16} /> Ajouter une Prestation
                        </button>
                    )}
                </div>

                {/* FORMULAIRE: NOUVELLE PRESTATION */}
                {isAddingService && (
                    <div style={{
                        background: 'var(--admin-surface)',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(200, 169, 110, 0.4)',
                        marginBottom: '2rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontSize: '1.05rem', color: 'var(--admin-text)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Plus size={16} style={{ color: 'var(--admin-gold)' }} />
                                Nouvelle Prestation
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsAddingService(false)}
                                className="admin-btn admin-btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                            >
                                <X size={14} /> Annuler
                            </button>
                        </div>

                        <form ref={serviceFormRef} onSubmit={handleAddService} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="admin-label" htmlFor="srv_num">Numéro</label>
                                    <input id="srv_num" type="text" name="num" placeholder="01" defaultValue={`0${services.length + 1}`} className="admin-input" />
                                </div>
                                <div>
                                    <label className="admin-label" htmlFor="srv_badge_fr">Badge (FR)</label>
                                    <input id="srv_badge_fr" type="text" name="badge" placeholder="Ex: Sur Mesure" className="admin-input" />
                                </div>
                                <div>
                                    <label className="admin-label" htmlFor="srv_badge_en">Badge (EN)</label>
                                    <input id="srv_badge_en" type="text" name="badge_en" placeholder="Ex: Tailored" className="admin-input" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="admin-label" htmlFor="srv_title_fr">Titre de la prestation (FR) *</label>
                                    <input id="srv_title_fr" type="text" name="title" required placeholder="Ex: Buffets & Cocktails" className="admin-input" />
                                </div>
                                <div>
                                    <label className="admin-label" htmlFor="srv_title_en">Titre (EN)</label>
                                    <input id="srv_title_en" type="text" name="title_en" placeholder="Ex: Buffets & Cocktails" className="admin-input" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="admin-label" htmlFor="srv_desc_fr">Description détaillée (FR) *</label>
                                    <textarea id="srv_desc_fr" name="description" rows={3} required placeholder="Pièces salées, verrines fraîches, canapés et douceurs..." className="admin-textarea" />
                                </div>
                                <div>
                                    <label className="admin-label" htmlFor="srv_desc_en">Description (EN)</label>
                                    <textarea id="srv_desc_en" name="description_en" rows={3} placeholder="Savory bites, fresh verrines, appetizers and sweet treats..." className="admin-textarea" />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setIsAddingService(false)} className="admin-btn admin-btn-secondary">
                                    Annuler
                                </button>
                                <button type="submit" disabled={isPending} className="admin-btn admin-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                    {isPending ? <Loader2 size={15} className="spin" /> : <Plus size={15} />}
                                    Ajouter la prestation
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* MODAL: MODIFIER UNE PRESTATION */}
                {editingService && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 220,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem'
                    }}>
                        <div className="admin-card anim-fade" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.15rem', color: 'var(--admin-text)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Edit3 size={18} style={{ color: 'var(--admin-gold)' }} />
                                    Modifier la prestation
                                </h3>
                                <button type="button" onClick={() => setEditingService(null)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleEditService} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <input type="hidden" name="id" value={editingService.id} />

                                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label className="admin-label" htmlFor="edit_srv_num">Numéro</label>
                                        <input id="edit_srv_num" type="text" name="num" defaultValue={editingService.num || '01'} className="admin-input" />
                                    </div>
                                    <div>
                                        <label className="admin-label" htmlFor="edit_srv_badge_fr">Badge (FR)</label>
                                        <input id="edit_srv_badge_fr" type="text" name="badge" defaultValue={editingService.badge || ''} className="admin-input" />
                                    </div>
                                    <div>
                                        <label className="admin-label" htmlFor="edit_srv_badge_en">Badge (EN)</label>
                                        <input id="edit_srv_badge_en" type="text" name="badge_en" defaultValue={editingService.badge_en || ''} className="admin-input" />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label className="admin-label" htmlFor="edit_srv_title_fr">Titre (FR) *</label>
                                        <input id="edit_srv_title_fr" type="text" name="title" required defaultValue={editingService.title} className="admin-input" />
                                    </div>
                                    <div>
                                        <label className="admin-label" htmlFor="edit_srv_title_en">Titre (EN)</label>
                                        <input id="edit_srv_title_en" type="text" name="title_en" defaultValue={editingService.title_en || ''} className="admin-input" />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label className="admin-label" htmlFor="edit_srv_desc_fr">Description (FR) *</label>
                                        <textarea id="edit_srv_desc_fr" name="description" rows={3} required defaultValue={editingService.description} className="admin-textarea" />
                                    </div>
                                    <div>
                                        <label className="admin-label" htmlFor="edit_srv_desc_en">Description (EN)</label>
                                        <textarea id="edit_srv_desc_en" name="description_en" rows={3} defaultValue={editingService.description_en || ''} className="admin-textarea" />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                                    <button type="button" onClick={() => setEditingService(null)} className="admin-btn admin-btn-secondary">
                                        Annuler
                                    </button>
                                    <button type="submit" disabled={isPending} className="admin-btn admin-btn-primary">
                                        {isPending ? <Loader2 size={15} className="spin" /> : <CheckCircle2 size={15} />}
                                        Enregistrer
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* LISTE DES PRESTATIONS */}
                {services.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                        <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem' }}>
                            Aucune prestation enregistrée pour l&apos;instant.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {services.map((srv, idx) => (
                            <div
                                key={srv.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '1rem 1.25rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--admin-border)',
                                    background: 'var(--admin-surface)',
                                    gap: '1rem',
                                    flexWrap: 'wrap'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '260px' }}>
                                    {/* Reorder arrows */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleReorderService(srv.id, 'up')}
                                            disabled={idx === 0 || isPending}
                                            aria-label="Monter"
                                            style={{
                                                background: 'none',
                                                border: '1px solid var(--admin-border)',
                                                borderRadius: '3px',
                                                padding: '2px',
                                                cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                                color: idx === 0 ? 'var(--admin-border)' : 'var(--admin-text)',
                                                opacity: idx === 0 ? 0.4 : 1,
                                            }}
                                        >
                                            <ArrowUp size={13} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleReorderService(srv.id, 'down')}
                                            disabled={idx === services.length - 1 || isPending}
                                            aria-label="Descendre"
                                            style={{
                                                background: 'none',
                                                border: '1px solid var(--admin-border)',
                                                borderRadius: '3px',
                                                padding: '2px',
                                                cursor: idx === services.length - 1 ? 'not-allowed' : 'pointer',
                                                color: idx === services.length - 1 ? 'var(--admin-border)' : 'var(--admin-text)',
                                                opacity: idx === services.length - 1 ? 0.4 : 1,
                                            }}
                                        >
                                            <ArrowDown size={13} />
                                        </button>
                                    </div>

                                    {/* Number pill */}
                                    <span style={{
                                        fontSize: '1rem',
                                        fontWeight: '700',
                                        fontFamily: 'var(--font-heading)',
                                        color: 'var(--admin-gold)',
                                        background: 'rgba(200, 169, 110, 0.1)',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        minWidth: '38px',
                                        textAlign: 'center'
                                    }}>
                                        {srv.num || `0${idx + 1}`}
                                    </span>

                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                            <strong style={{ fontSize: '0.98rem', color: 'var(--admin-text)' }}>{srv.title}</strong>
                                            {srv.badge && (
                                                <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(200, 169, 110, 0.15)', color: 'var(--admin-gold)', fontWeight: '600' }}>
                                                    {srv.badge}
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', margin: 0, maxWidth: '600px' }}>
                                            {srv.description}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setEditingService(srv)}
                                        className="admin-btn admin-btn-secondary"
                                        style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                                    >
                                        <Edit3 size={14} /> Modifier
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeleteModal({ id: srv.id, title: srv.title })}
                                        className="admin-btn admin-btn-danger"
                                        aria-label="Supprimer cette prestation"
                                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* CONFIRMATION SUPPRESSION PRESTATION */}
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
                    <div className="admin-card anim-fade" style={{ maxWidth: '400px', width: '100%' }}>
                        <h3 style={{ fontSize: '1.15rem', color: 'var(--admin-text)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={20} style={{ color: '#C4593A' }} />
                            Supprimer la prestation
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                            Êtes-vous sûr(e) de vouloir supprimer <strong>&quot;{deleteModal.title}&quot;</strong> ?
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
                                onClick={() => handleDeleteService(deleteModal.id)}
                                disabled={isPending}
                                className="admin-btn admin-btn-danger"
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

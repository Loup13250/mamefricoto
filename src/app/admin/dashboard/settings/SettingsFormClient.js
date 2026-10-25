'use client';
import { useState, useRef, useTransition } from 'react';
import Image from 'next/image';
import { updateSiteInfo, updateSiteLogo, updateSiteIcon, restoreDatabaseFromBackup } from '@/app/actions';
import ImageCropperModal, { LOGO_CROP_TARGETS, FAVICON_CROP_TARGETS } from '@/components/admin/ImageCropper';
import {
    Save, Image as ImageIcon, Mail, Phone, Globe,
    UploadCloud, CheckCircle2, Download, ShieldCheck,
    AlertCircle, Loader2, Crop, RefreshCw, X
} from 'lucide-react';

export default function SettingsFormClient({ info }) {
    // --- Logo Principal (Barre de navigation) ---
    const initialLogo = info?.logo || info?.site_icon || '/icon.svg';
    const [logoPreview, setLogoPreview] = useState(initialLogo);
    const [logoFile, setLogoFile] = useState(null);
    const [logoDragging, setLogoDragging] = useState(false);
    const [logoSaving, setLogoSaving] = useState(false);
    const [logoSaved, setLogoSaved] = useState(false);

    // --- Favicon / Icône Onglet Navigateur ---
    const initialSiteIcon = info?.site_icon || info?.logo || '/icon.svg';
    const [siteIconPreview, setSiteIconPreview] = useState(initialSiteIcon);
    const [siteIconFile, setSiteIconFile] = useState(null);
    const [siteIconDragging, setSiteIconDragging] = useState(false);
    const [siteIconSaving, setSiteIconSaving] = useState(false);
    const [siteIconSaved, setSiteIconSaved] = useState(false);

    // --- Modal de recadrage ---
    const [cropper, setCropper] = useState(null); // { file, type: 'logo'|'favicon', targets, title }

    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const [isRestoring, startRestoreTransition] = useTransition();
    const [restoreStatus, setRestoreStatus] = useState({ error: '', success: '' });
    const restoreInputRef = useRef(null);

    const logoInputRef = useRef(null);
    const siteIconInputRef = useRef(null);

    // Sélection d'un fichier logo -> ouvre directement l'outil de recadrage
    const handleLogoFileSelect = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/') && !file.name.endsWith('.svg') && !file.type.includes('svg')) return;

        // Si c'est un SVG vectoriel, on l'utilise directement sans recadrage matriciel
        if (file.name.endsWith('.svg') || file.type.includes('svg')) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
            return;
        }

        setCropper({
            file,
            type: 'logo',
            targets: LOGO_CROP_TARGETS,
            title: 'Recadrer le logo principal pour la barre de navigation',
        });
    };

    // Sélection d'un fichier favicon -> ouvre directement l'outil de recadrage
    const handleSiteIconFileSelect = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/') && !file.name.endsWith('.svg') && !file.type.includes('svg')) return;

        if (file.name.endsWith('.svg') || file.type.includes('svg')) {
            setSiteIconFile(file);
            setSiteIconPreview(URL.createObjectURL(file));
            return;
        }

        setCropper({
            file,
            type: 'favicon',
            targets: FAVICON_CROP_TARGETS,
            title: "Recadrer l'icône d'onglet navigateur (Favicon 1:1)",
        });
    };

    // Callback validation du recadrage
    const handleCropped = (results) => {
        if (!cropper || !results || results.length === 0) {
            setCropper(null);
            return;
        }
        const croppedFile = results[0].outputs?.[cropper.type === 'logo' ? 'logo' : 'favicon'] || results[0].file;
        if (croppedFile) {
            if (cropper.type === 'logo') {
                setLogoFile(croppedFile);
                setLogoPreview(URL.createObjectURL(croppedFile));
            } else {
                setSiteIconFile(croppedFile);
                setSiteIconPreview(URL.createObjectURL(croppedFile));
            }
        }
        setCropper(null);
    };

    // Sauvegarde immédiate du logo seul
    const handleQuickSaveLogo = async () => {
        if (!logoFile) return;
        setLogoSaving(true);
        const fd = new FormData();
        fd.append('logo_file', logoFile);
        const res = await updateSiteLogo(fd);
        setLogoSaving(false);
        if (res?.success) {
            setLogoSaved(true);
            setTimeout(() => setLogoSaved(false), 3000);
        }
    };

    // Sauvegarde immédiate du favicon seul
    const handleQuickSaveIcon = async () => {
        if (!siteIconFile) return;
        setSiteIconSaving(true);
        const fd = new FormData();
        fd.append('site_icon_file', siteIconFile);
        const res = await updateSiteIcon(fd);
        setSiteIconSaving(false);
        if (res?.success) {
            setSiteIconSaved(true);
            setTimeout(() => setSiteIconSaved(false), 3000);
        }
    };

    // Soumission globale du formulaire
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSaved(false);

        const formData = new FormData(e.target);

        formData.delete('logo_file');
        formData.delete('site_icon_file');

        if (logoFile) {
            formData.append('logo_file', logoFile);
        }
        if (siteIconFile) {
            formData.append('site_icon_file', siteIconFile);
        }

        await updateSiteInfo(formData);
        setLoading(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleRestoreFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm('Attention : La restauration va remplacer les données actuelles par celles de la sauvegarde. Veux-tu continuer ?')) {
            e.target.value = '';
            return;
        }

        const formData = new FormData();
        formData.append('backup_file', file);

        setRestoreStatus({ error: '', success: '' });
        startRestoreTransition(async () => {
            const res = await restoreDatabaseFromBackup(formData);
            if (res?.error) {
                setRestoreStatus({ error: res.error, success: '' });
            } else {
                setRestoreStatus({ error: '', success: 'Base de données restaurée avec succès ! Le site a été mis à jour.' });
                setTimeout(() => window.location.reload(), 1500);
            }
            e.target.value = '';
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>


                {saved && (
                    <div style={{
                        padding: '1rem', background: 'rgba(34,197,94,0.12)',
                        border: '1px solid rgba(34,197,94,0.3)', borderRadius: '6px',
                        color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        fontSize: '0.9rem', fontWeight: '600'
                    }}>
                        <CheckCircle2 size={18} /> Modifications enregistrées avec succès !
                    </div>
                )}

                {/* =====================================================
                   1. LOGO PRINCIPAL DU SITE (Barre de navigation)
                   ===================================================== */}
                <div style={{ borderBottom: '1px solid var(--admin-border-soft)', paddingBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <ImageIcon size={19} style={{ color: 'var(--admin-gold)' }} />
                            1. Logo Principal du Site (Barre de navigation)
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--admin-gold)', background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.3)', padding: '3px 9px', borderRadius: '4px', fontWeight: '600' }}>
                            Affichage En-tête &amp; Navigation
                        </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                        Le logo officiel qui apparaît en haut de toutes les pages du site. Tu peux le recadrer à tout moment pour qu&apos;il s&apos;adapte parfaitement sans déformation ni rond disgracieux.
                    </p>

                    <div style={{
                        background: 'var(--admin-surface)',
                        border: '1px solid var(--admin-border)',
                        borderRadius: '8px',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        {/* Simulateur barre de navigation */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Aperçu en conditions réelles (sur la barre de navigation claire du site) :
                                </span>
                                <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: '600', background: 'rgba(22, 163, 74, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                    ✓ Badge bleu officiel
                                </span>
                            </div>
                            <div style={{
                                background: '#FAF6F0',
                                border: '1px solid rgba(194, 87, 45, 0.22)',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                boxShadow: '0 4px 20px rgba(42, 30, 23, 0.08)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', minHeight: '56px' }}>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '54px',
                                        height: '54px',
                                        borderRadius: '50%',
                                        aspectRatio: '1 / 1',
                                        background: 'linear-gradient(135deg, #3A669A 0%, #315B8C 50%, #244872 100%)',
                                        border: '2px solid rgba(234, 166, 32, 0.7)',
                                        boxShadow: '0 4px 14px rgba(36, 72, 114, 0.28)',
                                        padding: '3px',
                                        overflow: 'hidden',
                                        flexShrink: 0
                                    }}>
                                        <Image
                                            src={logoPreview}
                                            alt="Logo Mamé Fricoto"
                                            width={54}
                                            height={54}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain',
                                                borderRadius: '50%',
                                                display: 'block',
                                                filter: 'drop-shadow(0 2px 4px rgba(20, 38, 61, 0.35))'
                                            }}
                                            unoptimized
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1.25rem', color: '#2A1E17', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    <span style={{ color: '#C2572D' }}>Accueil</span>
                                    <span>Tarifs</span>
                                    <span>Galerie</span>
                                    <span>À Propos</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions Logo */}
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', paddingTop: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={() => logoInputRef.current?.click()}
                                className="admin-btn admin-btn-secondary"
                                style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                            >
                                <UploadCloud size={15} /> Choisir &amp; Recadrer une nouvelle image
                            </button>

                            {logoPreview && !logoPreview.endsWith('.svg') && (
                                <button
                                    type="button"
                                    onClick={() => setCropper({
                                        url: logoPreview,
                                        type: 'logo',
                                        targets: LOGO_CROP_TARGETS,
                                        title: 'Recadrer le logo de navigation',
                                    })}
                                    className="admin-btn admin-btn-secondary"
                                    style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                                >
                                    <Crop size={15} /> Ajuster le recadrage du logo
                                </button>
                            )}

                            {logoFile && (
                                <button
                                    type="button"
                                    onClick={handleQuickSaveLogo}
                                    disabled={logoSaving}
                                    className="admin-btn admin-btn-primary"
                                    style={{ fontSize: '0.82rem', padding: '8px 18px', background: '#059669', borderColor: '#059669' }}
                                >
                                    {logoSaving ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
                                    Publier ce logo immédiatement
                                </button>
                            )}

                            {logoSaved && (
                                <span style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckCircle2 size={16} /> Logo mis à jour sur la barre de nav !
                                </span>
                            )}
                        </div>

                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg"
                            style={{ display: 'none' }}
                            onChange={(e) => handleLogoFileSelect(e.target.files?.[0])}
                        />
                    </div>
                </div>


                {/* =====================================================
                   2. PETIT LOGO / FAVICON / ICÔNE DU NAVIGATEUR
                   ===================================================== */}
                <div style={{ borderBottom: '1px solid var(--admin-border-soft)', paddingBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <Globe size={19} style={{ color: '#3B82F6' }} />
                            2. Petit Logo du Navigateur (Favicon &amp; Onglet)
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: '#2563EB', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)', padding: '3px 9px', borderRadius: '4px', fontWeight: '600' }}>
                            Affichage Onglet Web &amp; Favoris
                        </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                        La petite icône carrée qui s&apos;affiche à côté du titre sur l&apos;onglet du navigateur web (Chrome, Safari, Firefox) et dans les favoris des visiteurs.
                    </p>

                    <div style={{
                        background: 'var(--admin-surface)',
                        border: '1px solid var(--admin-border)',
                        borderRadius: '8px',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        {/* Simulateur onglet de navigateur */}
                        <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--admin-text-subtle)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Aperçu réel dans l&apos;onglet du navigateur web :
                            </span>
                            <div style={{
                                background: '#EAE5DC',
                                border: '1px solid rgba(42, 35, 29, 0.18)',
                                borderRadius: '8px 8px 0 0',
                                padding: '8px 12px 0 12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                maxWidth: '380px'
                            }}>
                                <div style={{
                                    background: '#FFFFFF',
                                    borderRadius: '8px 8px 0 0',
                                    padding: '8px 14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: '#2A231D',
                                    fontSize: '0.82rem',
                                    borderTop: '2px solid #C2572D',
                                    boxShadow: '0 -2px 6px rgba(42, 35, 29, 0.05)'
                                }}>
                                    <div style={{
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #3A669A 0%, #315B8C 50%, #244872 100%)',
                                        border: '1px solid rgba(234, 166, 32, 0.7)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                                        flexShrink: 0
                                    }}>
                                        <Image
                                            src={siteIconPreview}
                                            alt="Favicon"
                                            width={18}
                                            height={18}
                                            style={{ width: '15px', height: '15px', objectFit: 'contain' }}
                                            unoptimized
                                        />
                                    </div>
                                    <span style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                                        Mamé Fricoto | Traiteur &amp; Cuisine...
                                    </span>
                                    <X size={12} style={{ color: '#8A7E71', marginLeft: '6px' }} />
                                </div>
                            </div>
                        </div>

                        {/* Aperçu grand format en médaillon rond officiel */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.25rem',
                            padding: '0.9rem 1.1rem',
                            background: '#FFFFFF',
                            borderRadius: '8px',
                            border: '1px solid var(--admin-border-soft)'
                        }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #3A669A 0%, #315B8C 50%, #244872 100%)',
                                border: '2.5px solid #EAA620',
                                boxShadow: '0 4px 16px rgba(36, 72, 114, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                flexShrink: 0
                            }}>
                                <Image
                                    src={siteIconPreview}
                                    alt="Favicon Médaillon"
                                    width={48}
                                    height={48}
                                    style={{ width: '44px', height: '44px', objectFit: 'contain' }}
                                    unoptimized
                                />
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', lineHeight: '1.5' }}>
                                <strong style={{ color: 'var(--admin-text)', display: 'block', marginBottom: '2px', fontSize: '0.88rem' }}>
                                    Médaillon circulaire officiel (Fond bleu &amp; liseré doré)
                                </strong>
                                C&apos;est la forme bleue officielle tout en haut du site : même si ton image d&apos;origine a un fond transparent, ce médaillon rond bleu et or assure que le logo et les textes clairs soient parfaitement visibles dans l&apos;onglet de chaque visiteur.
                            </div>
                        </div>

                        {/* Actions Favicon */}
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', paddingTop: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={() => siteIconInputRef.current?.click()}
                                className="admin-btn admin-btn-secondary"
                                style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                            >
                                <UploadCloud size={15} /> Choisir &amp; Recadrer le favicon (1:1)
                            </button>

                            {siteIconPreview && !siteIconPreview.endsWith('.svg') && (
                                <button
                                    type="button"
                                    onClick={() => setCropper({
                                        url: siteIconPreview,
                                        type: 'favicon',
                                        targets: FAVICON_CROP_TARGETS,
                                        title: "Recadrer l'icône favicon (carré 1:1)",
                                    })}
                                    className="admin-btn admin-btn-secondary"
                                    style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                                >
                                    <Crop size={15} /> Ajuster le recadrage carré
                                </button>
                            )}

                            {siteIconFile && (
                                <button
                                    type="button"
                                    onClick={handleQuickSaveIcon}
                                    disabled={siteIconSaving}
                                    className="admin-btn admin-btn-primary"
                                    style={{ fontSize: '0.82rem', padding: '8px 18px', background: '#059669', borderColor: '#059669' }}
                                >
                                    {siteIconSaving ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
                                    Publier le favicon immédiatement
                                </button>
                            )}

                            {siteIconSaved && (
                                <span style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckCircle2 size={16} /> Favicon mis à jour avec succès !
                                </span>
                            )}
                        </div>

                        <input
                            ref={siteIconInputRef}
                            type="file"
                            accept="image/png,image/webp,image/svg+xml,.svg,image/x-icon,image/vnd.microsoft.icon"
                            style={{ display: 'none' }}
                            onChange={(e) => handleSiteIconFileSelect(e.target.files?.[0])}
                        />
                    </div>
                </div>


                {/* Slogan & Accroches */}
                <div style={{ borderBottom: '1px solid var(--admin-border-soft)', paddingBottom: '1.75rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--admin-text)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Globe size={18} style={{ color: 'var(--admin-gold)' }} /> Slogan / Accroche (Bilingue)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        <div>
                            <label className="admin-label">
                                FR - Slogan en Français
                            </label>
                            <input
                                type="text"
                                name="tagline"
                                defaultValue={info.tagline || ''}
                                placeholder="Ex: Cuisine maison · Livraison · Retrait"
                                className="admin-input"
                            />
                        </div>
                        <div>
                            <label className="admin-label">
                                EN - Slogan en Anglais
                            </label>
                            <input
                                type="text"
                                name="tagline_en"
                                defaultValue={info.tagline_en || ''}
                                placeholder="Ex: Homemade cuisine · Delivery · Pick-up"
                                className="admin-input"
                            />
                        </div>
                    </div>
                </div>

                {/* Coordonnées & Horaires */}
                <div style={{ borderBottom: '1px solid var(--admin-border-soft)', paddingBottom: '1.75rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--admin-text)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={18} style={{ color: 'var(--admin-gold)' }} /> Coordonnées &amp; Horaires
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        <div>
                            <label className="admin-label">Téléphone</label>
                            <input
                                type="text"
                                name="phone"
                                defaultValue={info.phone || ''}
                                placeholder="07 43 64 64 11"
                                className="admin-input"
                            />
                        </div>
                        <div>
                            <label className="admin-label">Email de contact public</label>
                            <input
                                type="email"
                                name="contact_email"
                                defaultValue={info.contact_email || ''}
                                placeholder="mamefricoto@gmail.com"
                                className="admin-input"
                            />
                        </div>
                        <div>
                            <label className="admin-label">FR - Adresse</label>
                            <input
                                type="text"
                                name="address"
                                defaultValue={info.address || ''}
                                placeholder="Eyguières, Bouches-du-Rhône"
                                className="admin-input"
                            />
                        </div>
                        <div>
                            <label className="admin-label">EN - Adresse</label>
                            <input
                                type="text"
                                name="address_en"
                                defaultValue={info.address_en || ''}
                                placeholder="Eyguières, Bouches-du-Rhône, France"
                                className="admin-input"
                            />
                        </div>
                        <div>
                            <label className="admin-label">FR - Horaires / Commandes</label>
                            <input
                                type="text"
                                name="hours"
                                defaultValue={info.hours || ''}
                                placeholder="Du Lundi au Vendredi - Commandes avant 10h"
                                className="admin-input"
                            />
                        </div>
                        <div>
                            <label className="admin-label">EN - Horaires / Commandes</label>
                            <input
                                type="text"
                                name="hours_en"
                                defaultValue={info.hours_en || ''}
                                placeholder="Monday to Friday - Orders before 10 AM"
                                className="admin-input"
                            />
                        </div>
                    </div>
                </div>

                {/* Réseaux Sociaux & Avis */}
                <div style={{ borderBottom: '1px solid var(--admin-border-soft)', paddingBottom: '1.75rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--admin-text)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Globe size={18} style={{ color: 'var(--admin-gold)' }} /> Réseaux Sociaux &amp; Avis Google
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        <div>
                            <label className="admin-label">Lien Instagram</label>
                            <input
                                type="url"
                                name="instagram"
                                defaultValue={info.instagram || ''}
                                placeholder="https://www.instagram.com/mamefricoto/"
                                className="admin-input"
                            />
                        </div>
                        <div>
                            <label className="admin-label">Lien Facebook</label>
                            <input
                                type="url"
                                name="facebook"
                                defaultValue={info.facebook || ''}
                                placeholder="https://www.facebook.com/profile.php?id=..."
                                className="admin-input"
                            />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="admin-label">Lien vers les Avis Google</label>
                            <input
                                type="url"
                                name="google_reviews"
                                defaultValue={info.google_reviews || ''}
                                placeholder="https://www.google.com/search?q=..."
                                className="admin-input"
                            />
                        </div>
                    </div>
                </div>

                {/* Notifications & Envoi Email */}
                <div style={{ borderBottom: '1px solid var(--admin-border-soft)', paddingBottom: '1.75rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--admin-text)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={18} style={{ color: 'var(--admin-gold)' }} /> Réception des Messages Contact
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        <div>
                            <label className="admin-label">Email où recevoir les devis</label>
                            <input
                                type="email"
                                name="notification_email"
                                defaultValue={info.notification_email || info.contact_email || ''}
                                placeholder="mamefricoto@gmail.com"
                                className="admin-input"
                            />
                        </div>
                        <div>
                            <label className="admin-label">Ou Endpoint Formspree (Optionnel)</label>
                            <input
                                type="url"
                                name="formspree_url"
                                defaultValue={info.formspree_url || ''}
                                placeholder="https://formspree.io/f/..."
                                className="admin-input"
                            />
                        </div>
                    </div>
                </div>

                <div style={{ paddingTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                    <button type="submit" className="admin-btn admin-btn-primary" disabled={loading} style={{ padding: '14px 40px', fontSize: '0.95rem' }}>
                        <Save size={18} /> {loading ? 'Sauvegarde en cours...' : 'Sauvegarder toutes les modifications'}
                    </button>
                </div>
            </form>

            {/* Modal de recadrage du logo ou du favicon */}
            {cropper && (
                <ImageCropperModal
                    items={[{ id: 'crop-target', file: cropper.file, url: cropper.url }]}
                    targets={cropper.targets}
                    heroPreview={false}
                    title={cropper.title}
                    confirmLabel="Valider le cadrage"
                    onCancel={() => setCropper(null)}
                    onConfirm={handleCropped}
                />
            )}

            {/* =====================================================
               SAUVEGARDE & RESTAURATION BASE DE DONNÉES
               ===================================================== */}
            <div style={{
                marginTop: '1.5rem',
                padding: '1.75rem',
                background: 'var(--admin-surface)',
                border: '1px solid var(--admin-border)',
                borderRadius: '8px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                    <ShieldCheck size={22} style={{ color: 'var(--admin-gold)' }} />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--admin-text)', margin: 0 }}>
                        Sauvegarde &amp; Sécurité de la Base de Données
                    </h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                    Télécharge un fichier de sauvegarde complet (menus, prestations, galerie, messages et paramètres). Ce fichier est ultra-léger (~100 Ko). Tu peux également restaurer une sauvegarde précédente en 1 clic.
                </p>

                {restoreStatus.success && (
                    <div style={{ padding: '0.9rem', marginBottom: '1rem', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '6px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                        <CheckCircle2 size={16} /> {restoreStatus.success}
                    </div>
                )}
                {restoreStatus.error && (
                    <div style={{ padding: '0.9rem', marginBottom: '1rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                        <AlertCircle size={16} /> {restoreStatus.error}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <a
                        href="/api/admin/backup"
                        download
                        className="admin-btn admin-btn-primary"
                        style={{ padding: '10px 20px', fontSize: '0.85rem', textDecoration: 'none' }}
                    >
                        <Download size={16} /> Télécharger une sauvegarde (JSON)
                    </a>

                    <button
                        type="button"
                        onClick={() => restoreInputRef.current?.click()}
                        className="admin-btn admin-btn-secondary"
                        disabled={isRestoring}
                        style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                    >
                        {isRestoring ? <Loader2 size={16} className="spin" /> : <UploadCloud size={16} />}
                        Restaurer une sauvegarde
                    </button>
                    <input
                        ref={restoreInputRef}
                        type="file"
                        accept=".json,application/json"
                        style={{ display: 'none' }}
                        onChange={handleRestoreFile}
                    />
                </div>
            </div>
        </div>
    );
}

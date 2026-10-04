'use client';
import { useState, useRef, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { updateSiteInfo, restoreDatabaseFromBackup } from '@/app/actions';
import {
    Save, Image as ImageIcon, Mail, Phone, Globe,
    UploadCloud, CheckCircle2, Download, ShieldCheck,
    AlertCircle, Loader2, Sparkles, Heart
} from 'lucide-react';


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

export default function SettingsFormClient({ info }) {
    const initialLogo = info.site_icon || info.logo || '/icon.svg';
    const [logoPreview, setLogoPreview] = useState(initialLogo);
    const [logoFile, setLogoFile] = useState(null);
    const [logoDragging, setLogoDragging] = useState(false);

    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const [isRestoring, startRestoreTransition] = useTransition();
    const [restoreStatus, setRestoreStatus] = useState({ error: '', success: '' });
    const restoreInputRef = useRef(null);

    const logoInputRef = useRef(null);

    const handleLogoSelect = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/') && !file.name.endsWith('.svg') && !file.type.includes('svg')) return;
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSaved(false);

        const formData = new FormData(e.target);

        formData.delete('logo_file');
        formData.delete('site_icon_file');

        if (logoFile) {
            const isSvg = logoFile.name.endsWith('.svg') || logoFile.type.includes('svg');
            const fileToUpload = isSvg ? logoFile : await compressImageFile(logoFile, 1024, 0.9);
            formData.append('logo_file', fileToUpload);
            formData.append('site_icon_file', fileToUpload);
        }

        await updateSiteInfo(formData);
        setLoading(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleRestoreFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm('Attention : La restauration va remplacer les données actuelles par celles de la sauvegarde. Voulez-vous continuer ?')) {
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
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

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

                {/* Visuels du site */}
                <div style={{ borderBottom: '1px solid var(--admin-border-soft)', paddingBottom: '1.75rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--admin-text)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ImageIcon size={18} style={{ color: 'var(--admin-gold)' }} /> Logo &amp; Icône Officielle
                    </h3>

                    <div style={{ maxWidth: '460px' }}>
                        <label className="admin-label" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>Logo &amp; Icône du site</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--admin-gold)', fontWeight: '600' }}>En-tête, favicon &amp; onglet</span>
                        </label>
                        {logoPreview ? (
                            <div style={{
                                position: 'relative',
                                background: 'var(--admin-surface)',
                                border: '1px solid var(--admin-border)',
                                borderRadius: '6px',
                                padding: '1.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.85rem',
                            }}>
                                <div style={{
                                    height: '76px', width: '76px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: '#FAF7F2', borderRadius: '50%',
                                    border: '1px solid #E8DFD3', padding: '10px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }}>
                                    <Image
                                        src={logoPreview}
                                        alt="Logo et icône du site"
                                        width={56}
                                        height={56}
                                        style={{ width: '56px', height: '56px', objectFit: 'contain' }}
                                        unoptimized
                                    />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-subtle)', display: 'block', marginBottom: '0.5rem' }}>
                                        Utilisé pour le logo du menu, l&apos;icône d&apos;onglet et le favicon.
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => logoInputRef.current?.click()}
                                        className="admin-btn admin-btn-secondary"
                                        style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                                    >
                                        Changer le logo / icône
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onDragOver={(e) => { e.preventDefault(); setLogoDragging(true); }}
                                onDragLeave={() => setLogoDragging(false)}
                                onDrop={(e) => { e.preventDefault(); setLogoDragging(false); handleLogoSelect(e.dataTransfer.files?.[0]); }}
                                onClick={() => logoInputRef.current?.click()}
                                style={{
                                    border: `2px dashed ${logoDragging ? 'var(--admin-gold)' : 'var(--admin-border)'}`,
                                    background: logoDragging ? 'rgba(200,169,110,0.08)' : 'var(--admin-surface)',
                                    borderRadius: '6px', padding: '1.75rem 1rem', textAlign: 'center', cursor: 'pointer'
                                }}
                            >
                                <UploadCloud size={28} style={{ color: 'var(--admin-gold)', marginBottom: '0.5rem' }} />
                                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--admin-text)', fontWeight: '600' }}>Cliquer pour ajouter le logo / icône</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-subtle)' }}>Fichier SVG (recommandé), PNG ou WEBP</span>
                            </div>
                        )}
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept=".svg,image/svg+xml,image/png,image/webp,image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handleLogoSelect(e.target.files?.[0])}
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
                                placeholder="Ex: Cuisine Traiteur Événementiel & Familiale"
                                className="admin-input"
                            />
                        </div>
                        <div>
                            <label className="admin-label">
                                EN - Slogan en Anglais (English Tagline)
                            </label>
                            <input
                                type="text"
                                name="tagline_en"
                                defaultValue={info.tagline_en || ''}
                                placeholder="Ex: Artisanal Catering & Homemade Gastronomy"
                                className="admin-input"
                            />
                        </div>
                    </div>
                </div>

                {/* Coordonnées */}
                <div style={{ borderBottom: '1px solid var(--admin-border-soft)', paddingBottom: '1.75rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--admin-text)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={18} style={{ color: 'var(--admin-gold)' }} /> Coordonnées &amp; Contact (Bilingue)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                        <div>
                            <label className="admin-label">Email de réception des devis *</label>
                            <input type="email" name="contact_email" defaultValue={info.contact_email} className="admin-input" required />
                        </div>
                        <div>
                            <label className="admin-label">Numéro de téléphone *</label>
                            <input type="text" name="phone" defaultValue={info.phone} className="admin-input" required />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '1.25rem' }}>
                        <div>
                            <label className="admin-label">FR - Adresse / Localisation (Français) *</label>
                            <input type="text" name="address" defaultValue={info.address} className="admin-input" required />
                        </div>
                        <div>
                            <label className="admin-label">EN - Location / Address (English) *</label>
                            <input type="text" name="address_en" defaultValue={info.address_en || ''} placeholder="e.g. 15 rue des Délices, 75011 Paris, France" className="admin-input" required />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '1.25rem' }}>
                        <div>
                            <label className="admin-label">FR - Horaires de commande (Français) *</label>
                            <input type="text" name="hours" defaultValue={info.hours} className="admin-input" required />
                        </div>
                        <div>
                            <label className="admin-label">EN - Ordering Hours (English) *</label>
                            <input type="text" name="hours_en" defaultValue={info.hours_en || ''} placeholder="e.g. Mon - Sat: 9:00 AM - 7:00 PM" className="admin-input" required />
                        </div>
                    </div>
                </div>

                {/* Réseaux sociaux & Avis */}
                <div style={{ borderBottom: '1px solid var(--admin-border-soft)', paddingBottom: '1.75rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--admin-text)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Globe size={18} style={{ color: 'var(--admin-gold)' }} /> Réseaux &amp; Liens
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                        <div>
                            <label className="admin-label">Lien Instagram</label>
                            <input type="url" name="instagram" defaultValue={info.instagram} className="admin-input" />
                        </div>
                        <div>
                            <label className="admin-label">Lien Facebook</label>
                            <input type="url" name="facebook" defaultValue={info.facebook} className="admin-input" />
                        </div>
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                        <label className="admin-label">Lien Fiche Avis Google</label>
                        <input type="url" name="google_reviews" defaultValue={info.google_reviews} className="admin-input" />
                    </div>
                </div>

                {/* Information À Propos & Prestations */}
                <div style={{ borderBottom: '1px solid var(--admin-border-soft)', paddingBottom: '1.75rem' }}>
                    <div style={{
                        background: 'rgba(200, 169, 110, 0.08)',
                        border: '1px solid rgba(200, 169, 110, 0.3)',
                        borderRadius: '8px',
                        padding: '1.25rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem'
                    }}>
                        <div>
                            <strong style={{ color: 'var(--admin-gold)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.98rem', marginBottom: '0.25rem' }}>
                                <Heart size={16} /> Histoire, Photo &amp; Prestations &quot;À Propos&quot;
                            </strong>
                            <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', margin: 0, maxWidth: '580px' }}>
                                L&apos;histoire de Mamé Fricoto (FR &amp; EN), la photo officielle et vos prestations traiteur se gèrent désormais dans leur onglet dédié <strong>À Propos</strong>.
                            </p>
                        </div>
                        <Link
                            href="/admin/dashboard/a-propos"
                            className="admin-btn admin-btn-secondary"
                            style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                            Gérer la page À Propos →
                        </Link>
                    </div>
                </div>


                {/* Notification Email pour Léa */}
                <div style={{ background: 'rgba(200, 169, 110, 0.05)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--admin-text)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={18} style={{ color: 'var(--admin-gold)' }} /> Réception des Demandes par Email
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                        Tous les messages du formulaire arrivent dans l&apos;onglet <strong>Messages</strong>. Pour recevoir également chaque demande complète par email directement dans votre boîte (pour que Léa puisse voir les demandes sans aller sur l&apos;admin), configurez les options ci-dessous.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label className="admin-label">Adresse email de réception</label>
                            <input
                                type="email"
                                name="notification_email"
                                defaultValue={info.notification_email || 'mamefricoto@gmail.com'}
                                placeholder="mamefricoto@gmail.com"
                                className="admin-input"
                            />
                            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>L&apos;adresse où Léa reçoit les emails du formulaire.</span>
                        </div>
                        <div>
                            <label className="admin-label">Mot de passe d&apos;application Gmail (16 caractères)</label>
                            <input
                                type="password"
                                name="smtp_pass"
                                defaultValue={info.smtp_pass || ''}
                                placeholder="ex: abcd efgh ijkl mnop"
                                className="admin-input"
                                autoComplete="new-password"
                            />
                            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>Généré sur compte Google &gt; Sécurité &gt; Mots de passe d&apos;application.</span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label className="admin-label">Ou Clé API Resend (Optionnel)</label>
                            <input
                                type="text"
                                name="resend_api_key"
                                defaultValue={info.resend_api_key || ''}
                                placeholder="re_123456789..."
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
                        <Save size={18} /> {loading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
                    </button>
                </div>
            </form>

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
                    Téléchargez un fichier de sauvegarde complet (menus, prestations, galerie, messages et paramètres). Ce fichier est ultra-léger (~100 Ko). Vous pouvez également restaurer une sauvegarde précédente en 1 clic.
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

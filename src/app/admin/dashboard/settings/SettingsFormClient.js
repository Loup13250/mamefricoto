'use client';
import { useState, useRef, useTransition } from 'react';
import Image from 'next/image';
import { updateSiteInfo, restoreDatabaseFromBackup } from '@/app/actions';
import {
    Save, Image as ImageIcon, Mail, Phone, Globe,
    UploadCloud, CheckCircle2, Download, ShieldCheck,
    AlertCircle, Loader2
} from 'lucide-react';

export default function SettingsFormClient({ info }) {
    const [logoPreview, setLogoPreview] = useState(info.logo || null);
    const [aboutPreview, setAboutPreview] = useState(info.about_image || null);

    const [logoFile, setLogoFile] = useState(null);
    const [aboutFile, setAboutFile] = useState(null);

    const [logoDragging, setLogoDragging] = useState(false);
    const [aboutDragging, setAboutDragging] = useState(false);

    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const [isRestoring, startRestoreTransition] = useTransition();
    const [restoreStatus, setRestoreStatus] = useState({ error: '', success: '' });
    const restoreInputRef = useRef(null);

    const logoInputRef = useRef(null);
    const aboutInputRef = useRef(null);

    const handleLogoSelect = (file) => {
        if (!file || !file.type.startsWith('image/')) return;
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleAboutSelect = (file) => {
        if (!file || !file.type.startsWith('image/')) return;
        setAboutFile(file);
        setAboutPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSaved(false);

        const formData = new FormData(e.target);

        formData.delete('logo_file');
        formData.delete('about_file');

        if (logoFile) formData.append('logo_file', logoFile);
        if (aboutFile) formData.append('about_file', aboutFile);

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
                        <ImageIcon size={18} style={{ color: 'var(--admin-gold)' }} /> Visuels du Site (Logo &amp; Image À Propos)
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>

                        {/* Logo Box */}
                        <div>
                            <label className="admin-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Logo Mamé Fricoto</label>
                            {logoPreview ? (
                                <div style={{
                                    position: 'relative',
                                    background: 'var(--admin-surface)',
                                    border: '1px solid var(--admin-border)',
                                    borderRadius: '6px',
                                    padding: '1rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                }}>
                                    <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Image src={logoPreview} alt="Logo preview" width={160} height={60} style={{ maxHeight: '60px', height: 'auto', width: 'auto', objectFit: 'contain' }} unoptimized />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => logoInputRef.current?.click()}
                                        className="admin-btn admin-btn-secondary"
                                        style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                                    >
                                        Changer le logo
                                    </button>
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
                                        borderRadius: '6px', padding: '1.5rem 1rem', textAlign: 'center', cursor: 'pointer'
                                    }}
                                >
                                    <UploadCloud size={28} style={{ color: 'var(--admin-gold)', marginBottom: '0.5rem' }} />
                                    <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--admin-text)', fontWeight: '600' }}>Cliquer pour ajouter le logo</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-subtle)' }}>PNG, SVG (Fond transparent)</span>
                                </div>
                            )}
                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => handleLogoSelect(e.target.files?.[0])}
                            />
                        </div>

                        {/* About Image Box */}
                        <div>
                            <label className="admin-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Photo section &quot;À Propos&quot;</label>
                            {aboutPreview ? (
                                <div style={{
                                    position: 'relative',
                                    background: 'var(--admin-surface)',
                                    border: '1px solid var(--admin-border)',
                                    borderRadius: '6px',
                                    padding: '0.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                }}>
                                    <div style={{ height: '100px', width: '100%', borderRadius: '4px', overflow: 'hidden' }}>
                                        <Image src={aboutPreview} alt="About preview" width={400} height={200} style={{ width: '100%', height: '100%', objectFit: 'cover' }} unoptimized />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => aboutInputRef.current?.click()}
                                        className="admin-btn admin-btn-secondary"
                                        style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                                    >
                                        Changer la photo
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setAboutDragging(true); }}
                                    onDragLeave={() => setAboutDragging(false)}
                                    onDrop={(e) => { e.preventDefault(); setAboutDragging(false); handleAboutSelect(e.dataTransfer.files?.[0]); }}
                                    onClick={() => aboutInputRef.current?.click()}
                                    style={{
                                        border: `2px dashed ${aboutDragging ? 'var(--admin-gold)' : 'var(--admin-border)'}`,
                                        background: aboutDragging ? 'rgba(200,169,110,0.08)' : 'var(--admin-surface)',
                                        borderRadius: '6px', padding: '1.5rem 1rem', textAlign: 'center', cursor: 'pointer'
                                    }}
                                >
                                    <UploadCloud size={28} style={{ color: 'var(--admin-gold)', marginBottom: '0.5rem' }} />
                                    <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--admin-text)', fontWeight: '600' }}>Cliquer pour ajouter la photo</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-subtle)' }}>Format portrait ou paysage</span>
                                </div>
                            )}
                            <input
                                ref={aboutInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => handleAboutSelect(e.target.files?.[0])}
                            />
                        </div>

                    </div>
                </div>

                {/* Coordonnées */}
                <div style={{ borderBottom: '1px solid var(--admin-border-soft)', paddingBottom: '1.75rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--admin-text)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={18} style={{ color: 'var(--admin-gold)' }} /> Coordonnées &amp; Contact
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

                    <div style={{ marginTop: '1rem' }}>
                        <label className="admin-label">Adresse / Localisation *</label>
                        <input type="text" name="address" defaultValue={info.address} className="admin-input" required />
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <label className="admin-label">Horaires de commande *</label>
                        <input type="text" name="hours" defaultValue={info.hours} className="admin-input" required />
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

                {/* Descriptions */}
                <div style={{ borderBottom: '1px solid var(--admin-border-soft)', paddingBottom: '1.75rem' }}>
                    <label className="admin-label">Texte de présentation &quot;À Propos&quot;</label>
                    <p style={{ fontSize: '0.78rem', color: 'var(--admin-text-subtle)', marginBottom: '0.5rem' }}>
                        Ce texte s&apos;affiche sur la page d&apos;accueil et sur la page À Propos. Vous pouvez sauter des lignes (Touche Entrée) pour créer plusieurs paragraphes.
                    </p>
                    <textarea name="about_text" defaultValue={info.about_text} className="admin-input" rows="6" required style={{ lineHeight: '1.6' }}></textarea>
                </div>

                {/* Notification Email (Optionnel) */}
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--admin-text)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={18} style={{ color: 'var(--admin-gold)' }} /> Notifications Email (Formspree)
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', marginBottom: '1rem' }}>
                        Tous les messages du formulaire sont automatiquement sauvegardés dans votre onglet <strong>Messages</strong>. Si vous souhaitez recevoir un vrai mail en plus, vous pouvez créer un formulaire sur <a href="https://formspree.io" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--admin-gold)' }}>Formspree.io</a> et coller l&apos;URL ci-dessous.
                    </p>
                    <div>
                        <label className="admin-label">URL Endpoint Formspree (ex: https://formspree.io/f/xxxxx)</label>
                        <input type="url" name="formspree_url" defaultValue={info.formspree_url} placeholder="https://formspree.io/f/..." className="admin-input" />
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

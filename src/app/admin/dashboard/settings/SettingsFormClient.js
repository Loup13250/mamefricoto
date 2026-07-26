'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { updateSiteInfo } from '@/app/actions';
import { Save, Image as ImageIcon, Mail, Phone, MapPin, Globe, UploadCloud, X, CheckCircle2 } from 'lucide-react';

export default function SettingsFormClient({ info }) {
    const [logoPreview, setLogoPreview] = useState(info.logo || null);
    const [aboutPreview, setAboutPreview] = useState(info.about_image || null);

    const [logoFile, setLogoFile] = useState(null);
    const [aboutFile, setAboutFile] = useState(null);

    const [logoDragging, setLogoDragging] = useState(false);
    const [aboutDragging, setAboutDragging] = useState(false);

    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

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

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

            {saved && (
                <div style={{
                    padding: '1rem', background: 'rgba(34,197,94,0.1)',
                    border: '1px solid rgba(34,197,94,0.25)', borderRadius: '6px',
                    color: '#86efac', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    fontSize: '0.9rem', fontWeight: '600'
                }}>
                    <CheckCircle2 size={18} /> Modifications enregistrées avec succès !
                </div>
            )}

            {/* Visuels du site */}
            <div style={{ borderBottom: '1px solid rgba(200,169,110,0.1)', paddingBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#F5F0E8', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ImageIcon size={18} style={{ color: '#C8A96E' }} /> Visuels du Site (Logo &amp; Image À Propos)
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>

                    {/* Logo Box */}
                    <div>
                        <label className="admin-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Logo Mamé Fricoto</label>
                        {logoPreview ? (
                            <div style={{
                                position: 'relative',
                                background: '#161412',
                                border: '1px solid rgba(200,169,110,0.25)',
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
                                    border: `2px dashed ${logoDragging ? '#C8A96E' : 'rgba(200,169,110,0.25)'}`,
                                    background: logoDragging ? 'rgba(200,169,110,0.06)' : 'rgba(255,255,255,0.02)',
                                    borderRadius: '6px', padding: '1.5rem 1rem', textAlign: 'center', cursor: 'pointer'
                                }}
                            >
                                <UploadCloud size={28} style={{ color: 'rgba(200,169,110,0.5)', marginBottom: '0.5rem' }} />
                                <span style={{ display: 'block', fontSize: '0.85rem', color: '#F5F0E8', fontWeight: '600' }}>Cliquer pour ajouter le logo</span>
                                <span style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.4)' }}>PNG, SVG (Fond transparent)</span>
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
                                background: '#161412',
                                border: '1px solid rgba(200,169,110,0.25)',
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
                                    border: `2px dashed ${aboutDragging ? '#C8A96E' : 'rgba(200,169,110,0.25)'}`,
                                    background: aboutDragging ? 'rgba(200,169,110,0.06)' : 'rgba(255,255,255,0.02)',
                                    borderRadius: '6px', padding: '1.5rem 1rem', textAlign: 'center', cursor: 'pointer'
                                }}
                            >
                                <UploadCloud size={28} style={{ color: 'rgba(200,169,110,0.5)', marginBottom: '0.5rem' }} />
                                <span style={{ display: 'block', fontSize: '0.85rem', color: '#F5F0E8', fontWeight: '600' }}>Cliquer pour ajouter la photo</span>
                                <span style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.4)' }}>Format portrait ou paysage</span>
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
            <div style={{ borderBottom: '1px solid rgba(200,169,110,0.1)', paddingBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#F5F0E8', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={18} style={{ color: '#C8A96E' }} /> Coordonnées &amp; Contact
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
            <div style={{ borderBottom: '1px solid rgba(200,169,110,0.1)', paddingBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#F5F0E8', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Globe size={18} style={{ color: '#C8A96E' }} /> Réseaux &amp; Liens
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
            <div style={{ borderBottom: '1px solid rgba(200,169,110,0.1)', paddingBottom: '1.75rem' }}>
                <label className="admin-label">Texte de présentation &quot;À Propos&quot;</label>
                <p style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.4)', marginBottom: '0.5rem' }}>
                    Ce texte s&apos;affiche sur la page d&apos;accueil et sur la page À Propos. Vous pouvez sauter des lignes (Touche Entrée) pour créer plusieurs paragraphes.
                </p>
                <textarea name="about_text" defaultValue={info.about_text} className="admin-input" rows="6" required style={{ lineHeight: '1.6' }}></textarea>
            </div>

            {/* Notification Email (Optionnel) */}
            <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#F5F0E8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={18} style={{ color: '#C8A96E' }} /> Notifications Email (Formspree)
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'rgba(245,240,232,0.5)', marginBottom: '1rem' }}>
                    Tous les messages du formulaire sont automatiquement sauvegardés dans votre onglet <strong>Messages</strong>. Si vous souhaitez recevoir un vrai mail en plus, vous pouvez créer un formulaire sur <a href="https://formspree.io" target="_blank" rel="noopener noreferrer" style={{color: '#C8A96E'}}>Formspree.io</a> et coller l&apos;URL ci-dessous.
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
    );
}

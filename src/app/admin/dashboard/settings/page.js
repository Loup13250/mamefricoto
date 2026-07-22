import { getSiteInfo } from '@/lib/data';
import { updateSiteInfo } from '@/app/actions';
import AdminFormWrapper from '@/components/AdminFormWrapper';
import { Save, Image as ImageIcon, Mail, Phone, MapPin, Globe } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
    const info = getSiteInfo();

    return (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>
                    Informations & Images du Site
                </h1>
                <p style={{ color: '#64748b' }}>
                    Modifiez facilement le logo, les visuels, les coordonnées et la configuration d&apos;envoi d&apos;email.
                </p>
            </div>

            <div className="admin-card" style={{ width: '100%', maxWidth: '750px', borderTop: '4px solid var(--admin-primary)' }}>
                <AdminFormWrapper action={updateSiteInfo} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    {/* Logos & Images */}
                    <div style={{ borderBottom: '1px solid #f1ede8', paddingBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ImageIcon size={18} /> Visuels du Site
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                            <div className="admin-dropzone" style={{ position: 'relative', padding: '1.25rem', textStyle: 'center' }}>
                                <label htmlFor="logo_file" style={{ cursor: 'pointer', display: 'block' }}>
                                    <span style={{ fontWeight: '700', display: 'block', color: '#1e293b', marginBottom: '0.25rem' }}>Logo Mamé Fricoto</span>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Changer le logo (PNG/SVG)</span>
                                    <input id="logo_file" type="file" name="logo_file" accept="image/*" style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
                                </label>
                            </div>
                            <div className="admin-dropzone" style={{ position: 'relative', padding: '1.25rem', textStyle: 'center' }}>
                                <label htmlFor="about_file" style={{ cursor: 'pointer', display: 'block' }}>
                                    <span style={{ fontWeight: '700', display: 'block', color: '#1e293b', marginBottom: '0.25rem' }}>Photo &quot;À Propos&quot;</span>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Changer la photo de cuisine</span>
                                    <input id="about_file" type="file" name="about_file" accept="image/*" style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Coordonnées */}
                    <div style={{ borderBottom: '1px solid #f1ede8', paddingBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Phone size={18} /> Coordonnées & Contact
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                            <div>
                                <label className="admin-label">Email de réception des devis *</label>
                                <input type="email" name="contact_email" defaultValue={info.contact_email} className="admin-input" placeholder="mamefricoto@gmail.com" required style={{ background: '#faf8f5' }} />
                            </div>
                            <div>
                                <label className="admin-label">Numéro de téléphone *</label>
                                <input type="text" name="phone" defaultValue={info.phone} className="admin-input" required style={{ background: '#faf8f5' }} />
                            </div>
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                            <label className="admin-label">Adresse / Localisation *</label>
                            <input type="text" name="address" defaultValue={info.address} className="admin-input" required style={{ background: '#faf8f5' }} />
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                            <label className="admin-label">Horaires de commande *</label>
                            <input type="text" name="hours" defaultValue={info.hours} className="admin-input" required style={{ background: '#faf8f5' }} />
                        </div>
                    </div>

                    {/* Réseaux sociaux & Avis */}
                    <div style={{ borderBottom: '1px solid #f1ede8', paddingBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Globe size={18} /> Réseaux & Liens
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                            <div>
                                <label className="admin-label">Lien Instagram</label>
                                <input type="url" name="instagram" defaultValue={info.instagram} className="admin-input" placeholder="https://www.instagram.com/mamefricoto/" style={{ background: '#faf8f5' }} />
                            </div>
                            <div>
                                <label className="admin-label">Lien Facebook</label>
                                <input type="url" name="facebook" defaultValue={info.facebook} className="admin-input" placeholder="https://www.facebook.com/..." style={{ background: '#faf8f5' }} />
                            </div>
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                            <label className="admin-label">Lien Fiche Avis Google</label>
                            <input type="url" name="google_reviews" defaultValue={info.google_reviews} className="admin-input" placeholder="https://www.google.com/search?q=mame+fricoto+avis" style={{ background: '#faf8f5' }} />
                        </div>
                    </div>

                    {/* Descriptions */}
                    <div style={{ borderBottom: '1px solid #f1ede8', paddingBottom: '1.5rem' }}>
                        <label className="admin-label">Texte de présentation &quot;À Propos&quot;</label>
                        <textarea name="about_text" defaultValue={info.about_text} className="admin-input" rows="4" required style={{ background: '#faf8f5', lineHeight: '1.6' }}></textarea>
                    </div>

                    {/* Notification Email SMTP (Optionnel) */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mail size={18} /> Configuration d&apos;envoi d&apos;email (SMTP Optionnel)
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                            Tous les messages du formulaire sont automatiquement sauvegardés dans votre onglet <strong>Messages</strong>. Si vous souhaitez recevoir un vrai mail en plus, complétez vos accès SMTP ci-dessous.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="admin-label">Serveur SMTP</label>
                                <input type="text" name="smtp_host" defaultValue={info.smtp_host} placeholder="smtp.gmail.com" className="admin-input" style={{ background: '#faf8f5' }} />
                            </div>
                            <div>
                                <label className="admin-label">Port SMTP</label>
                                <input type="text" name="smtp_port" defaultValue={info.smtp_port || '587'} className="admin-input" style={{ background: '#faf8f5' }} />
                            </div>
                            <div>
                                <label className="admin-label">Utilisateur SMTP / Email</label>
                                <input type="text" name="smtp_user" defaultValue={info.smtp_user} className="admin-input" style={{ background: '#faf8f5' }} />
                            </div>
                            <div>
                                <label className="admin-label">Mot de passe SMTP / App Password</label>
                                <input type="password" name="smtp_pass" defaultValue={info.smtp_pass} className="admin-input" style={{ background: '#faf8f5' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ paddingTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                        <button type="submit" className="admin-btn admin-btn-primary" style={{ padding: '14px 40px', fontSize: '1rem' }}>
                            <Save size={18} /> Sauvegarder les modifications
                        </button>
                    </div>
                </AdminFormWrapper>
            </div>
        </div>
    );
}

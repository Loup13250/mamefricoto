import { getSiteInfo } from '@/lib/data';
import { updateSiteInfo } from '@/app/actions';
import { Save } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
    const info = getSiteInfo();

    return (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>Informations du Site</h1>
                <p style={{ color: '#64748b' }}>Mettez à jour les coordonnées et la description de votre activité.</p>
            </div>

            <div className="admin-card" style={{ width: '100%', maxWidth: '700px', borderTop: '4px solid var(--admin-primary)' }}>
                <form action={updateSiteInfo} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label className="admin-label">Email de contact</label>
                            <input type="email" name="contact_email" defaultValue={info.contact_email} className="admin-input" placeholder="mamefricoto@gmail.com" style={{ background: '#faf8f5' }} />
                        </div>
                        <div>
                            <label className="admin-label">Numéro de téléphone *</label>
                            <input type="text" name="phone" defaultValue={info.phone} className="admin-input" required style={{ background: '#faf8f5' }} />
                        </div>
                    </div>

                    <div>
                        <label className="admin-label">Adresse / Localisation *</label>
                        <input type="text" name="address" defaultValue={info.address} className="admin-input" required style={{ background: '#faf8f5' }} />
                    </div>

                    <div>
                        <label className="admin-label">Horaires de commande *</label>
                        <input type="text" name="hours" defaultValue={info.hours} className="admin-input" required style={{ background: '#faf8f5' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label className="admin-label">Lien Instagram</label>
                            <input type="url" name="instagram" defaultValue={info.instagram} className="admin-input" placeholder="https://www.instagram.com/mamefricoto/" style={{ background: '#faf8f5' }} />
                        </div>
                        <div>
                            <label className="admin-label">Lien Facebook</label>
                            <input type="url" name="facebook" defaultValue={info.facebook} className="admin-input" placeholder="https://www.facebook.com/..." style={{ background: '#faf8f5' }} />
                        </div>
                    </div>

                    <div>
                        <label className="admin-label">Lien Avis Google</label>
                        <input type="url" name="google_reviews" defaultValue={info.google_reviews} className="admin-input" placeholder="https://www.google.com/search?q=..." style={{ background: '#faf8f5' }} />
                    </div>

                    <div>
                        <label className="admin-label">Texte &quot;À Propos&quot; (page d&apos;accueil + page À Propos)</label>
                        <textarea name="about_text" defaultValue={info.about_text} className="admin-input" rows="5" required style={{ background: '#faf8f5', lineHeight: '1.6' }}></textarea>
                    </div>

                    <div style={{ paddingTop: '1rem', borderTop: '1px solid #f1ede8', display: 'flex', justifyContent: 'center' }}>
                        <button type="submit" className="admin-btn admin-btn-primary" style={{ padding: '14px 40px', fontSize: '1rem' }}>
                            <Save size={18} /> Sauvegarder les modifications
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

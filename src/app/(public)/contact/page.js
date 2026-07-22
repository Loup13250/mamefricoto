import { getSiteInfo } from '@/lib/data';
import ContactForm from '@/components/ContactForm';
import { MapPin, Phone, Clock, Instagram, Facebook, Star, Mail } from 'lucide-react';

export const metadata = {
    title: 'Contact & Devis | Mamé Fricoto — Traiteur Maison',
    description: 'Contactez Mamé Fricoto pour vos commandes de plats du jour, buffets dînatoires ou événements privés à Eyguières.',
};

export const revalidate = 0;

export default function ContactPage() {
    const info = getSiteInfo();

    return (
        <main className="container section-padding animate-fade">
            <div className="text-center" style={{ marginBottom: '4rem' }}>
                <span className="section-subtitle" style={{ justifyContent: 'center' }}>NOUS CONTACTER</span>
                <h1 className="section-title text-gradient">Contact & Demande de Devis</h1>
                <p style={{ maxWidth: '550px', margin: '1rem auto 0', color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
                    Pour commander vos plats de la semaine, organiser un buffet dînatoire ou réserver pour un événement.
                </p>
            </div>

            <div className="grid-2" style={{ maxWidth: '1100px', margin: '0 auto', gap: '3.5rem' }}>
                {/* Left side: Interactive Form */}
                <ContactForm />

                {/* Right side: Contact Cards & Info */}
                <div className="animate-fade-up delay-200" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-panel" style={{ padding: '2.5rem' }}>
                        <h2 style={{ marginBottom: '2rem', fontFamily: 'var(--font-primary)', color: 'var(--text-primary)' }}>Coordonnées Directes</h2>

                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <li style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ color: 'var(--accent-blue)', backgroundColor: 'rgba(61,90,128,0.08)', padding: '15px', borderRadius: '50%', flexShrink: 0 }}>
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Téléphone</strong>
                                    <a href="tel:0743646411" style={{ color: 'var(--accent-blue)', fontWeight: '700', fontSize: '1.25rem' }}>
                                        {info.phone || '07 43 64 64 11'}
                                    </a>
                                </div>
                            </li>
                            <li style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ color: 'var(--accent-blue)', backgroundColor: 'rgba(61,90,128,0.08)', padding: '15px', borderRadius: '50%', flexShrink: 0 }}>
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Labo à domicile</strong>
                                    <span style={{ fontWeight: '600' }}>{info.address || 'Eyguières, Bouches-du-Rhône'}</span>
                                </div>
                            </li>
                            <li style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ color: 'var(--accent-blue)', backgroundColor: 'rgba(61,90,128,0.08)', padding: '15px', borderRadius: '50%', flexShrink: 0 }}>
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Commandes</strong>
                                    <span style={{ fontWeight: '600' }}>{info.hours || 'Commandes avant 10h'}</span>
                                </div>
                            </li>
                            {info.contact_email && (
                                <li style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ color: 'var(--accent-blue)', backgroundColor: 'rgba(61,90,128,0.08)', padding: '15px', borderRadius: '50%', flexShrink: 0 }}>
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <strong style={{ display: 'block', fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Email</strong>
                                        <a href={`mailto:${info.contact_email}`} style={{ color: 'var(--accent-blue)', fontWeight: '600' }}>
                                            {info.contact_email}
                                        </a>
                                    </div>
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Social & Google Reviews */}
                    <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '1rem' }}>
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={24} fill="#FFD700" color="#FFD700" />
                            ))}
                        </div>
                        <h3 style={{ fontFamily: 'var(--font-primary)', marginBottom: '0.75rem', fontSize: '1.3rem' }}>Mamé Fricoto sur Google</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                            Consultez les avis de nos clients ou suivez nos stories sur les réseaux.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {info.google_reviews && (
                                <a href={info.google_reviews} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                    <Star size={18} />
                                    Consulter les Avis Google
                                </a>
                            )}
                            {info.instagram && (
                                <a href={info.instagram} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                                    <Instagram size={18} />
                                    @mamefricoto sur Instagram
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

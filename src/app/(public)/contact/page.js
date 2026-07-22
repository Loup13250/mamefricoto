import { getSiteInfo } from '@/lib/data';
import { MapPin, Phone, Clock, Instagram, Facebook, Star, Mail } from 'lucide-react';

export const metadata = {
    title: 'Contact | Mamé Fricoto — Traiteur Maison',
    description: 'Contactez Mamé Fricoto pour commander vos plats maison. Livraison et retrait à Eyguières.',
};

export const revalidate = 0;

export default function ContactPage() {
    const info = getSiteInfo();

    return (
        <main className="container section-padding animate-fade">
            <div className="text-center" style={{ marginBottom: '4rem' }}>
                <span className="section-subtitle" style={{ justifyContent: 'center' }}>NOUS CONTACTER</span>
                <h1 className="section-title text-gradient">Contact & Commande</h1>
                <p style={{ maxWidth: '550px', margin: '1rem auto 0', color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
                    Pour commander vos plats de la semaine, réserver un buffet ou simplement nous poser une question.
                </p>
            </div>

            <div className="grid-2" style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Contact Info */}
                <div className="glass-panel animate-fade-up" style={{ padding: '3rem' }}>
                    <h2 style={{ marginBottom: '2rem', fontFamily: 'var(--font-primary)', color: 'var(--text-primary)' }}>Coordonnées</h2>

                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <li style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ color: 'var(--accent-blue)', backgroundColor: 'rgba(61,90,128,0.08)', padding: '15px', borderRadius: '50%', flexShrink: 0 }}>
                                <Phone size={24} />
                            </div>
                            <div>
                                <strong style={{ display: 'block', fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Téléphone</strong>
                                <a href="tel:0743646411" style={{ color: 'var(--accent-blue)', fontWeight: '600', fontSize: '1.15rem' }}>
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
                                <span style={{ fontWeight: '500' }}>{info.address || 'Eyguières, Bouches-du-Rhône'}</span>
                            </div>
                        </li>
                        <li style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ color: 'var(--accent-blue)', backgroundColor: 'rgba(61,90,128,0.08)', padding: '15px', borderRadius: '50%', flexShrink: 0 }}>
                                <Clock size={24} />
                            </div>
                            <div>
                                <strong style={{ display: 'block', fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Commandes</strong>
                                <span style={{ fontWeight: '500' }}>{info.hours || 'Commandes avant 10h'}</span>
                            </div>
                        </li>
                        {info.contact_email && (
                            <li style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ color: 'var(--accent-blue)', backgroundColor: 'rgba(61,90,128,0.08)', padding: '15px', borderRadius: '50%', flexShrink: 0 }}>
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Email</strong>
                                    <a href={`mailto:${info.contact_email}`} style={{ color: 'var(--accent-blue)', fontWeight: '500' }}>
                                        {info.contact_email}
                                    </a>
                                </div>
                            </li>
                        )}
                    </ul>
                </div>

                {/* Social & Avis */}
                <div className="animate-fade-up delay-200" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Réseaux Sociaux */}
                    <div className="glass-panel" style={{ padding: '2.5rem' }}>
                        <h2 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-primary)', color: 'var(--text-primary)', fontSize: '1.4rem' }}>Suivez-nous</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                            Retrouvez le menu de la semaine, les coulisses de la cuisine et les actualités sur nos réseaux.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {info.instagram && (
                                <a href={info.instagram} target="_blank" rel="noopener noreferrer"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '14px 20px', background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', color: 'white', borderRadius: 'var(--border-radius-md)', fontWeight: '600', transition: 'all 0.3s ease' }}>
                                    <Instagram size={22} />
                                    @mamefricoto sur Instagram
                                </a>
                            )}
                            {info.facebook && (
                                <a href={info.facebook} target="_blank" rel="noopener noreferrer"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '14px 20px', background: '#1877F2', color: 'white', borderRadius: 'var(--border-radius-md)', fontWeight: '600', transition: 'all 0.3s ease' }}>
                                    <Facebook size={22} />
                                    Mamé Fricoto sur Facebook
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Avis Google */}
                    {info.google_reviews && (
                        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginBottom: '1rem' }}>
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={22} fill="#FFD700" color="#FFD700" />
                                ))}
                            </div>
                            <h3 style={{ fontFamily: 'var(--font-primary)', marginBottom: '0.75rem', fontSize: '1.2rem' }}>Nos clients nous adorent !</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                                Découvrez les avis de nos clients sur Google.
                            </p>
                            <a href={info.google_reviews} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                <Star size={16} />
                                Voir les avis Google
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

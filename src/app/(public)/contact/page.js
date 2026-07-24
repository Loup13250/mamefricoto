import { getSiteInfo } from '@/lib/data';
import ContactForm from '@/components/ContactForm';
import { MapPin, Phone, Clock, Instagram, Facebook, Star, Mail, ArrowRight } from 'lucide-react';

export const metadata = {
    title: 'Contact & Devis | Mamé Fricoto — Traiteur Maison',
    description: 'Contactez Mamé Fricoto pour vos commandes de plats du jour, buffets dînatoires ou événements privés à Eyguières.',
};

export const revalidate = 0;

export default function ContactPage() {
    const info = getSiteInfo();

    return (
        <main style={{ paddingTop: '80px' }}>

            {/* Page header */}
            <section style={{
                background: 'var(--bg-2)',
                padding: '5rem 0 4rem',
                borderBottom: '1px solid var(--border)',
            }}>
                <div className="container anim-fade">
                    <span className="label">Nous contacter</span>
                    <h1 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                        fontWeight: '400',
                        marginTop: '0.75rem',
                        lineHeight: '1.05',
                    }}>
                        Contact &amp;<br />
                        <em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>Demande de Devis</em>
                    </h1>
                    <p style={{
                        maxWidth: '500px',
                        marginTop: '1.5rem',
                        color: 'var(--text-2)',
                        fontSize: '0.95rem',
                        lineHeight: '1.7',
                    }}>
                        Pour commander vos plats de la semaine, organiser un buffet dînatoire ou réserver pour un événement.
                    </p>
                </div>
            </section>

            {/* Main content */}
            <section style={{ background: 'var(--bg)', padding: '7rem 0' }}>
                <div className="container">
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '4rem',
                        alignItems: 'start',
                        maxWidth: '1100px',
                        margin: '0 auto',
                    }} className="contact-page-grid">

                        {/* Form */}
                        <ContactForm />

                        {/* Info panels */}
                        <div className="anim-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                            {/* Direct contact */}
                            <div style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                padding: '2.5rem',
                            }}>
                                <span className="label" style={{ marginBottom: '1.5rem', display: 'block' }}>
                                    Coordonnées directes
                                </span>
                                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <li style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                                        <div style={{
                                            width: '44px', height: '44px', border: '1px solid var(--border)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'var(--gold)', flexShrink: 0,
                                        }}>
                                            <Phone size={18} />
                                        </div>
                                        <div>
                                            <strong style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '0.35rem' }}>Téléphone</strong>
                                            <a href="tel:0743646411" style={{ color: 'var(--gold-light)', fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: '400' }}>
                                                {info.phone || '07 43 64 64 11'}
                                            </a>
                                        </div>
                                    </li>
                                    <li style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                                        <div style={{
                                            width: '44px', height: '44px', border: '1px solid var(--border)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'var(--gold)', flexShrink: 0,
                                        }}>
                                            <MapPin size={18} />
                                        </div>
                                        <div>
                                            <strong style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '0.35rem' }}>Labo</strong>
                                            <span style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>{info.address || 'Eyguières, Bouches-du-Rhône'}</span>
                                        </div>
                                    </li>
                                    <li style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                                        <div style={{
                                            width: '44px', height: '44px', border: '1px solid var(--border)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'var(--gold)', flexShrink: 0,
                                        }}>
                                            <Clock size={18} />
                                        </div>
                                        <div>
                                            <strong style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '0.35rem' }}>Commandes</strong>
                                            <span style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>{info.hours || 'Avant 10h le matin'}</span>
                                        </div>
                                    </li>
                                    {info.contact_email && (
                                        <li style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                                            <div style={{
                                                width: '44px', height: '44px', border: '1px solid var(--border)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'var(--gold)', flexShrink: 0,
                                            }}>
                                                <Mail size={18} />
                                            </div>
                                            <div>
                                                <strong style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '0.35rem' }}>Email</strong>
                                                <a href={`mailto:${info.contact_email}`} style={{ color: 'var(--text-2)', fontSize: '0.9rem', transition: 'color 0.3s' }}>
                                                    {info.contact_email}
                                                </a>
                                            </div>
                                        </li>
                                    )}
                                </ul>
                            </div>

                            {/* Reviews & Social */}
                            <div style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                padding: '2.5rem',
                                textAlign: 'center',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginBottom: '1rem' }}>
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={18} fill="var(--gold)" color="var(--gold)" />
                                    ))}
                                </div>
                                <h3 style={{
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: '1.4rem',
                                    fontWeight: '400',
                                    marginBottom: '0.75rem',
                                }}>Mamé Fricoto sur Google</h3>
                                <p style={{ color: 'var(--text-2)', marginBottom: '1.75rem', fontSize: '0.88rem', lineHeight: '1.6' }}>
                                    Consultez les avis de nos clients ou suivez nos actualités sur les réseaux.
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {info.google_reviews && (
                                        <a href={info.google_reviews} target="_blank" rel="noopener noreferrer" className="btn-gold" style={{ justifyContent: 'center' }}>
                                            <Star size={14} />
                                            Voir les avis Google
                                            <ArrowRight size={13} />
                                        </a>
                                    )}
                                    {info.instagram && (
                                        <a href={info.instagram} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ justifyContent: 'center' }}>
                                            <Instagram size={14} />
                                            @mamefricoto sur Instagram
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <style>{`
                @media (max-width: 768px) {
                    .contact-page-grid {
                        grid-template-columns: 1fr !important;
                        gap: 2.5rem !important;
                    }
                }
            `}</style>
        </main>
    );
}

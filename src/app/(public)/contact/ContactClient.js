'use client';
import ContactForm from '@/components/ContactForm';
import { useLanguage } from '@/context/LanguageContext';
import { MapPin, Phone, Clock, Instagram, Star, Mail, ArrowRight } from 'lucide-react';

export default function ContactClient({ info }) {
    const { t, trans, lang } = useLanguage();
    const phone = info?.phone || '07 43 64 64 11';
    const phoneTel = phone.replace(/\s+/g, '');
    const address = trans(info, 'address') || (lang === 'en' ? 'Eyguières, Provence, France' : 'Eyguières, Bouches-du-Rhône');
    const hours = trans(info, 'hours') || t('contact.hoursVal');

    return (
        <main id="main-content" tabIndex="-1" className="subpage-main">
            {/* Page header */}
            <section className="subpage-hero">
                <div className="container anim-fade">
                    <span className="label">{t('contact.badge')}</span>
                    <h1 className="subpage-title">
                        {t('contact.title')}<br />
                        <em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>{t('contact.titleItalic')}</em>
                    </h1>
                    <p className="subpage-subtitle">
                        {t('contact.desc')}
                    </p>
                </div>
            </section>

            {/* Main content */}
            <section className="subpage-content-section" style={{ background: 'var(--bg)' }}>
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
                                    {t('contact.directTitle')}
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
                                            <strong style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '0.35rem' }}>
                                                {t('contact.directPhoneLabel')}
                                            </strong>
                                            <a href={`tel:${phoneTel}`} style={{ color: 'var(--gold-light)', fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: '400' }}>
                                                {phone}
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
                                            <strong style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '0.35rem' }}>
                                                {t('contact.labLabel')}
                                            </strong>
                                            <span style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>{address}</span>
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
                                            <strong style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '0.35rem' }}>
                                                {t('contact.hoursLabel')}
                                            </strong>
                                            <span style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>{hours}</span>
                                        </div>
                                    </li>
                                    {info?.contact_email && (
                                        <li style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                                            <div style={{
                                                width: '44px', height: '44px', border: '1px solid var(--border)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'var(--gold)', flexShrink: 0,
                                            }}>
                                                <Mail size={18} />
                                            </div>
                                            <div>
                                                <strong style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '0.35rem' }}>
                                                    {t('contact.emailLabel').replace('*', '').trim()}
                                                </strong>
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
                                }}>{t('contact.socialTitle')}</h3>
                                <p style={{ color: 'var(--text-2)', marginBottom: '1.75rem', fontSize: '0.88rem', lineHeight: '1.6' }}>
                                    {t('contact.socialDesc')}
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {info?.google_reviews && (
                                        <a href={info.google_reviews} target="_blank" rel="noopener noreferrer" className="btn-gold" style={{ justifyContent: 'center' }}>
                                            <Star size={14} />
                                            {t('reviews.btn')}
                                            <ArrowRight size={13} />
                                        </a>
                                    )}
                                    {info?.instagram && (
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

'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Phone, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import '../home.css';

export default function AProposClient({ info, services }) {
    const { t, trans, lang } = useLanguage();
    const phone = info?.phone || '07 43 64 64 11';
    const phoneTel = phone.replace(/\s+/g, '');
    const aboutText = trans(info, 'about_text');

    const defaultStory = lang === 'en'
        ? "Mamé Fricoto is the story of a passionate cook who decided to share her generous homemade recipes with you.\n\nEvery dish is prepared in our culinary workshop in Eyguières, using ingredients carefully sourced from local producers. No additives, no shortcuts — just genuine, heartfelt cuisine."
        : "Mamé Fricoto, c'est l'histoire d'une passionnée de cuisine qui a décidé de partager ses recettes maison avec vous.\n\nChaque plat est préparé dans notre labo à domicile à Eyguières, avec des ingrédients soigneusement sélectionnés auprès de producteurs locaux. Pas d'additifs, pas de raccourcis — juste de la vraie cuisine.";

    const facts = [
        { label: t('about.method'), val: t('about.methodVal') },
        { label: t('about.sourcing'), val: t('about.sourcingVal') },
        { label: t('about.avail'), val: t('about.availVal') },
        { label: t('about.loc'), val: t('about.locVal') },
    ];

    return (
        <main className="subpage-main">
            {/* ===== PAGE HERO ===== */}
            <section className="subpage-hero">
                <div className="container anim-fade">
                    <span className="label">{t('about.pageBadge')}</span>
                    <h1 className="subpage-title">
                        {t('about.pageTitle')}<br />
                        <em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>Mamé Fricoto</em>
                    </h1>
                    <p className="subpage-subtitle">
                        {trans(info, 'tagline') || t('about.pageTagline')}
                    </p>
                </div>
            </section>

            {/* ===== STORY ===== */}
            <section className="subpage-content-section" style={{ background: 'var(--bg)' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem', alignItems: 'center' }}
                        className="about-story-grid">
                        <div className="anim-up">
                            <span className="label">{t('about.passionBadge')}</span>
                            <h2 style={{
                                fontFamily: 'var(--font-heading)',
                                fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                                fontWeight: '400',
                                marginTop: '0.75rem',
                                marginBottom: '1.5rem',
                                lineHeight: '1.1',
                            }}>
                                {t('about.authTitle')}<br />
                                <em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>{t('about.authTitleItalic')}</em>
                            </h2>
                            <p style={{ color: 'var(--text-2)', fontSize: '1rem', lineHeight: '1.85', whiteSpace: 'pre-line' }}>
                                {aboutText || defaultStory}
                            </p>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '1.5rem',
                                marginTop: '2.5rem',
                            }}>
                                {facts.map(f => (
                                    <div key={f.label} style={{
                                        borderLeft: '1px solid var(--border)',
                                        paddingLeft: '1.25rem',
                                    }}>
                                        <strong style={{
                                            display: 'block',
                                            fontSize: '0.68rem',
                                            fontWeight: '700',
                                            letterSpacing: '0.18em',
                                            textTransform: 'uppercase',
                                            color: 'var(--gold)',
                                            marginBottom: '0.35rem',
                                        }}>{f.label}</strong>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-2)' }}>{f.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="anim-up delay-2" style={{ position: 'relative' }}>
                            <Image
                                src={info?.about_image || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=800&auto=format&fit=crop"}
                                alt="Cuisine maison Mamé Fricoto"
                                width={800}
                                height={900}
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    objectFit: 'cover',
                                    display: 'block',
                                    border: '1px solid var(--border)',
                                }}
                                sizes="(max-width: 900px) 100vw, 50vw"
                                loading="lazy"
                                unoptimized
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== SERVICES ===== */}
            <section className="services-section">
                <div className="container">
                    <div className="section-header anim-up" style={{ maxWidth: '600px', marginBottom: '3.5rem' }}>
                        <span className="label">{t('services.badge')}</span>
                        <h2 className="title-lg" style={{ marginTop: '0.75rem' }}>{t('services.aboutTitle')}</h2>
                    </div>
                    <div className="services-grid">
                        {services.map((s, idx) => {
                            const badge = trans(s, 'badge');
                            return (
                                <div key={s.id || s.title || idx} className="service-card">
                                    <div className="service-num" aria-hidden="true">{s.num || `0${idx + 1}`}</div>
                                    {badge && <span className="service-badge">{badge}</span>}
                                    <h3>{trans(s, 'title')}</h3>
                                    <p>{trans(s, 'description')}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ===== CTA ===== */}
            <section style={{ background: 'var(--bg)', padding: '7rem 0', borderBottom: '1px solid var(--border)' }}>
                <div className="container text-center anim-up">
                    <span className="label">{t('cta.badge')}</span>
                    <h2 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                        fontWeight: '400',
                        marginTop: '1rem',
                        marginBottom: '1rem',
                    }}>{t('about.tasteTitle')}</h2>
                    <p style={{ color: 'var(--text-2)', maxWidth: '430px', margin: '0 auto 2.5rem', fontSize: '0.95rem', lineHeight: '1.7' }}>
                        {t('about.tasteDesc')}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href={`tel:${phoneTel}`} className="btn-terra" style={{ fontSize: '0.95rem', padding: '16px 36px' }}>
                            <Phone size={16} />
                            {phone}
                        </a>
                        <Link href="/contact" className="btn-outline">
                            {t('cta.quoteBtn')}
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </section>

            <style>{`
                @media (max-width: 900px) {
                    .about-story-grid {
                        grid-template-columns: 1fr !important;
                        gap: 3rem !important;
                    }
                }
            `}</style>
        </main>
    );
}

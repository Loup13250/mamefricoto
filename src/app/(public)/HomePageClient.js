'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import HeroCarousel from '@/components/HeroCarousel';
import WeeklyMenuCarousel from '@/components/WeeklyMenuCarousel';
import GoogleReviewsSection from '@/components/GoogleReviewsSection';
import { useLanguage } from '@/context/LanguageContext';
import { Phone, ArrowRight, Truck } from 'lucide-react';
import './home.css';

export default function HomePageClient({ siteInfo, carousel, weeklyMenu, services }) {
    const { t, trans, lang } = useLanguage();

    const phone = siteInfo?.phone || '07 43 64 64 11';
    const phoneTel = phone.replace(/\s+/g, '');
    const aboutText = trans(siteInfo, 'about_text');
    const address = trans(siteInfo, 'address') || (lang === 'en' ? 'Eyguières, Provence, France' : 'Eyguières, Bouches-du-Rhône');

    return (
        <main id="main-content" tabIndex="-1">
            {/* ===== HERO ===== */}
            <HeroCarousel slides={carousel} siteInfo={siteInfo} />

            {/* ===== INFO STRIP ===== */}
            <div className="info-strip">
                <div className="container info-strip-inner">
                    <div className="info-strip-item">
                        <Truck size={14} />
                        <span>{t('strip.delivery')}</span>
                    </div>
                    <div className="info-strip-sep" />
                    <div className="info-strip-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        <span>{t('strip.pickup')}</span>
                    </div>
                    <div className="info-strip-sep" />
                    <div className="info-strip-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/></svg>
                        <span>{trans(siteInfo, 'hours') || t('strip.hours')}</span>
                    </div>
                    <div className="info-strip-sep" />
                    <div className="info-strip-item">
                        <Phone size={14} />
                        <a href={`tel:${phoneTel}`} style={{ color: 'inherit' }}>{phone}</a>
                    </div>
                </div>
            </div>

            {/* ===== MENU DE LA SEMAINE ===== */}
            <section id="menu-semaine" className="menu-section">
                <div className="container">
                    <div className="menu-section-header anim-up">
                        <div>
                            <span className="label">{t('menu.badge')}</span>
                            <h2 className="title-lg" style={{ marginTop: '0.75rem' }}>
                                {t('menu.title')}<br /><em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>{t('menu.titleItalic')}</em>
                            </h2>
                        </div>
                        <p className="body-sm" style={{ maxWidth: '440px', textAlign: 'right', lineHeight: '1.6' }}>
                            <span style={{ whiteSpace: 'nowrap' }}>{t('menu.orderPhone', { phone })}</span>
                            <br />
                            {t('menu.orderHint')}
                        </p>
                    </div>

                    {weeklyMenu ? (
                        <WeeklyMenuCarousel menu={weeklyMenu} siteInfo={siteInfo} />
                    ) : (
                        <div className="menu-empty anim-up delay-2">
                            <h3>{t('menu.emptyTitle')}</h3>
                            <p style={{ marginBottom: '1.5rem' }}>{t('menu.emptyDesc')}</p>
                            {siteInfo?.instagram && (
                                <a href={siteInfo.instagram} target="_blank" rel="noopener noreferrer" className="btn-outline">
                                    {t('menu.followInsta')}
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* ===== NOS PRESTATIONS ===== */}
            <section className="services-section">
                <div className="container">
                    <div className="section-header anim-up" style={{ maxWidth: '600px', marginBottom: '3.5rem' }}>
                        <span className="label">{t('services.badge')}</span>
                        <h2 className="title-lg" style={{ marginTop: '0.75rem' }}>{t('services.title')}</h2>
                    </div>
                    <div className="services-grid">
                        {services.map((s, idx) => {
                            const badge = trans(s, 'badge');
                            return (
                                <div key={s.id || s.num || idx} className="service-card">
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

            {/* ===== À PROPOS ===== */}
            <section className="about-section">
                <div className="about-grid">
                    <div className="about-img-col">
                        <Image
                            src={siteInfo?.about_image || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=800&auto=format&fit=crop"}
                            alt={lang === 'en' ? "Homemade cuisine Mamé Fricoto" : "Cuisine maison Mamé Fricoto"}
                            width={800}
                            height={900}
                            className="about-img"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            sizes="(max-width: 900px) 100vw, 50vw"
                            loading="lazy"
                            unoptimized
                        />
                    </div>
                    <div className="about-text-col">
                        <span className="label">{t('about.badge')}</span>
                        <h2 className="title-lg" style={{ marginTop: '0.75rem' }}>
                            {t('about.spirit')}<br /><em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>{t('about.spiritItalic')}</em>
                        </h2>
                        <p className="body-lg" style={{ whiteSpace: 'pre-line' }}>{aboutText}</p>
                        <div className="about-facts">
                            <div className="about-fact">
                                <strong>{t('about.locationLabel')}</strong>
                                <p>{address}</p>
                            </div>
                            <div className="about-fact">
                                <strong>{t('about.contactLabel')}</strong>
                                <p><a href={`tel:${phoneTel}`} style={{ color: 'inherit' }}>{phone}</a></p>
                            </div>
                        </div>
                        <Link href="/a-propos" className="btn-outline" style={{ alignSelf: 'flex-start' }}>
                            {t('about.learnMore')}
                            <ArrowRight size={15} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ===== AVIS CLIENTS GOOGLE ===== */}
            <GoogleReviewsSection siteInfo={siteInfo} />

            {/* ===== CTA FINAL ===== */}
            <section className="final-cta">
                <div className="container text-center anim-up">
                    <span className="label">{t('cta.badge')}</span>
                    <h2 className="title-lg final-cta" style={{ marginTop: '1rem', marginBottom: '1rem', background: 'transparent', padding: '0 0 0.5rem 0', border: 'none' }}>
                        {t('cta.title')}
                    </h2>
                    <p className="body-lg" style={{ maxWidth: '480px', margin: '0 auto' }}>
                        {t('cta.desc')}
                    </p>
                    <div className="final-cta-actions">
                        <a href={`tel:${phoneTel}`} className="btn-terra" style={{ fontSize: '1rem', padding: '18px 40px' }}>
                            <Phone size={18} />
                            {phone}
                        </a>
                        <Link href="/contact" className="btn-outline">
                            {t('cta.quoteBtn')}
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}

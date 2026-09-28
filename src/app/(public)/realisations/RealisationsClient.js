'use client';
import Link from 'next/link';
import { Phone, Instagram, ArrowRight } from 'lucide-react';
import InstagramGallery from '@/components/InstagramGallery';
import { useLanguage } from '@/context/LanguageContext';
import '../home.css';

export default function RealisationsClient({ siteInfo, galleryPosts }) {
    const { t } = useLanguage();
    const phone = siteInfo?.phone || '07 43 64 64 11';
    const phoneTel = phone.replace(/\s+/g, '');

    return (
        <main id="main-content" tabIndex="-1" className="subpage-main">
            {/* ===== PAGE HERO ===== */}
            <section className="subpage-hero">
                <div className="container anim-fade">
                    <span className="label">
                        {t('gallery.badge')}
                    </span>
                    <h1 className="subpage-title">
                        {t('gallery.title')}<br />
                        <em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>{t('gallery.titleItalic')}</em>
                    </h1>
                    <p className="subpage-subtitle">
                        {t('gallery.desc')}
                    </p>
                </div>
            </section>

            {/* ===== GALLERY GRID ===== */}
            <section className="subpage-content-section">
                {galleryPosts && galleryPosts.length > 0 ? (
                    <InstagramGallery posts={galleryPosts} siteInfo={siteInfo} showHeader={false} />
                ) : (
                    <div className="container text-center" style={{ padding: '4rem 1rem' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                            {t('gallery.empty')}
                        </p>
                        {siteInfo?.instagram && (
                            <a
                                href={siteInfo.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-outline"
                                style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Instagram size={16} /> {t('gallery.follow')}
                            </a>
                        )}
                    </div>
                )}
            </section>

            {/* ===== CTA SECTION ===== */}
            <section style={{ background: 'var(--bg-2)', padding: '6rem 0', borderTop: '1px solid var(--border)' }}>
                <div className="container text-center anim-up">
                    <span className="label">{t('gallery.ctaBadge')}</span>
                    <h2 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                        fontWeight: '400',
                        marginTop: '1rem',
                        marginBottom: '1rem',
                    }}>
                        {t('gallery.ctaTitle')}
                    </h2>
                    <p style={{ color: 'var(--text-2)', maxWidth: '480px', margin: '0 auto 2.5rem', fontSize: '0.95rem', lineHeight: '1.7' }}>
                        {t('gallery.ctaDesc')}
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
        </main>
    );
}

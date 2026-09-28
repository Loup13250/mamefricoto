'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
    Phone, 
    ArrowRight, 
    FileText, 
    Download, 
    ExternalLink, 
    Maximize2, 
    X 
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import '../home.css';
import './tarifs.css';

export default function TarifsClient({ siteInfo, services = [], pricingDocuments = [] }) {
    const { t, trans, lang } = useLanguage();
    const [lightboxItem, setLightboxItem] = useState(null);

    const phone = siteInfo?.phone || '07 43 64 64 11';
    const phoneTel = phone.replace(/\s+/g, '');

    return (
        <main id="main-content" tabIndex="-1" className="tarifs-page subpage-main">
            {/* ===== PAGE HERO ===== */}
            <section className="subpage-hero">
                <div className="container anim-fade">
                    <span className="label">
                        {t('tarifs.badge')}
                    </span>
                    <h1 className="subpage-title">
                        {t('tarifs.title')}<br />
                        <em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>{t('tarifs.titleItalic')}</em>
                    </h1>
                    <p className="subpage-subtitle">
                        {t('tarifs.desc')}
                    </p>
                </div>
            </section>

            {/* ===== SECTION 1: CARTES & MENUS (PDF / IMAGES) EN HAUT ===== */}
            <section id="cartes-documents" className="tarifs-section">
                <div className="container">

                    {pricingDocuments && pricingDocuments.length > 0 ? (
                        <div className="pricing-docs-grid">
                            {pricingDocuments.map((doc, idx) => {
                                const title = trans(doc, 'title');
                                const description = trans(doc, 'description');
                                
                                // Determine active file url based on language
                                const activeUrl = (lang === 'en' && doc.file_url_en) ? doc.file_url_en : doc.file_url;
                                const isPdf = doc.file_type === 'pdf' || (activeUrl && activeUrl.toLowerCase().endsWith('.pdf'));

                                return (
                                    <div key={doc.id || idx} className="pricing-doc-card anim-up">
                                        {/* Visual Preview */}
                                        {isPdf ? (
                                            <div
                                                className="pricing-doc-pdf-preview"
                                                onClick={() => window.open(activeUrl, '_blank')}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => e.key === 'Enter' && window.open(activeUrl, '_blank')}
                                            >
                                                <span className="pricing-doc-type-badge">PDF DOCUMENT</span>
                                                <div className="pricing-doc-pdf-icon">
                                                    <FileText size={34} />
                                                </div>
                                                <div style={{ fontWeight: 600, fontSize: '1.05rem', color: '#fff', padding: '0 1rem' }}>
                                                    {title}
                                                </div>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--gold-light)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                                    <ExternalLink size={14} /> {t('tarifs.openPdf')}
                                                </span>
                                            </div>
                                        ) : (
                                            <div
                                                className="pricing-doc-visual"
                                                onClick={() => setLightboxItem({ url: activeUrl, title })}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => e.key === 'Enter' && setLightboxItem({ url: activeUrl, title })}
                                            >
                                                <span className="pricing-doc-type-badge">CARTE / IMAGE</span>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={activeUrl}
                                                    alt={title || 'Grille tarifaire'}
                                                    className="pricing-doc-img"
                                                    loading="eager"
                                                />
                                                <div className="pricing-doc-overlay">
                                                    <Maximize2 size={26} />
                                                    <span>{t('tarifs.viewFullscreen')}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Content info & Action buttons */}
                                        <div className="pricing-doc-content">
                                            <h3 className="pricing-doc-title">{title}</h3>
                                            {description && (
                                                <p className="pricing-doc-desc">{description}</p>
                                            )}

                                            <div className="pricing-doc-actions">
                                                {isPdf ? (
                                                    <>
                                                        <a
                                                            href={activeUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="pricing-doc-btn pricing-doc-btn--primary"
                                                        >
                                                            <ExternalLink size={14} />
                                                            {t('tarifs.openPdf')}
                                                        </a>
                                                        <a
                                                            href={activeUrl}
                                                            download
                                                            className="pricing-doc-btn pricing-doc-btn--outline"
                                                        >
                                                            <Download size={14} />
                                                            {t('tarifs.downloadPdf')}
                                                        </a>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => setLightboxItem({ url: activeUrl, title })}
                                                            className="pricing-doc-btn pricing-doc-btn--primary"
                                                        >
                                                            <Maximize2 size={14} />
                                                            {t('tarifs.viewFullscreen')}
                                                        </button>
                                                        <a
                                                            href={activeUrl}
                                                            download
                                                            className="pricing-doc-btn pricing-doc-btn--outline"
                                                        >
                                                            <Download size={14} />
                                                            Télécharger
                                                        </a>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                            <FileText size={36} style={{ margin: '0 auto 1rem', color: 'var(--gold)', opacity: 0.6 }} />
                            <p>Les cartes et grilles tarifaires seront mises en ligne très prochainement.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* ===== SECTION 2: NOS PRESTATIONS TRAITEUR ===== */}
            {services && services.length > 0 && (
                <section id="prestations-traiteur" className="tarifs-section tarifs-section--alt">
                    <div className="container">
                        <div className="tarifs-section-header anim-up">
                            <span className="label">{t('services.badge')}</span>
                            <h2>{t('tarifs.servicesTitle')}</h2>
                            <p>{t('tarifs.servicesDesc')}</p>
                        </div>

                        <div className="services-grid">
                            {services.map((s, idx) => {
                                const badge = trans(s, 'badge');
                                return (
                                    <div key={s.id || s.num || idx} className="service-card anim-up">
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
            )}

            {/* ===== CTA SECTION ===== */}
            <section style={{ background: 'var(--bg-2)', padding: '6rem 0', borderTop: '1px solid var(--border)' }}>
                <div className="container text-center anim-up">
                    <span className="label">{t('cta.badge')}</span>
                    <h2 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                        fontWeight: '400',
                        marginTop: '1rem',
                        marginBottom: '1rem',
                    }}>
                        {t('tarifs.ctaTitle')}
                    </h2>
                    <p style={{ color: 'var(--text-2)', maxWidth: '520px', margin: '0 auto 2.5rem', fontSize: '0.95rem', lineHeight: '1.7' }}>
                        {t('tarifs.ctaDesc')}
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

            {/* ===== FULLSCREEN LIGHTBOX MODAL ===== */}
            {lightboxItem && (
                <div
                    className="pricing-lightbox"
                    onClick={() => setLightboxItem(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-label={lightboxItem.title || 'Image plein écran'}
                >
                    <button
                        type="button"
                        className="pricing-lightbox-close"
                        onClick={() => setLightboxItem(null)}
                        aria-label={t('tarifs.zoomClose')}
                    >
                        <X size={24} />
                    </button>

                    <div
                        className="pricing-lightbox-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={lightboxItem.url}
                            alt={lightboxItem.title || 'Grille tarifaire'}
                            className="pricing-lightbox-img"
                        />
                        <div className="pricing-lightbox-caption">
                            <strong>{lightboxItem.title}</strong>
                            <a
                                href={lightboxItem.url}
                                download
                                className="pricing-doc-btn pricing-doc-btn--outline"
                                style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', padding: '6px 14px' }}
                            >
                                <Download size={14} /> Télécharger
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

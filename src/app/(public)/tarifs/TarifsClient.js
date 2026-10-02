'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
    Phone, 
    ArrowRight, 
    FileText, 
    Download, 
    ExternalLink, 
    Maximize2, 
    ChevronLeft, 
    ChevronRight, 
    X 
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import '../home.css';
import './tarifs.css';

/* =====================================================
   COMPOSANT VISUEL MULTI-IMAGES / PDF
   ===================================================== */
function PricingDocVisual({ doc, title, lang, onOpenLightbox }) {
    const { t } = useLanguage();
    const activeUrl = (lang === 'en' && doc.file_url_en) ? doc.file_url_en : doc.file_url;
    const isPdf = doc.file_type === 'pdf' || (activeUrl && activeUrl.toLowerCase().endsWith('.pdf'));

    // Obtenir la liste des images pour la langue active
    const images = (lang === 'en' && doc.images_en && doc.images_en.length > 0)
        ? doc.images_en
        : ((doc.images_fr && doc.images_fr.length > 0)
            ? doc.images_fr
            : (doc.images && doc.images.length > 0
                ? doc.images
                : (activeUrl ? [{ id: 1, image_url: activeUrl }] : [])));

    const [imgIdx, setImgIdx] = useState(0);
    const [prevLang, setPrevLang] = useState(lang);
    if (prevLang !== lang) {
        setPrevLang(lang);
        setImgIdx(0);
    }
    const touchStartX = useRef(0);

    const handlePrev = (e) => {
        e.stopPropagation();
        setImgIdx(prev => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNext = (e) => {
        e.stopPropagation();
        setImgIdx(prev => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(deltaX) > 40) {
            if (deltaX > 0) {
                setImgIdx(prev => (prev === 0 ? images.length - 1 : prev - 1));
            } else {
                setImgIdx(prev => (prev === images.length - 1 ? 0 : prev + 1));
            }
        }
    };

    if (isPdf) {
        return (
            <div
                className="pricing-doc-pdf-preview"
                onClick={() => window.open(activeUrl, '_blank')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && window.open(activeUrl, '_blank')}
            >
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
        );
    }

    const currentImg = images[imgIdx]?.image_url || activeUrl;

    return (
        <div
            className="pricing-doc-visual"
            onClick={() => onOpenLightbox(images, imgIdx, title)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onOpenLightbox(images, imgIdx, title)}
            style={{ position: 'relative', overflow: 'hidden' }}
        >
            {/* Image courante */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={currentImg}
                alt={`${title || 'Tarif'} — Page ${imgIdx + 1}`}
                className="pricing-doc-img"
                loading="eager"
            />

            {/* Badge pagination si plusieurs images */}
            {images.length > 1 && (
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(14, 13, 12, 0.82)',
                    border: '1px solid rgba(200, 169, 110, 0.4)',
                    color: '#C8A96E',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backdropFilter: 'blur(6px)',
                    zIndex: 2,
                }}>
                    {imgIdx + 1} / {images.length}
                </div>
            )}

            {/* Boutons flèches si plusieurs images */}
            {images.length > 1 && (
                <>
                    <button
                        type="button"
                        onClick={handlePrev}
                        aria-label="Image précédente"
                        style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: 'rgba(14, 13, 12, 0.75)',
                            border: '1px solid rgba(200, 169, 110, 0.35)',
                            color: '#FDFBF7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 3,
                            backdropFilter: 'blur(4px)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={handleNext}
                        aria-label="Image suivante"
                        style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: 'rgba(14, 13, 12, 0.75)',
                            border: '1px solid rgba(200, 169, 110, 0.35)',
                            color: '#FDFBF7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 3,
                            backdropFilter: 'blur(4px)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <ChevronRight size={18} />
                    </button>
                </>
            )}

            {/* Overlay plein écran au survol */}
            <div className="pricing-doc-overlay">
                <Maximize2 size={24} />
                <span>{t('tarifs.viewFullscreen')}</span>
            </div>
        </div>
    );
}

/* =====================================================
   PAGE TARIFS CLIENT
   ===================================================== */
export default function TarifsClient({ siteInfo, pricingDocuments = [] }) {
    const { t, trans, lang } = useLanguage();
    const [lightbox, setLightbox] = useState(null); // { images, currentIndex, title }

    const phone = siteInfo?.phone || '07 43 64 64 11';
    const phoneTel = phone.replace(/\s+/g, '');

    const openLightbox = useCallback((images, index, title) => {
        setLightbox({
            images: images && images.length > 0 ? images : [{ image_url: '' }],
            currentIndex: index || 0,
            title: title || ''
        });
    }, []);

    const closeLightbox = useCallback(() => {
        setLightbox(null);
    }, []);

    const prevLightboxImg = useCallback(() => {
        setLightbox(prev => {
            if (!prev || prev.images.length <= 1) return prev;
            return {
                ...prev,
                currentIndex: prev.currentIndex === 0 ? prev.images.length - 1 : prev.currentIndex - 1
            };
        });
    }, []);

    const nextLightboxImg = useCallback(() => {
        setLightbox(prev => {
            if (!prev || prev.images.length <= 1) return prev;
            return {
                ...prev,
                currentIndex: prev.currentIndex === prev.images.length - 1 ? 0 : prev.currentIndex + 1
            };
        });
    }, []);

    // Clavier lightbox
    useEffect(() => {
        if (!lightbox) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') closeLightbox();
            else if (e.key === 'ArrowLeft') prevLightboxImg();
            else if (e.key === 'ArrowRight') nextLightboxImg();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightbox, closeLightbox, prevLightboxImg, nextLightboxImg]);

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

            {/* ===== SECTION: CARTES & GRILLES TARIFAIRES ===== */}
            <section id="cartes-documents" className="tarifs-section">
                <div className="container">
                    {pricingDocuments && pricingDocuments.length > 0 ? (
                        <div className="pricing-docs-grid">
                            {pricingDocuments.map((doc, idx) => {
                                const title = trans(doc, 'title');
                                const description = trans(doc, 'description');
                                const activeUrl = (lang === 'en' && doc.file_url_en) ? doc.file_url_en : doc.file_url;
                                const isPdf = doc.file_type === 'pdf' || (activeUrl && activeUrl.toLowerCase().endsWith('.pdf'));

                                const docImages = (lang === 'en' && doc.images_en && doc.images_en.length > 0)
                                    ? doc.images_en
                                    : ((doc.images_fr && doc.images_fr.length > 0)
                                        ? doc.images_fr
                                        : [{ id: 1, image_url: activeUrl }]);

                                return (
                                    <div key={doc.id || idx} className="pricing-doc-card anim-up">
                                        {/* Visualisation multi-images ou PDF */}
                                        <PricingDocVisual
                                            doc={doc}
                                            title={title}
                                            lang={lang}
                                            onOpenLightbox={openLightbox}
                                        />

                                        {/* Contenu textuel & Actions */}
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
                                                            onClick={() => openLightbox(docImages, 0, title)}
                                                            className="pricing-doc-btn pricing-doc-btn--primary"
                                                        >
                                                            <Maximize2 size={14} />
                                                            {docImages.length > 1 ? `Voir les ${docImages.length} photos` : t('tarifs.viewFullscreen')}
                                                        </button>
                                                        <a
                                                            href={docImages[0]?.image_url || activeUrl}
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
                        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                            <FileText size={40} style={{ margin: '0 auto 1rem', color: 'var(--gold)', opacity: 0.6 }} />
                            <p>Les cartes et grilles tarifaires seront mises en ligne très prochainement.</p>
                        </div>
                    )}
                </div>
            </section>

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

            {/* ===== FULLSCREEN LIGHTBOX MODAL MULTI-IMAGES ===== */}
            {lightbox && (
                <div
                    className="pricing-lightbox"
                    onClick={closeLightbox}
                    role="dialog"
                    aria-modal="true"
                    aria-label={lightbox.title || 'Image plein écran'}
                >
                    <button
                        type="button"
                        className="pricing-lightbox-close"
                        onClick={closeLightbox}
                        aria-label={t('tarifs.zoomClose')}
                    >
                        <X size={24} />
                    </button>

                    {/* Flèches de navigation lightbox si plusieurs images */}
                    {lightbox.images.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); prevLightboxImg(); }}
                                aria-label="Image précédente"
                                style={{
                                    position: 'absolute',
                                    left: '20px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '46px',
                                    height: '46px',
                                    borderRadius: '50%',
                                    background: 'rgba(14, 13, 12, 0.8)',
                                    border: '1px solid rgba(200, 169, 110, 0.4)',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    zIndex: 100,
                                }}
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); nextLightboxImg(); }}
                                aria-label="Image suivante"
                                style={{
                                    position: 'absolute',
                                    right: '20px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '46px',
                                    height: '46px',
                                    borderRadius: '50%',
                                    background: 'rgba(14, 13, 12, 0.8)',
                                    border: '1px solid rgba(200, 169, 110, 0.4)',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    zIndex: 100,
                                }}
                            >
                                <ChevronRight size={24} />
                            </button>
                        </>
                    )}

                    <div
                        className="pricing-lightbox-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={lightbox.images[lightbox.currentIndex]?.image_url || ''}
                            alt={`${lightbox.title || 'Tarif'} — ${lightbox.currentIndex + 1}`}
                            className="pricing-lightbox-img"
                        />
                        <div className="pricing-lightbox-caption">
                            <div>
                                <strong>{lightbox.title}</strong>
                                {lightbox.images.length > 1 && (
                                    <span style={{ marginLeft: '10px', color: '#C8A96E', fontSize: '0.85rem' }}>
                                        ({lightbox.currentIndex + 1} / {lightbox.images.length})
                                    </span>
                                )}
                            </div>
                            <a
                                href={lightbox.images[lightbox.currentIndex]?.image_url || ''}
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

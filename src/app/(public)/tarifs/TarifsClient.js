'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
function PricingDocVisual({ doc, title, lang, imgIdx = 0, onIndexChange, onOpenLightbox, isActive, onActivate }) {
    const { t } = useLanguage();
    const activeUrl = (lang === 'en' && doc.file_url_en) ? doc.file_url_en : doc.file_url;
    const isPdf = doc.file_type === 'pdf' || (activeUrl && activeUrl.toLowerCase().endsWith('.pdf'));

    // Obtenir la liste des images pour la langue active
    const images = useMemo(() => {
        if (lang === 'en') {
            if (doc.images_en && doc.images_en.length > 0) return doc.images_en;
            if (doc.file_url_en) return [{ id: 'doc-en', image_url: doc.file_url_en }];
            if (doc.images_fr && doc.images_fr.length > 0) return doc.images_fr;
            if (doc.images && doc.images.length > 0) return doc.images;
            if (doc.file_url) return [{ id: 'doc-default', image_url: doc.file_url }];
            return [];
        }
        // Français / par défaut
        if (doc.images_fr && doc.images_fr.length > 0) return doc.images_fr;
        if (doc.images && doc.images.length > 0) return doc.images;
        if (doc.file_url) return [{ id: 'doc-fr', image_url: doc.file_url }];
        if (doc.images_en && doc.images_en.length > 0) return doc.images_en;
        return [];
    }, [doc, lang]);

    const touchStartX = useRef(0);

    // Préchargement immédiat de toutes les images pour une navigation fluide sans délai
    useEffect(() => {
        if (typeof window === 'undefined' || !images || images.length <= 1) return;
        images.forEach(img => {
            const src = img?.image_url;
            if (src) {
                const preload = new window.Image();
                preload.src = src;
            }
        });
    }, [images]);

    const handlePrev = useCallback((e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (images.length <= 1) return;
        const nextIdx = imgIdx === 0 ? images.length - 1 : imgIdx - 1;
        onIndexChange?.(nextIdx);
    }, [images.length, imgIdx, onIndexChange]);

    const handleNext = useCallback((e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (images.length <= 1) return;
        const nextIdx = imgIdx === images.length - 1 ? 0 : imgIdx + 1;
        onIndexChange?.(nextIdx);
    }, [images.length, imgIdx, onIndexChange]);

    // Navigation clavier avec les flèches gauche et droite
    useEffect(() => {
        if (!isActive || images.length <= 1) return;

        const handleKeyDown = (e) => {
            const target = e.target;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
                return;
            }

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handlePrev();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, images.length, handlePrev, handleNext]);

    const handleTouchStart = (e) => {
        if (e.touches?.[0]) touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
        const touchEnd = e.changedTouches?.[0]?.clientX;
        if (!touchEnd || !touchStartX.current) return;
        const deltaX = touchStartX.current - touchEnd;
        if (Math.abs(deltaX) > 30) {
            if (deltaX > 0) {
                handleNext();
            } else {
                handlePrev();
            }
        }
        touchStartX.current = 0;
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
            className={`pricing-doc-visual ${isActive ? 'is-active' : ''}`}
            onClick={() => onOpenLightbox(images, imgIdx, title)}
            onMouseEnter={onActivate}
            onFocus={onActivate}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenLightbox(images, imgIdx, title);
                }
            }}
            style={{ position: 'relative', overflow: 'hidden' }}
        >
            {/* Image courante */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={currentImg}
                alt={`${title || 'Tarif'} - Page ${imgIdx + 1}`}
                className="pricing-doc-img"
                loading="eager"
            />

            {/* Badge pagination & Indicateur flèches clavier */}
            {images.length > 1 && (
                <div className="pricing-doc-badge-group">
                    <div className="pricing-doc-page-badge">
                        {imgIdx + 1} / {images.length}
                    </div>
                    <div className="pricing-kbd-badge" title={lang === 'en' ? 'Use keyboard arrows ← → to flip photos' : 'Utilisez les flèches du clavier ← → pour faire défiler les photos'}>
                        <span className="pricing-kbd-key">←</span>
                        <span className="pricing-kbd-key">→</span>
                    </div>
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

            {/* Pagination par points (dots) cliquables */}
            {images.length > 1 && (
                <div className="pricing-doc-dots" onClick={(e) => e.stopPropagation()}>
                    {images.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            className={`pricing-doc-dot ${i === imgIdx ? 'active' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onIndexChange?.(i);
                            }}
                            aria-label={`Photo ${i + 1}`}
                        />
                    ))}
                </div>
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
    const [activeDocIdx, setActiveDocIdx] = useState(0);
    const [docImageIndices, setDocImageIndices] = useState({});
    const [prevLang, setPrevLang] = useState(lang);
    if (prevLang !== lang) {
        setPrevLang(lang);
        setDocImageIndices({});
    }
    const lightboxTouchStartX = useRef(0);

    const handleDocIndexChange = useCallback((docKey, newIdx) => {
        setDocImageIndices(prev => {
            if (prev[docKey] === newIdx) return prev;
            return { ...prev, [docKey]: newIdx };
        });
    }, []);

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

    // Clavier lightbox (Échap pour fermer, flèches gauche / droite pour naviguer)
    useEffect(() => {
        if (!lightbox) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                closeLightbox();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevLightboxImg();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                nextLightboxImg();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightbox, closeLightbox, prevLightboxImg, nextLightboxImg]);

    // Touch swipe lightbox sur mobile/tablette
    const handleLightboxTouchStart = (e) => {
        if (e.touches?.[0]) lightboxTouchStartX.current = e.touches[0].clientX;
    };
    const handleLightboxTouchEnd = (e) => {
        const touchEnd = e.changedTouches?.[0]?.clientX;
        if (!touchEnd || !lightboxTouchStartX.current) return;
        const deltaX = lightboxTouchStartX.current - touchEnd;
        if (Math.abs(deltaX) > 35) {
            if (deltaX > 0) nextLightboxImg();
            else prevLightboxImg();
        }
        lightboxTouchStartX.current = 0;
    };

    return (
        <main id="main-content" tabIndex="-1" className="tarifs-page subpage-main">
            {/* ===== EN-TÊTE DE PAGE ===== */}
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

                                const docImages = (lang === 'en')
                                    ? ((doc.images_en && doc.images_en.length > 0)
                                        ? doc.images_en
                                        : (doc.file_url_en ? [{ id: 'doc-en', image_url: doc.file_url_en }] : (doc.images_fr || [])))
                                    : ((doc.images_fr && doc.images_fr.length > 0)
                                        ? doc.images_fr
                                        : (doc.file_url ? [{ id: 'doc-fr', image_url: doc.file_url }] : (doc.images_en || [])));

                                const currentDocIndex = docImageIndices[doc.id || idx] || 0;
                                const isKeyboardActive = !lightbox && (activeDocIdx === idx);

                                return (
                                    <div
                                        key={doc.id || idx}
                                        className={`pricing-doc-card anim-up ${isKeyboardActive ? 'is-keyboard-active' : ''}`}
                                        onMouseEnter={() => setActiveDocIdx(idx)}
                                    >
                                        {/* Visualisation multi-images ou PDF */}
                                        <PricingDocVisual
                                            doc={doc}
                                            title={title}
                                            lang={lang}
                                            imgIdx={currentDocIndex}
                                            isActive={isKeyboardActive}
                                            onActivate={() => setActiveDocIdx(idx)}
                                            onIndexChange={(newIdx) => handleDocIndexChange(doc.id || idx, newIdx)}
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
                                                            onClick={() => openLightbox(docImages, currentDocIndex, title)}
                                                            className="pricing-doc-btn pricing-doc-btn--primary"
                                                        >
                                                            <Maximize2 size={14} />
                                                            {docImages.length > 1 ? `Voir les ${docImages.length} photos` : t('tarifs.viewFullscreen')}
                                                        </button>
                                                        <a
                                                            href={docImages[currentDocIndex]?.image_url || activeUrl}
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

            {/* ===== SECTION APPEL À L'ACTION ===== */}
            <section style={{ background: 'var(--bg-2)', padding: '4rem 0', borderTop: '1px solid var(--border)' }}>
                <div className="container text-center anim-up">
                    <h2 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                        fontWeight: '400',
                        marginTop: '0',
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

            {/* ===== FENÊTRE PLEIN ÉCRAN (LIGHTBOX) MULTI-IMAGES ===== */}
            {lightbox && (
                <div
                    className="pricing-lightbox"
                    onClick={closeLightbox}
                    onTouchStart={handleLightboxTouchStart}
                    onTouchEnd={handleLightboxTouchEnd}
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
                            alt={`${lightbox.title || 'Tarif'} - ${lightbox.currentIndex + 1}`}
                            className="pricing-lightbox-img"
                        />

                        {/* Points de pagination cliquables dans la lightbox */}
                        {lightbox.images.length > 1 && (
                            <div className="pricing-lightbox-dots">
                                {lightbox.images.map((_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        className={`pricing-lightbox-dot ${i === lightbox.currentIndex ? 'active' : ''}`}
                                        onClick={() => setLightbox(prev => ({ ...prev, currentIndex: i }))}
                                        aria-label={`Photo ${i + 1}`}
                                    />
                                ))}
                            </div>
                        )}

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

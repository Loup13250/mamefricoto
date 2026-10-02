'use client';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import './WeeklyMenuCarousel.css';

function isVideoUrl(url) {
    if (!url) return false;
    return /\.(mp4|mov|webm|ogg)(\?.*)?$/i.test(url);
}

export default function WeeklyMenuCarousel({ menu, siteInfo }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [arrowsVisible, setArrowsVisible] = useState(true);
    const touchStartX = useRef(0);
    const hideTimerRef = useRef(null);
    const { t, trans, lang } = useLanguage();

    const [prevLang, setPrevLang] = useState(lang);
    if (prevLang !== lang) {
        setPrevLang(lang);
        setCurrentIndex(0);
    }

    const images = useMemo(() => {
        if (!menu) return [];
        if (lang === 'en' && menu.images_en && menu.images_en.length > 0) return menu.images_en;
        if (menu.images_fr && menu.images_fr.length > 0) return menu.images_fr;
        if (menu.images && menu.images.length > 0) return menu.images;
        if (menu.image_url) return [{ id: 0, image_url: menu.image_url }];
        return [];
    }, [menu, lang]);

    const triggerArrowVisibility = useCallback(() => {
        setArrowsVisible(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
            setArrowsVisible(false);
        }, 2200);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => triggerArrowVisibility(), 0);
        return () => {
            clearTimeout(timer);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, [currentIndex, triggerArrowVisibility]);

    const handlePrev = useCallback(() => {
        if (images.length <= 1) return;
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
        triggerArrowVisibility();
    }, [images.length, triggerArrowVisibility]);

    const handleNext = useCallback(() => {
        if (images.length <= 1) return;
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        triggerArrowVisibility();
    }, [images.length, triggerArrowVisibility]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') handleNext();
            else if (e.key === 'ArrowLeft') handlePrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNext, handlePrev]);

    const handleTouchStart = (e) => {
        if (e.touches?.[0]) touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
        const touchEnd = e.changedTouches?.[0]?.clientX;
        if (!touchEnd || !touchStartX.current) return;
        const diff = touchStartX.current - touchEnd;
        if (Math.abs(diff) > 20) {
            if (diff > 0) handleNext();
            else handlePrev();
        }
        touchStartX.current = 0;
    };

    // Preload all carousel images immediately on mount so first slide transition is 100% instant
    useEffect(() => {
        if (typeof window === 'undefined') return;
        images.forEach((item) => {
            const src = item?.image_url;
            if (src && !isVideoUrl(src)) {
                const img = new window.Image();
                img.src = src;
            }
        });
    }, [images]);

    if (!menu) return null;

    return (
        <div className="menu-card anim-up" role="region" aria-label="Menu de la semaine">
            {/* Left: Media */}
            <div
                className="menu-media"
                onClick={() => {
                    if (images.length > 1) handleNext();
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {images.length > 0 ? (
                    <div className="menu-slides-container">
                        {images.map((item, idx) => {
                            const mediaUrl = item.image_url || menu.image_url;
                            const isVid = isVideoUrl(mediaUrl) || item.media_type === 'video';
                            const isActive = idx === currentIndex;
                            return (
                                <div
                                    key={item.id || idx}
                                    className={`menu-slide ${isActive ? 'active' : ''}`}
                                    aria-hidden={!isActive}
                                >
                                    {isVid ? (
                                        <video
                                            src={mediaUrl}
                                            controls={isActive}
                                            autoPlay={isActive}
                                            loop
                                            muted
                                            playsInline
                                            className="menu-img"
                                        />
                                    ) : (
                                        <Image
                                            src={mediaUrl}
                                            alt={`${menu.title} — photo ${idx + 1} sur ${images.length || 1}`}
                                            width={900}
                                            height={1100}
                                            className="menu-img"
                                            style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block' }}
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                                            priority={idx === 0}
                                            loading="eager"
                                            unoptimized
                                            draggable={false}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="menu-placeholder">
                        <p>Menu de la semaine</p>
                    </div>
                )}

                {/* Counter */}
                {images.length > 1 && (
                    <div className="menu-counter" aria-live="polite">{currentIndex + 1} / {images.length}</div>
                )}

                {/* Arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            type="button"
                            className={`menu-arrow menu-arrow-left ${arrowsVisible ? 'visible' : ''}`}
                            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                            aria-label={t('menu.prevDish')}
                        >
                            <ChevronLeft size={22} />
                        </button>
                        <button
                            type="button"
                            className={`menu-arrow menu-arrow-right ${arrowsVisible ? 'visible' : ''}`}
                            onClick={(e) => { e.stopPropagation(); handleNext(); }}
                            aria-label={t('menu.nextDish')}
                        >
                            <ChevronRight size={22} />
                        </button>
                    </>
                )}

                {/* Dots */}
                {images.length > 1 && (
                    <div className="menu-dots" role="tablist" aria-label="Sélection du plat">
                        {images.map((img, idx) => (
                            <button
                                key={img.id || idx}
                                type="button"
                                role="tab"
                                aria-selected={idx === currentIndex}
                                className={`menu-dot ${idx === currentIndex ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                                aria-label={`Plat ${idx + 1} sur ${images.length}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Right: Info */}
            <div className="menu-sidebar">
                <p className="menu-sidebar-label">{t('menu.label')}</p>
                <h3 className="menu-title">{trans(menu, 'title')}</h3>
                {trans(menu, 'description') && (
                    <p className="menu-description">{trans(menu, 'description')}</p>
                )}
                <p className="menu-order-note">
                    {t('menu.orderPhone', { phone: siteInfo?.phone || '07 43 64 64 11' })} &mdash; {t('menu.orderHint')}
                </p>
                <div className="menu-cta-group">
                    <a href={`tel:${(siteInfo?.phone || '07 43 64 64 11').replace(/\s+/g, '')}`} className="menu-cta-btn menu-cta-btn--primary">
                        <Phone size={15} />
                        <span>{t('menu.orderBtn')}</span>
                    </a>
                    <Link href="/tarifs" className="menu-cta-btn menu-cta-btn--secondary">
                        <span>{t('menu.tarifsBtn')}</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import './HeroCarousel.css';

export default function HeroCarousel({ slides = [], siteInfo }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStartX, setTouchStartX] = useState(null);
    const [touchStartY, setTouchStartY] = useState(null);
    const { t, trans } = useLanguage();
    const timerRef = useRef(null);

    const phone = siteInfo?.phone || '07 43 64 64 11';
    const phoneTel = phone.replace(/\s+/g, '');

    const hasSlides = Array.isArray(slides) && slides.length > 0;
    const slidesCount = hasSlides ? slides.length : 0;

    const handleNext = useCallback(() => {
        if (slidesCount <= 1) return;
        setCurrentIndex((prev) => (prev === slidesCount - 1 ? 0 : prev + 1));
    }, [slidesCount]);

    const handlePrev = useCallback(() => {
        if (slidesCount <= 1) return;
        setCurrentIndex((prev) => (prev === 0 ? slidesCount - 1 : prev - 1));
    }, [slidesCount]);

    // Continuous Autoplay: cycles every 5.5s reliably across all devices and Mac/Safari
    useEffect(() => {
        if (slidesCount <= 1) return;

        timerRef.current = setInterval(() => {
            handleNext();
        }, 5500);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [handleNext, slidesCount, currentIndex]);

    const handleTouchStart = (e) => {
        setTouchStartX(e.touches[0].clientX);
        setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchEnd = (e) => {
        if (touchStartX === null || touchStartY === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;

        // Trigger slide swap if horizontal swipe is dominant and exceeds 35px
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
            if (diffX > 0) {
                handleNext();
            } else {
                handlePrev();
            }
        }

        setTouchStartX(null);
        setTouchStartY(null);
    };

    if (!hasSlides) return null;

    const currentSlide = slides[currentIndex];
    const slideTitle = currentSlide ? trans(currentSlide, 'title') : '';
    const slideSubtitle = currentSlide ? trans(currentSlide, 'subtitle') : '';

    return (
        <section
            className="hero"
            aria-label="Bannières de présentation"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div className="hero-track">
                {slides.map((slide, index) => {
                    const isActive = index === currentIndex;
                    return (
                        <div
                            key={slide.id || index}
                            className={`hero-slide ${isActive ? 'active' : ''}`}
                            aria-hidden={!isActive}
                        >
                            {/* Desktop Image Layer */}
                            <div className={`hero-slide-layer hero-layer-desktop ${slide.mobile_image_url ? 'has-mobile-alt' : ''}`}>
                                <Image
                                    src={slide.image_url}
                                    alt={trans(slide, 'title') || 'Traiteur Maison Mamé Fricoto à Eyguières'}
                                    fill
                                    sizes="100vw"
                                    priority={index < 2}
                                    fetchPriority={index === 0 ? 'high' : 'auto'}
                                    loading={index < 2 ? 'eager' : 'lazy'}
                                    unoptimized
                                />
                            </div>

                            {/* Mobile Specific Image Layer */}
                            {slide.mobile_image_url && (
                                <div className="hero-slide-layer hero-layer-mobile">
                                    <Image
                                        src={slide.mobile_image_url}
                                        alt={trans(slide, 'title') || 'Traiteur Maison Mamé Fricoto à Eyguières'}
                                        fill
                                        sizes="100vw"
                                        priority={index < 2}
                                        fetchPriority={index < 2 ? 'high' : 'auto'}
                                        loading={index < 2 ? 'eager' : 'lazy'}
                                        unoptimized
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="hero-content container">
                <div className="hero-content-inner anim-up">
                    <p className="hero-eyebrow">{t('hero.eyebrow')}</p>
                    <h1 className="hero-title">
                        {slideTitle || (<><em>Mamé Fricoto</em><br />{t('hero.defaultSubtitle')}</>)}
                    </h1>
                    {slideSubtitle && (
                        <p className="hero-subtitle">{slideSubtitle}</p>
                    )}
                    <div className="hero-actions">
                        <a href="#menu-semaine" className="btn-gold hero-btn-menu">
                            {t('hero.viewMenu')}
                        </a>
                        <Link href="/tarifs" className="btn-outline hero-btn-tarifs" aria-label={t('hero.viewTarifs')}>
                            <span>{t('hero.viewTarifs')}</span>
                        </Link>
                    </div>
                </div>
            </div>

            {slidesCount > 1 && (
                <>
                    <div className="hero-arrows">
                        <button type="button" onClick={handlePrev} className="hero-arrow" aria-label={t('hero.prev')}>
                            <ChevronLeft size={22} />
                        </button>
                        <button type="button" onClick={handleNext} className="hero-arrow" aria-label={t('hero.next')}>
                            <ChevronRight size={22} />
                        </button>
                    </div>
                    <div className="hero-dots" role="tablist" aria-label="Sélection des diapositives">
                        {slides.map((_, idx) => (
                            <button
                                key={idx}
                                type="button"
                                role="tab"
                                aria-selected={idx === currentIndex}
                                onClick={() => setCurrentIndex(idx)}
                                className={`hero-dot ${idx === currentIndex ? 'active' : ''}`}
                                aria-label={`Diapositive ${idx + 1} sur ${slidesCount}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}

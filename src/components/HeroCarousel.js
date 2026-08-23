'use client';
import { useState, useEffect } from 'react';
import { Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import './HeroCarousel.css';

export default function HeroCarousel({ slides, siteInfo }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [touchStartX, setTouchStartX] = useState(null);
    const [touchStartY, setTouchStartY] = useState(null);

    const phone = siteInfo?.phone || '07 43 64 64 11';
    const phoneTel = phone.replace(/\s+/g, '');

    if (!slides || slides.length === 0) return null;

    useEffect(() => {
        if (isHovered || slides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
        }, 6000);
        return () => clearInterval(timer);
    }, [isHovered, slides.length]);

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    };

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

    const [loadOthers, setLoadOthers] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setLoadOthers(true), 2500);
        return () => clearTimeout(timer);
    }, []);

    const triggerLoadOthers = () => {
        if (!loadOthers) setLoadOthers(true);
    };

    return (
        <section
            className="hero"
            aria-label="Bannières de présentation"
            onMouseEnter={() => { setIsHovered(true); triggerLoadOthers(); }}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={(e) => { handleTouchStart(e); triggerLoadOthers(); }}
            onTouchEnd={handleTouchEnd}
        >
            <div className="hero-track">
                {slides.map((slide, index) => {
                    const shouldRenderImage = index === 0 || loadOthers || Math.abs(index - currentIndex) <= 1;
                    return (
                        <div
                            key={slide.id || index}
                            className={`hero-slide ${index === currentIndex ? 'active' : ''}`}
                        >
                            {shouldRenderImage && (
                                <>
                                    {/* Desktop Image Layer */}
                                    <div className={`hero-slide-layer hero-layer-desktop ${slide.mobile_image_url ? 'has-mobile-alt' : ''}`}>
                                        <Image
                                            src={slide.image_url}
                                            alt={slide.title || 'Traiteur Maison Mamé Fricoto à Eyguières'}
                                            fill
                                            sizes="100vw"
                                            priority={index === 0}
                                            fetchPriority={index === 0 ? 'high' : 'low'}
                                            loading={index === 0 ? 'eager' : 'lazy'}
                                            unoptimized
                                        />
                                    </div>

                                    {/* Mobile Specific Image Layer */}
                                    {slide.mobile_image_url && (
                                        <div className="hero-slide-layer hero-layer-mobile">
                                            <Image
                                                src={slide.mobile_image_url}
                                                alt={slide.title || 'Traiteur Maison Mamé Fricoto à Eyguières'}
                                                fill
                                                sizes="100vw"
                                                priority={index === 0}
                                                fetchPriority={index === 0 ? 'high' : 'low'}
                                                loading={index === 0 ? 'eager' : 'lazy'}
                                                unoptimized
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="hero-content container">
                <div className="hero-content-inner anim-up">
                    <p className="hero-eyebrow">Traiteur Maison · Eyguières</p>
                    <h1 className="hero-title">
                        {slides[currentIndex]?.title || (<><em>Mamé Fricoto</em><br />Cuisine Maison</>)}
                    </h1>
                    {slides[currentIndex]?.subtitle && (
                        <p className="hero-subtitle">{slides[currentIndex].subtitle}</p>
                    )}
                    <div className="hero-actions">
                        <a href="#menu-semaine" className="btn-gold hero-btn-menu">
                            Voir le menu
                        </a>
                        <a href={`tel:${phoneTel}`} className="btn-outline hero-btn-phone" aria-label={`Appeler le ${phone}`}>
                            <Phone size={16} />
                            <span>{phone}</span>
                        </a>
                    </div>
                </div>
            </div>

            {slides.length > 1 && (
                <>
                    <div className="hero-arrows">
                        <button type="button" onClick={handlePrev} className="hero-arrow" aria-label="Diapositive précédente">
                            <ChevronLeft size={22} />
                        </button>
                        <button type="button" onClick={handleNext} className="hero-arrow" aria-label="Diapositive suivante">
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
                                aria-label={`Diapositive ${idx + 1} sur ${slides.length}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}

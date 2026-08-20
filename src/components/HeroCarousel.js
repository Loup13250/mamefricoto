'use client';
import { useState, useEffect } from 'react';
import { Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import './HeroCarousel.css';

export default function HeroCarousel({ slides, siteInfo }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

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

    // Preload ALL hero slide images in background immediately on mount
    useEffect(() => {
        if (!slides || slides.length <= 1) return;
        slides.forEach((slide) => {
            if (slide?.image_url) {
                const imgLoader = new window.Image();
                imgLoader.src = slide.image_url;
            }
        });
    }, [slides]);

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    };

    return (
        <section
            className="hero"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="hero-track">
                {slides.map((slide, index) => (
                    <div
                        key={slide.id || index}
                        className={`hero-slide ${index === currentIndex ? 'active' : ''}`}
                    >
                        {/* Desktop Image Layer */}
                        <div className={`hero-slide-layer hero-layer-desktop ${slide.mobile_image_url ? 'has-mobile-alt' : ''}`}>
                            <Image
                                src={slide.image_url}
                                alt={slide.title || 'Bannière Mamé Fricoto'}
                                fill
                                sizes="100vw"
                                priority={index === 0}
                                loading={index === 0 ? 'eager' : 'lazy'}
                                quality={95}
                                unoptimized
                            />
                        </div>

                        {/* Mobile Specific Image Layer */}
                        {slide.mobile_image_url && (
                            <div className="hero-slide-layer hero-layer-mobile">
                                <Image
                                    src={slide.mobile_image_url}
                                    alt={slide.title || 'Bannière Mamé Fricoto (mobile)'}
                                    fill
                                    sizes="100vw"
                                    priority={index === 0}
                                    loading={index === 0 ? 'eager' : 'lazy'}
                                    quality={95}
                                    unoptimized
                                />
                            </div>
                        )}
                    </div>
                ))}
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
                        <a href="#menu-semaine" className="btn-gold">
                            Voir le menu
                        </a>
                        <a href={`tel:${phoneTel}`} className="btn-outline">
                            <Phone size={15} />
                            {phone}
                        </a>
                    </div>
                </div>
            </div>

            {slides.length > 1 && (
                <>
                    <div className="hero-arrows">
                        <button type="button" onClick={handlePrev} className="hero-arrow" aria-label="Précédent">
                            <ChevronLeft size={20} />
                        </button>
                        <button type="button" onClick={handleNext} className="hero-arrow" aria-label="Suivant">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <div className="hero-dots">
                        {slides.map((_, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setCurrentIndex(idx)}
                                className={`hero-dot ${idx === currentIndex ? 'active' : ''}`}
                                aria-label={`Bannière ${idx + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}

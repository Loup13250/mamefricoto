'use client';
import { useState, useEffect } from 'react';
import { Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import './HeroCarousel.css';

export default function HeroCarousel({ slides }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    if (!slides || slides.length === 0) return null;

    useEffect(() => {
        if (isHovered || slides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
        }, 5000); // Auto slide every 5 seconds

        return () => clearInterval(timer);
    }, [isHovered, slides.length]);

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
            <div className="hero-carousel">
                {slides.map((slide, index) => (
                    <div
                        key={slide.id || index}
                        className={`hero-slide ${index === currentIndex ? 'active' : ''}`}
                        style={{
                            backgroundImage: `linear-gradient(rgba(30, 45, 68, 0.55), rgba(30, 45, 68, 0.7)), url(${slide.image_url})`
                        }}
                    >
                        <div className="hero-content animate-fade-up">
                            <h1 className="hero-title">{slide.title}</h1>
                            {slide.subtitle && <p className="hero-subtitle">{slide.subtitle}</p>}
                            <div className="hero-actions" style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <a href="#menu-semaine" className="hero-discover-btn">
                                    Découvrir le Menu
                                </a>
                                <a href="tel:0743646411" className="hero-phone-btn">
                                    <Phone size={18} />
                                    07 43 64 64 11
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Slider Controls */}
            {slides.length > 1 && (
                <>
                    <button type="button" onClick={handlePrev} className="hero-arrow hero-arrow-left" aria-label="Bannière précédente">
                        <ChevronLeft size={24} />
                    </button>
                    <button type="button" onClick={handleNext} className="hero-arrow hero-arrow-right" aria-label="Bannière suivante">
                        <ChevronRight size={24} />
                    </button>
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

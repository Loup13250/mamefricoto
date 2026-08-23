'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Phone, FileText } from 'lucide-react';
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

    const triggerArrowVisibility = useCallback(() => {
        setArrowsVisible(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
            setArrowsVisible(false);
        }, 2200);
    }, []);

    useEffect(() => {
        triggerArrowVisibility();
        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, [currentIndex, triggerArrowVisibility]);

    if (!menu) return null;

    const images = menu.images && menu.images.length > 0
        ? menu.images
        : (menu.image_url ? [{ id: 0, image_url: menu.image_url }] : []);

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

    const currentMedia = images[currentIndex]?.image_url || menu.image_url;
    const isVideo = isVideoUrl(currentMedia) || images[currentIndex]?.media_type === 'video';

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
                {currentMedia ? (
                    isVideo ? (
                        <video
                            src={currentMedia}
                            controls
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="menu-img"
                        />
                    ) : (
                        <Image
                            src={currentMedia}
                            alt={`${menu.title} — photo ${currentIndex + 1} sur ${images.length || 1}`}
                            width={900}
                            height={1100}
                            className="menu-img"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                            loading="lazy"
                            quality={80}
                            draggable={false}
                        />
                    )
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
                            aria-label="Plat précédent"
                        >
                            <ChevronLeft size={22} />
                        </button>
                        <button
                            type="button"
                            className={`menu-arrow menu-arrow-right ${arrowsVisible ? 'visible' : ''}`}
                            onClick={(e) => { e.stopPropagation(); handleNext(); }}
                            aria-label="Plat suivant"
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
                <p className="menu-sidebar-label">Menu de la semaine</p>
                <h3 className="menu-title">{menu.title}</h3>
                {menu.description && (
                    <p className="menu-description">{menu.description}</p>
                )}
                <p className="menu-order-note">
                    Commandes au {siteInfo?.phone || '07 43 64 64 11'} &mdash; Retrait au labo à Eyguières ou livraison à domicile.
                </p>
                <div className="menu-cta-group">
                    <a href={`tel:${(siteInfo?.phone || '07 43 64 64 11').replace(/\s+/g, '')}`} className="btn-terra menu-cta-btn">
                        <Phone size={16} />
                        Commander par téléphone
                    </a>
                    <Link href="/contact" className="btn-outline menu-cta-btn">
                        <FileText size={16} />
                        Demander un devis
                    </Link>
                </div>
            </div>
        </div>
    );
}

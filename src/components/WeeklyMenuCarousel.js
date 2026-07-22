'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Phone, Instagram, Heart, Share2, MessageCircle, CheckCircle2, MapPin } from 'lucide-react';
import './WeeklyMenuCarousel.css';

export default function WeeklyMenuCarousel({ menu, siteInfo }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(54);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    if (!menu) return null;

    const images = menu.images && menu.images.length > 0 ? menu.images : (menu.image_url ? [{ id: 0, image_url: menu.image_url }] : []);

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    // Touch Swipe handlers for mobile
    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;
        const diff = touchStartX.current - touchEndX.current;
        if (diff > 50) {
            handleNext(); // Swipe left -> Next image
        } else if (diff < -50) {
            handlePrev(); // Swipe right -> Prev image
        }
        touchStartX.current = 0;
        touchEndX.current = 0;
    };

    const toggleLike = () => {
        setLiked(!liked);
        setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    };

    return (
        <div className="insta-post-card animate-fade-up">
            {/* Left Column: Image Carousel */}
            <div
                className="insta-post-media"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="insta-media-wrapper">
                    <Image
                        src={images[currentIndex]?.image_url || menu.image_url}
                        alt={`${menu.title} - Photo ${currentIndex + 1}`}
                        width={900}
                        height={1125}
                        className="insta-post-img"
                        priority
                        unoptimized
                    />
                </div>

                {images.length > 1 && (
                    <div className="insta-post-counter">
                        {currentIndex + 1}/{images.length}
                    </div>
                )}

                {images.length > 1 && (
                    <>
                        <button type="button" onClick={handlePrev} className="insta-post-arrow arrow-left" aria-label="Photo précédente">
                            <ChevronLeft size={20} />
                        </button>
                        <button type="button" onClick={handleNext} className="insta-post-arrow arrow-right" aria-label="Photo suivante">
                            <ChevronRight size={20} />
                        </button>
                    </>
                )}

                {images.length > 1 && (
                    <div className="insta-post-dots">
                        {images.map((img, idx) => (
                            <button
                                key={img.id || idx}
                                type="button"
                                onClick={() => setCurrentIndex(idx)}
                                className={`insta-post-dot ${idx === currentIndex ? 'active' : ''}`}
                                aria-label={`Photo ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Right Column: Profile Header, Caption, Likes & CTA */}
            <div className="insta-post-sidebar">
                {/* Profile Header */}
                <div className="insta-post-header">
                    <div className="insta-post-avatar-box">
                        <Image src="/logo.png" alt="Mamé Fricoto" width={42} height={42} className="insta-post-avatar" />
                    </div>
                    <div className="insta-post-user-meta">
                        <div className="insta-post-username-row">
                            <span className="insta-post-username">mamefricoto</span>
                            <CheckCircle2 size={15} className="verified-badge" />
                            <span className="dot-separator">•</span>
                            <a href={siteInfo?.instagram || "https://www.instagram.com/mamefricoto/"} target="_blank" rel="noopener noreferrer" className="follow-btn">
                                Suivre
                            </a>
                        </div>
                        <span className="insta-post-location">
                            <MapPin size={12} style={{ display: 'inline', marginRight: '3px' }} />
                            Eyguières · Cuisine Maison
                        </span>
                    </div>
                </div>

                {/* Caption Text Box */}
                <div className="insta-post-caption-box">
                    <div className="caption-entry">
                        <span className="caption-user">mamefricoto</span>
                        <div className="caption-body">
                            <p>{menu.title}</p>
                            {menu.description && <p style={{ marginTop: '0.5rem' }}>{menu.description}</p>}
                            <p style={{ marginTop: '0.75rem', color: '#6B5B50', fontSize: '0.9rem' }}>
                                Commandes au 07 43 64 64 11 · Retrait au labo à Eyguières ou livraison.
                            </p>
                            <span className="caption-hashtags">#mamefricoto #traiteur #eyguières #cuisinemaison #platdujour</span>
                        </div>
                    </div>
                </div>

                {/* Actions & Likes Bar */}
                <div className="insta-post-footer">
                    <div className="insta-post-actions">
                        <div className="actions-left">
                            <button type="button" onClick={toggleLike} className={`action-icon-btn ${liked ? 'liked' : ''}`} aria-label="J'aime">
                                <Heart size={24} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : 'currentColor'} />
                            </button>
                            <a href="tel:0743646411" className="action-icon-btn" title="Appeler pour commander">
                                <MessageCircle size={24} />
                            </a>
                            <a href={menu.embed_url || siteInfo?.instagram || "https://www.instagram.com/mamefricoto/"} target="_blank" rel="noopener noreferrer" className="action-icon-btn" title="Ouvrir sur Instagram">
                                <Share2 size={24} />
                            </a>
                        </div>
                        <a href={menu.embed_url || siteInfo?.instagram || "https://www.instagram.com/mamefricoto/"} target="_blank" rel="noopener noreferrer" className="insta-direct-link">
                            <Instagram size={18} />
                            Voir sur Instagram
                        </a>
                    </div>

                    <div className="insta-post-likes">
                        <strong>{likesCount} j&apos;aime</strong>
                        <span className="insta-post-date">14 juillet</span>
                    </div>

                    <div className="insta-post-cta">
                        <a href="tel:0743646411" className="btn-peach order-call-btn">
                            <Phone size={18} />
                            Commander par téléphone — 07 43 64 64 11
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

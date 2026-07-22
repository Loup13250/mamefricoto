'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Phone, Instagram, Heart, Share2, MessageCircle, CheckCircle2, MapPin } from 'lucide-react';
import './WeeklyMenuCarousel.css';

function getInstagramEmbedUrl(url) {
    if (!url) return null;
    const match = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/i);
    if (match && match[1]) {
        return `https://www.instagram.com/p/${match[1]}/embed/captioned/`;
    }
    return null;
}

function isVideoUrl(url) {
    if (!url) return false;
    return /\.(mp4|mov|webm|ogg)(\?.*)?$/i.test(url);
}

export default function WeeklyMenuCarousel({ menu, siteInfo }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(54);
    const [showHeartAnim, setShowHeartAnim] = useState(false);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    if (!menu) return null;

    const embedUrl = getInstagramEmbedUrl(menu.embed_url);
    const images = menu.images && menu.images.length > 0 ? menu.images : (menu.image_url ? [{ id: 0, image_url: menu.image_url }] : []);

    const handlePrev = useCallback(() => {
        if (images.length <= 1) return;
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }, [images.length]);

    const handleNext = useCallback(() => {
        if (images.length <= 1) return;
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, [images.length]);

    // Keyboard Arrow Keys listener (Left / Right arrows)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') {
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                handlePrev();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNext, handlePrev]);

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
        if (diff > 35) {
            handleNext();
        } else if (diff < -35) {
            handlePrev();
        }
        touchStartX.current = 0;
        touchEndX.current = 0;
    };

    // Double-click on image to Like (Instagram style)
    const handleImageDoubleClick = () => {
        if (!liked) {
            setLiked(true);
            setLikesCount((prev) => prev + 1);
        }
        setShowHeartAnim(true);
        setTimeout(() => setShowHeartAnim(false), 800);
    };

    const toggleLike = () => {
        setLiked(!liked);
        setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    };

    // Fallback IF EMBED URL ONLY (no local images attached)
    if (embedUrl && images.length === 0) {
        return (
            <div className="insta-embed-card animate-fade-up">
                <div className="insta-embed-container">
                    <iframe
                        src={embedUrl}
                        className="insta-embed-iframe"
                        frameBorder="0"
                        scrolling="no"
                        allowtransparency="true"
                        title="Post Instagram Menu de la Semaine"
                    />
                </div>
                <div className="insta-embed-cta-box">
                    <a href="tel:0743646411" className="btn-peach order-call-btn">
                        <Phone size={18} />
                        Commander par téléphone — 07 43 64 64 11
                    </a>
                </div>
            </div>
        );
    }

    const currentMedia = images[currentIndex]?.image_url || menu.image_url;
    const isVideo = isVideoUrl(currentMedia) || images[currentIndex]?.media_type === 'video';

    return (
        <div className="insta-post-card animate-fade-up">
            {/* Left Column: Image / Video Media Box */}
            <div
                className="insta-post-media"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onDoubleClick={handleImageDoubleClick}
            >
                {/* Double click animated heart pop */}
                {showHeartAnim && (
                    <div className="heart-pop-anim">
                        <Heart size={80} fill="#ffffff" color="#ffffff" />
                    </div>
                )}

                {currentMedia ? (
                    <div className="insta-media-wrapper">
                        {isVideo ? (
                            <video
                                src={currentMedia}
                                controls
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="insta-post-img"
                            />
                        ) : (
                            <Image
                                src={currentMedia}
                                alt={`${menu.title} - Photo ${currentIndex + 1}`}
                                width={900}
                                height={1125}
                                className="insta-post-img"
                                priority
                                unoptimized
                            />
                        )}
                    </div>
                ) : (
                    <div className="insta-media-placeholder">
                        <Instagram size={48} style={{ color: '#D97736', marginBottom: '1rem' }} />
                        <p>Menu de la semaine</p>
                    </div>
                )}

                {/* Left/Right Click Hotspots for easy clicking anywhere on the media */}
                {images.length > 1 && (
                    <>
                        <div className="click-hotspot hotspot-left" onClick={handlePrev} title="Image précédente (Flèche Gauche)" />
                        <div className="click-hotspot hotspot-right" onClick={handleNext} title="Image suivante (Flèche Droite)" />
                    </>
                )}

                {/* Photo / Page Counter */}
                {images.length > 1 && (
                    <div className="insta-post-counter">
                        {currentIndex + 1}/{images.length}
                    </div>
                )}

                {/* Highly Interactive Arrow Buttons */}
                {images.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                            className="insta-post-arrow arrow-left"
                            aria-label="Photo précédente"
                            title="Précédent (Flèche Gauche Clavier)"
                        >
                            <ChevronLeft size={22} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleNext(); }}
                            className="insta-post-arrow arrow-right"
                            aria-label="Photo suivante"
                            title="Suivant (Flèche Droite Clavier)"
                        >
                            <ChevronRight size={22} />
                        </button>
                    </>
                )}

                {/* Dots indicator */}
                {images.length > 1 && (
                    <div className="insta-post-dots">
                        {images.map((img, idx) => (
                            <button
                                key={img.id || idx}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                                className={`insta-post-dot ${idx === currentIndex ? 'active' : ''}`}
                                aria-label={`Photo ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Right Column: Profile Header, Caption, Likes & CTA */}
            <div className="insta-post-sidebar">
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

                <div className="insta-post-caption-box">
                    <div className="caption-entry">
                        <span className="caption-user">mamefricoto</span>
                        <div className="caption-body">
                            <p>{menu.title}</p>
                            {menu.description && <p style={{ marginTop: '0.5rem' }}>{menu.description}</p>}
                            <p style={{ marginTop: '0.75rem', color: '#6B5B50', fontSize: '0.9rem' }}>
                                Commandes au 07 43 64 64 11 · Retrait au labo à Eyguières ou livraison.
                            </p>
                        </div>
                    </div>
                </div>

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

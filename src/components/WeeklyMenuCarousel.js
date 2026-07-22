'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Phone, Instagram, Heart, Share2, MessageCircle, CalendarDays, CheckCircle2, LayoutGrid, Eye } from 'lucide-react';
import './WeeklyMenuCarousel.css';

export default function WeeklyMenuCarousel({ menu, siteInfo }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [viewMode, setViewMode] = useState('embed'); // 'embed' or 'gallery'
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(48);

    if (!menu) return null;

    // Format embed URL if present (e.g. https://www.instagram.com/p/Dax0CDnjTLJ/)
    let embedIframeUrl = '';
    if (menu.embed_url) {
        let cleanUrl = menu.embed_url.trim();
        if (!cleanUrl.endsWith('/')) cleanUrl += '/';
        embedIframeUrl = `${cleanUrl}embed`;
    }

    const images = menu.images && menu.images.length > 0 ? menu.images : (menu.image_url ? [{ id: 0, image_url: menu.image_url }] : []);

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const toggleLike = () => {
        setLiked(!liked);
        setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    };

    return (
        <div className="menu-showcase-container animate-fade-up">
            {/* View Switcher if both Embed URL & Images are available */}
            {embedIframeUrl && images.length > 0 && (
                <div className="view-mode-switcher">
                    <button
                        type="button"
                        onClick={() => setViewMode('embed')}
                        className={`switcher-btn ${viewMode === 'embed' ? 'active' : ''}`}
                    >
                        <Instagram size={16} />
                        Post Instagram Officiel
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('gallery')}
                        className={`switcher-btn ${viewMode === 'gallery' ? 'active' : ''}`}
                    >
                        <LayoutGrid size={16} />
                        Galerie Photos ({images.length})
                    </button>
                </div>
            )}

            {/* View Option A: Real Instagram Embed Iframe */}
            {embedIframeUrl && viewMode === 'embed' ? (
                <div className="insta-embed-wrapper">
                    <iframe
                        src={embedIframeUrl}
                        className="insta-embed-iframe"
                        frameBorder="0"
                        scrolling="no"
                        allowTransparency={true}
                        title="Instagram Weekly Menu Post"
                    />
                    <div className="insta-embed-cta">
                        <a href="tel:0743646411" className="btn-peach order-floating-btn">
                            <Phone size={20} />
                            Commander par téléphone — 07 43 64 64 11
                        </a>
                    </div>
                </div>
            ) : (
                /* View Option B: Custom Multi-Image Instagram Post Card */
                <div className="insta-card">
                    {/* Header */}
                    <div className="insta-header">
                        <div className="insta-profile">
                            <div className="insta-avatar">
                                <Image src="/logo.png" alt="Mamé Fricoto" width={38} height={38} className="insta-avatar-img" />
                            </div>
                            <div className="insta-profile-info">
                                <div className="insta-username-row">
                                    <span className="insta-username">mamefricoto</span>
                                    <CheckCircle2 size={15} className="insta-verified" />
                                </div>
                                <span className="insta-location">Eyguières · Cuisine Maison</span>
                            </div>
                        </div>
                        <div className="insta-badge">
                            <CalendarDays size={14} />
                            {menu.title}
                        </div>
                    </div>

                    {/* Image Viewer */}
                    <div className="insta-slider">
                        <div className="insta-slide-active">
                            <Image
                                src={images[currentIndex]?.image_url || menu.image_url}
                                alt={`${menu.title} - Image ${currentIndex + 1}`}
                                width={900}
                                height={1125}
                                className="insta-img"
                                priority
                                unoptimized
                            />
                        </div>

                        {images.length > 1 && (
                            <div className="insta-counter">
                                {currentIndex + 1}/{images.length}
                            </div>
                        )}

                        {images.length > 1 && (
                            <>
                                <button type="button" onClick={handlePrev} className="insta-arrow insta-arrow-left" aria-label="Précédent">
                                    <ChevronLeft size={22} />
                                </button>
                                <button type="button" onClick={handleNext} className="insta-arrow insta-arrow-right" aria-label="Suivant">
                                    <ChevronRight size={22} />
                                </button>
                            </>
                        )}

                        {images.length > 1 && (
                            <div className="insta-dots">
                                {images.map((img, idx) => (
                                    <button
                                        key={img.id || idx}
                                        type="button"
                                        onClick={() => setCurrentIndex(idx)}
                                        className={`insta-dot ${idx === currentIndex ? 'active' : ''}`}
                                        aria-label={`Aller à la page ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions & Caption */}
                    <div className="insta-content">
                        <div className="insta-actions-bar">
                            <div className="insta-left-actions">
                                <button type="button" onClick={toggleLike} className={`insta-action-btn ${liked ? 'liked' : ''}`} aria-label="Aimer">
                                    <Heart size={24} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : 'currentColor'} />
                                </button>
                                <a href="tel:0743646411" className="insta-action-btn" title="Appeler">
                                    <MessageCircle size={24} />
                                </a>
                                {menu.embed_url && (
                                    <a href={menu.embed_url} target="_blank" rel="noopener noreferrer" className="insta-action-btn" title="Voir sur Instagram">
                                        <Share2 size={24} />
                                    </a>
                                )}
                            </div>
                            {siteInfo?.instagram && (
                                <a href={siteInfo.instagram} target="_blank" rel="noopener noreferrer" className="insta-link-btn">
                                    <Instagram size={18} />
                                    Voir sur Instagram
                                </a>
                            )}
                        </div>

                        <div className="insta-likes-count">
                            <strong>{likesCount} j&apos;aime</strong>
                        </div>

                        <div className="insta-caption-box">
                            <span className="insta-caption-user">mamefricoto</span>
                            <p className="insta-caption-text">
                                {menu.description || 'Découvrez nos menus de la semaine faits maison ! Feuilletez les images pour voir les plats du jour, les formules, les tarifs et les allergènes.'}
                            </p>
                        </div>

                        <div className="insta-cta-row">
                            <a href="tel:0743646411" className="btn-peach insta-order-btn">
                                <Phone size={20} />
                                Commander — 07 43 64 64 11
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

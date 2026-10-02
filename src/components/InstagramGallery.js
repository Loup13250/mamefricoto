'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { X, Play, Instagram, Phone, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import './InstagramGallery.css';

export default function InstagramGallery({ posts, siteInfo, showHeader = true }) {
    const [selectedIndex, setSelectedIndex] = useState(null);
    const { t, trans, lang } = useLanguage();

    const handleKeyDown = useCallback((e) => {
        if (selectedIndex === null) return;
        if (e.key === 'Escape') setSelectedIndex(null);
        if (e.key === 'ArrowLeft') setSelectedIndex((prev) => (prev > 0 ? prev - 1 : posts.length - 1));
        if (e.key === 'ArrowRight') setSelectedIndex((prev) => (prev < posts.length - 1 ? prev + 1 : 0));
    }, [selectedIndex, posts]);

    useEffect(() => {
        if (selectedIndex !== null) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedIndex, handleKeyDown]);

    if (!posts || posts.length === 0) return null;

    const selectedPost = selectedIndex !== null ? posts[selectedIndex] : null;

    return (
        <div className="container">
            {showHeader && (
                <div className="gallery-header anim-up">
                    <span className="label">{t('gallery.badge')}</span>
                    <h2 className="title-lg" style={{ marginTop: '0.75rem' }}>
                        {t('gallery.title')}<br /><em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>{t('gallery.titleItalic')}</em>
                    </h2>
                </div>
            )}

            <div className="gallery-grid">
                {posts.map((post, idx) => {
                    const postTitle = trans(post, 'title');
                    const postCaption = trans(post, 'caption');
                    return (
                        <div
                            key={post.id}
                            className="gallery-item"
                            style={{ animationDelay: `${(idx % 4) * 35}ms` }}
                            onClick={() => setSelectedIndex(idx)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setSelectedIndex(idx);
                                }
                            }}
                            aria-label={`Agrandir ${postTitle || 'cette réalisation'}`}
                        >
                            {post.media_type === 'video' ? (
                                <>
                                    <video src={post.image_url} autoPlay loop muted playsInline className="gallery-img" />
                                    <div className="video-mark" aria-hidden="true">
                                        <Play size={12} fill="currentColor" />
                                    </div>
                                </>
                            ) : (
                                <Image
                                    src={post.image_url}
                                    alt={postTitle || postCaption || 'Réalisation traiteur Mamé Fricoto'}
                                    width={500}
                                    height={500}
                                    className="gallery-img"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                    priority={idx < 4}
                                    fetchPriority={idx < 2 ? 'high' : 'auto'}
                                    loading={idx < 6 ? 'eager' : 'lazy'}
                                    decoding="async"
                                    unoptimized
                                />
                            )}
                            <div className="gallery-overlay">
                                {postTitle && <h3 className="gallery-overlay-title">{postTitle}</h3>}
                                {postCaption && <p className="gallery-overlay-caption">{postCaption}</p>}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="gallery-footer text-center">
                <a
                    href={siteInfo?.instagram || 'https://www.instagram.com/mamefricoto/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}
                >
                    <Instagram size={16} />
                    {t('gallery.follow')}
                    <ArrowRight size={14} />
                </a>
            </div>

            {/* Lightbox */}
            {selectedPost && (
                <div
                    className="modal-backdrop"
                    onClick={() => setSelectedIndex(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-label={trans(selectedPost, 'title') || 'Aperçu photo galerie'}
                >
                    <div className="modal-wrapper" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Navigation Buttons OUTSIDE modal-card */}
                        {posts.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    className="lightbox-nav-btn prev"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : posts.length - 1));
                                    }}
                                    aria-label={t('hero.prev')}
                                >
                                    <ChevronLeft className="lightbox-nav-icon" />
                                </button>
                                <button
                                    type="button"
                                    className="lightbox-nav-btn next"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedIndex((prev) => (prev < posts.length - 1 ? prev + 1 : 0));
                                    }}
                                    aria-label={t('hero.next')}
                                >
                                    <ChevronRight className="lightbox-nav-icon" />
                                </button>
                            </>
                        )}

                        <div className="modal-card">
                            <button type="button" className="modal-close" onClick={() => setSelectedIndex(null)} aria-label={lang === 'en' ? 'Close' : 'Fermer'}>
                                <X size={18} />
                            </button>

                            <div
                                className="modal-img-box"
                                onClick={() => {
                                    if (posts.length > 1) {
                                        setSelectedIndex((prev) => (prev < posts.length - 1 ? prev + 1 : 0));
                                    }
                                }}
                                style={{ cursor: posts.length > 1 ? 'pointer' : 'default', position: 'relative' }}
                                title={posts.length > 1 ? (lang === 'en' ? 'Click for next image' : 'Cliquer pour passer à la photo suivante') : ''}
                            >
                                {/* Counter badge */}
                                {posts.length > 1 && (
                                    <div className="lightbox-counter">
                                        {selectedIndex + 1} / {posts.length}
                                    </div>
                                )}

                                {selectedPost.media_type === 'video' ? (
                                    <video src={selectedPost.image_url} controls autoPlay loop style={{ width: '100%', maxHeight: '560px' }} />
                                ) : (
                                    <Image
                                        src={selectedPost.image_url}
                                        alt={trans(selectedPost, 'title') || ''}
                                        width={800}
                                        height={800}
                                        className="modal-img"
                                        style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                                        sizes="(max-width: 768px) 100vw, 800px"
                                        priority
                                        decoding="async"
                                        unoptimized
                                        key={selectedPost.image_url}
                                    />
                                )}
                            </div>
                            <div className="modal-info">
                                <div className="modal-meta">
                                    <Image src={siteInfo?.site_icon || siteInfo?.logo || "/logo.png"} alt="Mamé Fricoto" width={36} height={36} style={{ borderRadius: '2px', objectFit: 'cover' }} unoptimized />
                                    <div className="modal-meta-text">
                                        <strong>Mamé Fricoto</strong>
                                        <span>{lang === 'en' ? 'Eyguières · Behind the Scenes' : 'Eyguières · Les Coulisses'}</span>
                                    </div>
                                </div>
                                {trans(selectedPost, 'title') && <h3 className="modal-title">{trans(selectedPost, 'title')}</h3>}
                                {trans(selectedPost, 'caption') && <p className="modal-caption">{trans(selectedPost, 'caption')}</p>}
                                <div className="modal-cta">
                                    <a href={`tel:${(siteInfo?.phone || '07 43 64 64 11').replace(/\s+/g, '')}`} className="btn-terra modal-cta-btn">
                                        <Phone size={15} />
                                        {lang === 'en' ? 'Order' : 'Commander'} - {siteInfo?.phone || '07 43 64 64 11'}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

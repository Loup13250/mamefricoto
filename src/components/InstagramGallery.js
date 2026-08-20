'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, Play, Instagram, Phone, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import './InstagramGallery.css';

export default function InstagramGallery({ posts, siteInfo }) {
    const [selectedIndex, setSelectedIndex] = useState(null);

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

    // Preload ALL gallery images in background for zero-latency lightbox navigation
    useEffect(() => {
        if (!posts || posts.length === 0) return;
        posts.forEach((post) => {
            if (post?.image_url && post?.media_type !== 'video') {
                const imgLoader = new window.Image();
                imgLoader.src = post.image_url;
            }
        });
    }, [posts]);

    if (!posts || posts.length === 0) return null;

    const selectedPost = selectedIndex !== null ? posts[selectedIndex] : null;

    return (
        <div className="container">
            <div className="gallery-header anim-up">
                <span className="label">Nos réalisations</span>
                <h2 className="title-lg" style={{ marginTop: '0.75rem' }}>
                    Les Coulisses<br /><em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>de la Cuisine</em>
                </h2>
            </div>

            <div className="gallery-grid">
                {posts.map((post, idx) => (
                    <div
                        key={post.id}
                        className="gallery-item anim-up"
                        style={{ animationDelay: `${(idx % 4) * 80}ms` }}
                        onClick={() => setSelectedIndex(idx)}
                    >
                        {post.media_type === 'video' ? (
                            <>
                                <video src={post.image_url} autoPlay loop muted playsInline className="gallery-img" />
                                <div className="video-mark">
                                    <Play size={12} fill="currentColor" />
                                </div>
                            </>
                        ) : (
                            <Image
                                src={post.image_url}
                                alt={post.title || 'Mamé Fricoto'}
                                width={500}
                                height={500}
                                className="gallery-img"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                loading="lazy"
                            />
                        )}
                        <div className="gallery-overlay">
                            {post.title && <h3 className="gallery-overlay-title">{post.title}</h3>}
                            {post.caption && <p className="gallery-overlay-caption">{post.caption}</p>}
                        </div>
                    </div>
                ))}
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
                    Suivre @mamefricoto
                    <ArrowRight size={14} />
                </a>
            </div>

            {/* Lightbox */}
            {selectedPost && (
                <div className="modal-backdrop" onClick={() => setSelectedIndex(null)}>
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
                                    aria-label="Photo précédente"
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
                                    aria-label="Photo suivante"
                                >
                                    <ChevronRight className="lightbox-nav-icon" />
                                </button>
                            </>
                        )}

                        <div className="modal-card">
                            <button type="button" className="modal-close" onClick={() => setSelectedIndex(null)} aria-label="Fermer">
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
                                title={posts.length > 1 ? "Cliquer pour passer à la photo suivante" : ""}
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
                                        alt={selectedPost.title || ''}
                                        width={800}
                                        height={800}
                                        className="modal-img"
                                        style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                                        sizes="(max-width: 768px) 100vw, 800px"
                                        key={selectedPost.image_url}
                                    />
                                )}
                            </div>
                            <div className="modal-info">
                            <div className="modal-meta">
                                <Image src="/logo.png" alt="Mamé Fricoto" width={36} height={36} style={{ borderRadius: '2px', objectFit: 'cover' }} />
                                <div className="modal-meta-text">
                                    <strong>Mamé Fricoto</strong>
                                    <span>Eyguières · Les Coulisses</span>
                                </div>
                            </div>
                            {selectedPost.title && <h3 className="modal-title">{selectedPost.title}</h3>}
                            {selectedPost.caption && <p className="modal-caption">{selectedPost.caption}</p>}
                            <div className="modal-cta">
                                <a href={siteInfo?.phone ? `tel:${siteInfo.phone.replace(/\s+/g, '')}` : 'tel:#'} className="btn-terra modal-cta-btn">
                                    <Phone size={15} />
                                    Commander — 07 43 <span style={{ filter: 'blur(4px)', userSelect: 'none', opacity: 0.8 }}>64 64</span> 11
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

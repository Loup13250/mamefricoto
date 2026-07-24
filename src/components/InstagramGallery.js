'use client';
import { useState } from 'react';
import Image from 'next/image';
import { X, Play, Instagram, Phone, ArrowRight } from 'lucide-react';
import './InstagramGallery.css';

export default function InstagramGallery({ posts, siteInfo }) {
    const [selectedPost, setSelectedPost] = useState(null);

    if (!posts || posts.length === 0) return null;

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
                        onClick={() => setSelectedPost(post)}
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
                                unoptimized
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
                <div className="modal-backdrop" onClick={() => setSelectedPost(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={() => setSelectedPost(null)} aria-label="Fermer">
                            <X size={18} />
                        </button>
                        <div className="modal-img-box">
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
                                    unoptimized
                                />
                            )}
                        </div>
                        <div className="modal-info">
                            <div className="modal-meta">
                                <Image src="/logo.png" alt="Mamé Fricoto" width={36} height={36} style={{ borderRadius: '2px', objectFit: 'cover' }} />
                                <div className="modal-meta-text">
                                    <strong>Mamé Fricoto</strong>
                                    <span>Eyguières</span>
                                </div>
                            </div>
                            {selectedPost.title && <h3 className="modal-title">{selectedPost.title}</h3>}
                            {selectedPost.caption && <p className="modal-caption">{selectedPost.caption}</p>}
                            <div className="modal-cta">
                                <a href="tel:0743646411" className="btn-terra modal-cta-btn">
                                    <Phone size={15} />
                                    Commander — 07 43 64 64 11
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

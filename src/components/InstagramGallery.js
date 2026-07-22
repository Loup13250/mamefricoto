'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Instagram, X, Play } from 'lucide-react';
import './InstagramGallery.css';

export default function InstagramGallery({ posts, siteInfo }) {
    const [selectedPost, setSelectedPost] = useState(null);

    if (!posts || posts.length === 0) return null;

    return (
        <section className="insta-gallery-section section-padding">
            <div className="container">
                <div className="text-center animate-fade-up" style={{ marginBottom: '3.5rem' }}>
                    <div className="insta-feed-header-badge">
                        <Instagram size={18} />
                        @mamefricoto
                    </div>
                    <h2 className="section-title">Les Coulisses & Plats de Mamé</h2>
                    <p style={{ maxWidth: '600px', margin: '1rem auto 0', color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
                        Découvrez en photos & vidéos la cuisine maison, les buffets dînatoires et la passion au quotidien.
                    </p>
                </div>

                <div className="insta-grid">
                    {posts.map((post, idx) => (
                        <div
                            key={post.id}
                            className={`insta-grid-item animate-fade-up delay-${((idx % 4) + 1) * 100}`}
                            onClick={() => setSelectedPost(post)}
                        >
                            {post.media_type === 'video' ? (
                                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                    <video src={post.image_url} autoPlay loop muted playsInline className="insta-grid-img" />
                                    <div className="video-badge">
                                        <Play size={14} fill="#fff" />
                                    </div>
                                </div>
                            ) : (
                                <Image
                                    src={post.image_url}
                                    alt={post.title || 'Story Mamé Fricoto'}
                                    width={500}
                                    height={500}
                                    className="insta-grid-img"
                                    unoptimized
                                />
                            )}
                            <div className="insta-grid-overlay">
                                <Instagram size={24} className="insta-grid-icon" />
                                {post.title && <h3 className="insta-grid-title">{post.title}</h3>}
                                {post.caption && <p className="insta-grid-caption">{post.caption}</p>}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center" style={{ marginTop: '3rem' }}>
                    <a
                        href={siteInfo?.instagram || "https://www.instagram.com/mamefricoto/"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}
                    >
                        <Instagram size={20} />
                        Suivre @mamefricoto sur Instagram
                    </a>
                </div>
            </div>

            {/* Lightbox Modal */}
            {selectedPost && (
                <div className="insta-modal-backdrop" onClick={() => setSelectedPost(null)}>
                    <div className="insta-modal-card" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="insta-modal-close" onClick={() => setSelectedPost(null)}>
                            <X size={24} />
                        </button>
                        <div className="insta-modal-img-box">
                            {selectedPost.media_type === 'video' ? (
                                <video src={selectedPost.image_url} controls autoPlay loop style={{ width: '100%', height: '100%', maxHeight: '550px' }} />
                            ) : (
                                <Image
                                    src={selectedPost.image_url}
                                    alt={selectedPost.title || ''}
                                    width={800}
                                    height={800}
                                    className="insta-modal-img"
                                    unoptimized
                                />
                            )}
                        </div>
                        <div className="insta-modal-info">
                            <div className="insta-modal-user">
                                <Image src="/logo.png" alt="Mamé Fricoto" width={36} height={36} className="insta-avatar-img" />
                                <div>
                                    <strong>mamefricoto</strong>
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Eyguières</span>
                                </div>
                            </div>
                            {selectedPost.title && <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{selectedPost.title}</h3>}
                            {selectedPost.caption && <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>{selectedPost.caption}</p>}
                            <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
                                <a href="tel:0743646411" className="btn-peach" style={{ width: '100%', justifyContent: 'center' }}>
                                    Commander par téléphone — 07 43 64 64 11
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

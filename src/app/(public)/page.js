import React from 'react';
import { getSiteInfo, getCarouselImages, getCurrentWeeklyMenu, getGalleryPosts, getServices } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import HeroCarousel from '@/components/HeroCarousel';
import WeeklyMenuCarousel from '@/components/WeeklyMenuCarousel';
import InstagramGallery from '@/components/InstagramGallery';
import { Phone, Truck, ArrowRight, Star } from 'lucide-react';
import './home.css';

export const revalidate = 3600;

export default async function Home() {
    const siteInfo = await getSiteInfo();
    const carousel = await getCarouselImages();
    const weeklyMenu = await getCurrentWeeklyMenu();
    const galleryPosts = await getGalleryPosts();
    const services = await getServices();

    const phone = siteInfo.phone || '07 43 64 64 11';
    const phoneTel = phone.replace(/\s+/g, '');

    return (
        <main id="main-content" tabIndex="-1">
            {/* ===== HERO ===== */}
            <HeroCarousel slides={carousel} siteInfo={siteInfo} />

            {/* ===== INFO STRIP ===== */}
            <div className="info-strip">
                <div className="container info-strip-inner">
                    <div className="info-strip-item">
                        <Truck size={14} />
                        <span>Livraison à domicile</span>
                    </div>
                    <div className="info-strip-sep" />
                    <div className="info-strip-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        <span>Retrait au labo · Eyguières</span>
                    </div>
                    <div className="info-strip-sep" />
                    <div className="info-strip-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/></svg>
                        <span>Commandes avant 10h</span>
                    </div>
                    <div className="info-strip-sep" />
                    <div className="info-strip-item">
                        <Phone size={14} />
                        <a href={`tel:${phoneTel}`} style={{ color: 'inherit' }}>{phone}</a>
                    </div>
                </div>
            </div>

            {/* ===== MENU DE LA SEMAINE ===== */}
            <section id="menu-semaine" className="menu-section">
                <div className="container">
                    <div className="menu-section-header anim-up">
                        <div>
                            <span className="label">Du mardi au samedi</span>
                            <h2 className="title-lg" style={{ marginTop: '0.75rem' }}>Le Menu<br /><em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>de la Semaine</em></h2>
                        </div>
                        <p className="body-sm" style={{ maxWidth: '440px', textAlign: 'right', lineHeight: '1.6' }}>
                            <span style={{ whiteSpace: 'nowrap' }}>Commandes par téléphone au {phone}</span>.
                            <br />
                            Livraison ou retrait au labo.
                        </p>
                    </div>

                    {weeklyMenu ? (
                        <WeeklyMenuCarousel menu={weeklyMenu} siteInfo={siteInfo} />
                    ) : (
                        <div className="menu-empty anim-up delay-2">
                            <h3>Le menu arrive très bientôt</h3>
                            <p style={{ marginBottom: '1.5rem' }}>Suivez Mamé Fricoto sur Instagram pour découvrir les prochains plats.</p>
                            {siteInfo.instagram && (
                                <a href={siteInfo.instagram} target="_blank" rel="noopener noreferrer" className="btn-outline">
                                    Suivre @mamefricoto
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* ===== GALLERY ===== */}
            {galleryPosts && galleryPosts.length > 0 && (
                <section className="gallery-section">
                    <InstagramGallery posts={galleryPosts} siteInfo={siteInfo} />
                </section>
            )}

            {/* ===== NOS PRESTATIONS ===== */}
            <section className="services-section">
                <div className="container">
                    <div className="section-header anim-up" style={{ maxWidth: '600px', marginBottom: '3.5rem' }}>
                        <span className="label">Votre traiteur à Eyguières</span>
                        <h2 className="title-lg" style={{ marginTop: '0.75rem' }}>Nos Prestations</h2>
                    </div>
                    <div className="services-grid">
                        {services.map((s, idx) => (
                            <div key={s.id || s.num || idx} className="service-card">
                                <div className="service-num">{s.num || `0${idx + 1}`}</div>
                                {s.badge && <span className="service-badge">{s.badge}</span>}
                                <h3>{s.title}</h3>
                                <p>{s.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== À PROPOS ===== */}
            <section className="about-section">
                <div className="about-grid">
                    <div className="about-img-col">
                        <Image
                            src={siteInfo.about_image || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=800&auto=format&fit=crop"}
                            alt="Cuisine maison Mamé Fricoto"
                            width={800}
                            height={900}
                            className="about-img"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            sizes="(max-width: 900px) 100vw, 50vw"
                            loading="lazy"
                        />
                    </div>
                    <div className="about-text-col">
                        <span className="label">Cuisine familiale & passionnée</span>
                        <h2 className="title-lg" style={{ marginTop: '0.75rem' }}>
                            L&apos;Esprit<br /><em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>Mamé Fricoto</em>
                        </h2>
                        <p className="body-lg" style={{ whiteSpace: 'pre-line' }}>{siteInfo.about_text}</p>
                        <div className="about-facts">
                            <div className="about-fact">
                                <strong>Localisation</strong>
                                <p>{siteInfo.address || 'Eyguières, Bouches-du-Rhône'}</p>
                            </div>
                            <div className="about-fact">
                                <strong>Contact</strong>
                                <p><a href={`tel:${phoneTel}`} style={{ color: 'inherit' }}>{phone}</a></p>
                            </div>
                        </div>
                        <Link href="/a-propos" className="btn-outline" style={{ alignSelf: 'flex-start' }}>
                            En savoir plus
                            <ArrowRight size={15} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ===== AVIS GOOGLE ===== */}
            {siteInfo.google_reviews && (
                <div className="reviews-strip">
                    <div className="container reviews-strip-inner">
                        <div className="reviews-stars">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={18} fill="var(--gold)" color="var(--gold)" />
                            ))}
                        </div>
                        <p>Consultez les avis de nos clients sur Google</p>
                        <a href={siteInfo.google_reviews} target="_blank" rel="noopener noreferrer" className="btn-gold">
                            Voir les avis Google
                            <ArrowRight size={14} />
                        </a>
                    </div>
                </div>
            )}

            {/* ===== CTA FINAL ===== */}
            <section className="final-cta">
                <div className="container text-center anim-up">
                    <span className="label">Commander</span>
                    <h2 className="title-lg final-cta" style={{ marginTop: '1rem', marginBottom: '1rem', background: 'transparent', padding: '0 0 0.5rem 0', border: 'none' }}>
                        Une envie gourmande ?
                    </h2>
                    <p className="body-lg" style={{ maxWidth: '480px', margin: '0 auto' }}>
                        Commandez votre repas maison par téléphone. Livraison ou retrait au labo à Eyguières.
                    </p>
                    <div className="final-cta-actions">
                        <a href={`tel:${phoneTel}`} className="btn-terra" style={{ fontSize: '1rem', padding: '18px 40px' }}>
                            <Phone size={18} />
                            {phone}
                        </a>
                        <Link href="/contact" className="btn-outline">
                            Demander un devis
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}

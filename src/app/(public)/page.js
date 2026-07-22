import React from 'react';
import { getSiteInfo, getCarouselImages, getCurrentWeeklyMenu, getGalleryPosts } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import WeeklyMenuCarousel from '@/components/WeeklyMenuCarousel';
import InstagramGallery from '@/components/InstagramGallery';
import { Phone, Truck, CalendarDays, Building2, UtensilsCrossed, ChefHat, Instagram, Star, ArrowRight } from 'lucide-react';
import './home.css';

export const revalidate = 0;

export default function Home() {
    const siteInfo = getSiteInfo();
    const carousel = getCarouselImages();
    const weeklyMenu = getCurrentWeeklyMenu();
    const galleryPosts = getGalleryPosts();

    const services = [
        {
            icon: <UtensilsCrossed size={32} />,
            title: 'Plat du Jour',
            description: 'Chaque jour, un nouveau plat mijoté avec des produits frais et de saison. Commandez avant 10h !',
            color: '#E8A87C',
        },
        {
            icon: <CalendarDays size={32} />,
            title: 'Événements Privés',
            description: 'Anniversaires, mariages, baptêmes… On s\'occupe de régaler vos invités avec un menu sur mesure.',
            color: '#7FB3D3',
        },
        {
            icon: <Building2 size={32} />,
            title: 'Repas d\'Entreprise',
            description: 'Plateaux repas, déjeuners d\'équipe, séminaires — des formules adaptées à vos besoins professionnels.',
            color: '#9BC4A8',
        },
        {
            icon: <ChefHat size={32} />,
            title: 'Buffet Dînatoire',
            description: 'Des mets raffinés présentés en buffet pour vos soirées, cocktails et réceptions privées.',
            color: '#C49AC0',
        },
    ];

    return (
        <main>
            {/* ===== HERO SECTION ===== */}
            <section className="hero">
                <div className="hero-carousel">
                    {carousel.map((slide, index) => (
                        <div
                            key={slide.id}
                            className={`hero-slide ${index === 0 ? 'active' : ''}`}
                            style={{ backgroundImage: `linear-gradient(rgba(30, 45, 68, 0.55), rgba(30, 45, 68, 0.68)), url(${slide.image_url})` }}
                        >
                            <div className="hero-content animate-fade-up">
                                {index === 0 ? (
                                    <h1 className="hero-title">{slide.title}</h1>
                                ) : (
                                    <h2 className="hero-title">{slide.title}</h2>
                                )}
                                <p className="hero-subtitle">{slide.subtitle}</p>
                                <div className="hero-actions delay-200" style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
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
            </section>

            {/* ===== BANDEAU LIVRAISON ===== */}
            <section className="delivery-banner">
                <div className="container delivery-banner-inner">
                    <div className="delivery-item">
                        <Truck size={20} />
                        <span>Livraison à domicile</span>
                    </div>
                    <div className="delivery-divider"></div>
                    <div className="delivery-item">
                        <UtensilsCrossed size={20} />
                        <span>Retrait au labo</span>
                    </div>
                    <div className="delivery-divider"></div>
                    <div className="delivery-item">
                        <ChefHat size={20} />
                        <span>Fait maison à Eyguières</span>
                    </div>
                </div>
            </section>

            {/* ===== MENU DE LA SEMAINE ===== */}
            <section id="menu-semaine" className="section-padding weekly-menu-section">
                <div className="container">
                    <div className="text-center animate-fade-up" style={{ marginBottom: '3rem' }}>
                        <span className="section-subtitle">DU MARDI AU SAMEDI</span>
                        <h2 className="section-title">Le Menu de la Semaine</h2>
                        <p style={{ maxWidth: '600px', margin: '0.5rem auto 0', color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
                            Découvrez nos plats frais de la semaine. Commandez par téléphone au 07 43 64 64 11 !
                        </p>
                    </div>

                    {weeklyMenu ? (
                        <WeeklyMenuCarousel menu={weeklyMenu} siteInfo={siteInfo} />
                    ) : (
                        <div className="weekly-menu-empty animate-fade-up delay-200">
                            <ChefHat size={48} />
                            <h3>Le menu arrive très bientôt</h3>
                            <p>Suivez Mamé Fricoto sur Instagram pour découvrir les prochains plats.</p>
                            {siteInfo.instagram && (
                                <a href={siteInfo.instagram} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ marginTop: '1.5rem' }}>
                                    <Instagram size={18} />
                                    Suivre @mamefricoto
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* ===== INSTAGRAM STORIES / DISHES GALLERY ===== */}
            {galleryPosts && galleryPosts.length > 0 && (
                <InstagramGallery posts={galleryPosts} siteInfo={siteInfo} />
            )}

            {/* ===== NOS PRESTATIONS ===== */}
            <section className="section-padding services-section">
                <div className="container">
                    <div className="text-center animate-fade-up" style={{ marginBottom: '3.5rem' }}>
                        <span className="section-subtitle">NOTRE SAVOIR-FAIRE</span>
                        <h2 className="section-title">Nos Prestations</h2>
                        <p style={{ maxWidth: '600px', margin: '0.5rem auto 0', color: 'var(--text-secondary)' }}>
                            {siteInfo.services_text || 'Pour vos repas quotidiens ou vos événements festifs, Mamé Fricoto prépare vos mets sur mesure.'}
                        </p>
                    </div>

                    <div className="services-grid">
                        {services.map((service, i) => (
                            <div key={service.title} className={`service-card animate-fade-up delay-${(i + 1) * 100}`}>
                                <div className="service-icon" style={{ backgroundColor: `${service.color}15`, color: service.color }}>
                                    {service.icon}
                                </div>
                                <h3>{service.title}</h3>
                                <p>{service.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== À PROPOS ===== */}
            <section className="section-padding about-section">
                <div className="container">
                    <div className="about-grid">
                        <div className="about-image-wrapper animate-fade-up">
                            <Image
                                src={siteInfo.about_image || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=800&auto=format&fit=crop"}
                                alt="Cuisine maison Mamé Fricoto"
                                width={800}
                                height={600}
                                className="about-image"
                                unoptimized
                            />
                        </div>
                        <div className="about-text animate-fade-up delay-200">
                            <span className="section-subtitle">CUISINE FAMILIALE</span>
                            <h2 className="section-title">L&apos;Esprit Mamé Fricoto</h2>
                            <p style={{ marginBottom: '1.5rem', fontSize: '1.05rem', lineHeight: '1.8' }}>
                                {siteInfo.about_text}
                            </p>
                            <div className="about-details">
                                <div className="about-detail">
                                    <strong>Localisation</strong>
                                    <p>{siteInfo.address || 'Eyguières, Bouches-du-Rhône'}</p>
                                </div>
                                <div className="about-detail">
                                    <strong>Contact</strong>
                                    <p>{siteInfo.phone || '07 43 64 64 11'}</p>
                                </div>
                            </div>
                            <Link href="/a-propos" className="btn-secondary" style={{ marginTop: '2rem' }}>
                                En savoir plus
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== AVIS GOOGLE ===== */}
            {siteInfo.google_reviews && (
                <section className="reviews-banner">
                    <div className="container reviews-banner-inner">
                        <div className="reviews-stars">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={22} fill="#F4A261" color="#F4A261" />
                            ))}
                        </div>
                        <p>Consultez les avis de nos clients sur Google</p>
                        <a href={siteInfo.google_reviews} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ marginLeft: '1.5rem' }}>
                            Voir les avis Google
                            <ArrowRight size={16} />
                        </a>
                    </div>
                </section>
            )}

            {/* ===== CTA FINAL ===== */}
            <section className="final-cta">
                <div className="container text-center">
                    <div className="animate-fade-up">
                        <h2 style={{ fontSize: '2.5rem', color: 'white', marginBottom: '1rem' }}>Une envie gourmande ?</h2>
                        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.1rem', marginBottom: '2.5rem', maxWidth: '500px', margin: '0 auto 2.5rem' }}>
                            Commandez votre repas maison par téléphone. Livraison ou retrait au labo à Eyguières.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <a href="tel:0743646411" className="btn-peach" style={{ fontSize: '1.1rem', padding: '18px 40px' }}>
                                <Phone size={20} />
                                07 43 64 64 11
                            </a>
                            <Link href="/contact" className="btn-secondary" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}>
                                Demander un Devis Événement
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

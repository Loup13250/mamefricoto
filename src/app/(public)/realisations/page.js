import { getSiteInfo, getGalleryPosts } from '@/lib/data';
import Link from 'next/link';
import { Phone, Instagram, ArrowRight, Sparkles } from 'lucide-react';
import InstagramGallery from '@/components/InstagramGallery';
import '../home.css';

export const metadata = {
    title: 'Nos Réalisations & Coulisses | Mamé Fricoto — Traiteur Maison Eyguières',
    description: "Découvrez en images nos buffets dînatoires, réceptions privées, plats faits maison et les coulisses de la cuisine de Mamé Fricoto à Eyguières.",
};

export const revalidate = 3600;

export default async function RealisationsPage() {
    const siteInfo = await getSiteInfo();
    const galleryPosts = await getGalleryPosts();

    const phone = siteInfo?.phone || '07 43 64 64 11';
    const phoneTel = phone.replace(/\s+/g, '');

    return (
        <main style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--bg)' }}>
            {/* ===== PAGE HERO ===== */}
            <section style={{
                background: 'var(--bg-2)',
                padding: '5rem 0 4rem',
                borderBottom: '1px solid var(--border)',
            }}>
                <div className="container anim-fade">
                    <span className="label" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Sparkles size={13} style={{ color: 'var(--gold)' }} /> Galerie Photos &amp; Vidéos
                    </span>
                    <h1 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)',
                        fontWeight: '400',
                        marginTop: '0.75rem',
                        lineHeight: '1.05',
                    }}>
                        Nos Réalisations<br />
                        <em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>Les Coulisses de la Cuisine</em>
                    </h1>
                    <p style={{
                        maxWidth: '560px',
                        marginTop: '1.5rem',
                        color: 'var(--text-2)',
                        fontSize: '1rem',
                        lineHeight: '1.7',
                    }}>
                        Découvrez en images nos buffets gourmands, réceptions sur mesure, plats mijotés et nos préparations quotidiennes au labo à Eyguières.
                    </p>
                </div>
            </section>

            {/* ===== GALLERY GRID ===== */}
            <section style={{ padding: '5rem 0 6rem' }}>
                {galleryPosts && galleryPosts.length > 0 ? (
                    <InstagramGallery posts={galleryPosts} siteInfo={siteInfo} />
                ) : (
                    <div className="container text-center" style={{ padding: '4rem 1rem' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                            Les réalisations seront publiées très prochainement.
                        </p>
                        {siteInfo.instagram && (
                            <a
                                href={siteInfo.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-outline"
                                style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Instagram size={16} /> Suivre @mamefricoto sur Instagram
                            </a>
                        )}
                    </div>
                )}
            </section>

            {/* ===== CTA SECTION ===== */}
            <section style={{ background: 'var(--bg-2)', padding: '6rem 0', borderTop: '1px solid var(--border)' }}>
                <div className="container text-center anim-up">
                    <span className="label">Votre projet traiteur</span>
                    <h2 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                        fontWeight: '400',
                        marginTop: '1rem',
                        marginBottom: '1rem',
                    }}>
                        Un événement à organiser ?
                    </h2>
                    <p style={{ color: 'var(--text-2)', maxWidth: '480px', margin: '0 auto 2.5rem', fontSize: '0.95rem', lineHeight: '1.7' }}>
                        Buffet dînatoire, anniversaire, repas d&apos;entreprise ou menu sur mesure : contactez-nous pour échanger sur vos envies.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href={`tel:${phoneTel}`} className="btn-terra" style={{ fontSize: '0.95rem', padding: '16px 36px' }}>
                            <Phone size={16} />
                            {phone}
                        </a>
                        <Link href="/contact" className="btn-outline">
                            Demander un devis
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}

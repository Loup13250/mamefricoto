import { getSiteInfo } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import { Phone, MapPin, Truck, UtensilsCrossed, CalendarDays, Building2, ArrowRight } from 'lucide-react';

export const metadata = {
    title: 'À Propos | Mamé Fricoto — Traiteur Maison',
    description: "Découvrez l'histoire de Mamé Fricoto, traiteur maison à Eyguières. Cuisine faite avec soin et produits frais.",
};

export const revalidate = 0;

const services = [
    {
        icon: <UtensilsCrossed size={22} />,
        title: 'Plats du Jour',
        desc: 'Chaque jour, des plats mijotés frais. Commandez la veille ou le matin pour un repas livré ou à retirer.',
    },
    {
        icon: <CalendarDays size={22} />,
        title: 'Événements',
        desc: 'Anniversaires, mariages, baptêmes — un menu sur mesure adapté à votre nombre de convives.',
    },
    {
        icon: <Building2 size={22} />,
        title: "Repas d'Entreprise",
        desc: "Plateaux repas, buffets pour séminaires et déjeuners d'équipe. Des formules professionnelles.",
    },
    {
        icon: <Truck size={22} />,
        title: 'Buffets Dînatoires',
        desc: 'Des mets élégants présentés en buffet pour vos soirées cocktails et réceptions.',
    },
];

export default async function AProposPage() {
    const info = await getSiteInfo();

    return (
        <main style={{ paddingTop: '80px' }}>

            {/* ===== PAGE HERO ===== */}
            <section style={{
                background: 'var(--bg-2)',
                padding: '5rem 0 4rem',
                borderBottom: '1px solid var(--border)',
            }}>
                <div className="container anim-fade">
                    <span className="label">Notre histoire</span>
                    <h1 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                        fontWeight: '400',
                        marginTop: '0.75rem',
                        lineHeight: '1.05',
                    }}>
                        À Propos de<br />
                        <em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>Mamé Fricoto</em>
                    </h1>
                    <p style={{
                        maxWidth: '500px',
                        marginTop: '1.5rem',
                        color: 'var(--text-2)',
                        fontSize: '1rem',
                        lineHeight: '1.7',
                    }}>
                        cuisine · maison · partage
                    </p>
                </div>
            </section>

            {/* ===== STORY ===== */}
            <section style={{ background: 'var(--bg)', padding: '7rem 0' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem', alignItems: 'center' }}
                        className="about-story-grid">
                        <div className="anim-up">
                            <span className="label">La passion de la cuisine</span>
                            <h2 style={{
                                fontFamily: 'var(--font-heading)',
                                fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                                fontWeight: '400',
                                marginTop: '0.75rem',
                                marginBottom: '1.5rem',
                                lineHeight: '1.1',
                            }}>
                                Une Cuisine Authentique,<br />
                                <em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>Préparée avec le Cœur</em>
                            </h2>
                            <p style={{ color: 'var(--text-2)', fontSize: '1rem', lineHeight: '1.85', marginBottom: '1.25rem', whiteSpace: 'pre-line' }}>
                                {info.about_text || "Mamé Fricoto, c'est l'histoire d'une passionnée de cuisine qui a décidé de partager ses recettes maison avec vous."}
                            </p>
                            <p style={{ color: 'var(--text-2)', fontSize: '1rem', lineHeight: '1.85' }}>
                                Chaque plat est préparé dans notre labo à domicile à Eyguières, avec des ingrédients soigneusement
                                sélectionnés auprès de producteurs locaux. Pas d&apos;additifs, pas de raccourcis — juste de la vraie cuisine.
                            </p>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '1.5rem',
                                marginTop: '2.5rem',
                            }}>
                                {[
                                    { label: 'Méthode', val: '100% fait maison' },
                                    { label: 'Approvisionnement', val: 'Producteurs locaux' },
                                    { label: 'Disponibilité', val: 'Mardi au Samedi' },
                                    { label: 'Localisation', val: 'Eyguières, 13' },
                                ].map(f => (
                                    <div key={f.label} style={{
                                        borderLeft: '1px solid var(--border)',
                                        paddingLeft: '1.25rem',
                                    }}>
                                        <strong style={{
                                            display: 'block',
                                            fontSize: '0.68rem',
                                            fontWeight: '700',
                                            letterSpacing: '0.18em',
                                            textTransform: 'uppercase',
                                            color: 'var(--gold)',
                                            marginBottom: '0.35rem',
                                        }}>{f.label}</strong>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-2)' }}>{f.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="anim-up delay-2" style={{ position: 'relative' }}>
                            <Image
                                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=800&auto=format&fit=crop"
                                alt="Cuisine maison Mamé Fricoto"
                                width={800}
                                height={900}
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    objectFit: 'cover',
                                    display: 'block',
                                    border: '1px solid var(--border)',
                                }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== SERVICES ===== */}
            <section style={{ background: 'var(--bg-2)', padding: '7rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                <div className="container">
                    <div style={{ marginBottom: '4rem' }} className="anim-up">
                        <span className="label">Nos prestations</span>
                        <h2 style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                            fontWeight: '400',
                            marginTop: '0.75rem',
                        }}>Ce que Nous Proposons</h2>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: '1px',
                        background: 'var(--border)',
                        border: '1px solid var(--border)',
                    }}>
                        {services.map((s, i) => (
                            <div key={s.title} className={`anim-up delay-${i + 1}`} style={{
                                background: 'var(--bg-card)',
                                padding: '2.5rem',
                                position: 'relative',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    border: '1px solid var(--border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--gold)',
                                    marginBottom: '1.5rem',
                                }}>
                                    {s.icon}
                                </div>
                                <h3 style={{
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: '1.4rem',
                                    fontWeight: '400',
                                    marginBottom: '0.85rem',
                                    color: 'var(--text-1)',
                                }}>{s.title}</h3>
                                <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', lineHeight: '1.75' }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== CTA ===== */}
            <section style={{ background: 'var(--bg)', padding: '7rem 0', borderBottom: '1px solid var(--border)' }}>
                <div className="container text-center anim-up">
                    <span className="label">Commander</span>
                    <h2 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                        fontWeight: '400',
                        marginTop: '1rem',
                        marginBottom: '1rem',
                    }}>Envie de goûter ?</h2>
                    <p style={{ color: 'var(--text-2)', maxWidth: '430px', margin: '0 auto 2.5rem', fontSize: '0.95rem', lineHeight: '1.7' }}>
                        Appelez-nous pour commander ou demander un devis pour vos événements.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href="#" className="btn-terra" style={{ fontSize: '0.95rem', padding: '16px 36px' }}>
                            <Phone size={16} />
                            07 43 <span style={{ filter: 'blur(4px)', userSelect: 'none', opacity: 0.8 }}>64 64</span> 11
                        </a>
                        <Link href="/contact" className="btn-outline">
                            Demander un devis
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </section>
            <style>{`
                @media (max-width: 900px) {
                    .about-story-grid {
                        grid-template-columns: 1fr !important;
                        gap: 3rem !important;
                    }
                }
            `}</style>
        </main>
    );
}

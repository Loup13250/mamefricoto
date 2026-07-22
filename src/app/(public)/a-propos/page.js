import { getSiteInfo } from '@/lib/data';
import Image from 'next/image';
import { Phone, MapPin, Truck, ChefHat, Heart, UtensilsCrossed, CalendarDays, Building2 } from 'lucide-react';

export const metadata = {
    title: 'À Propos | Mamé Fricoto — Traiteur Maison',
    description: 'Découvrez l\'histoire de Mamé Fricoto, traiteur maison à Eyguières. Cuisine faite avec amour et produits frais.',
};

export const revalidate = 0;

export default function AProposPage() {
    const info = getSiteInfo();

    return (
        <main className="animate-fade">
            {/* Hero à propos */}
            <section style={{
                background: 'linear-gradient(135deg, var(--accent-blue-dark), var(--accent-blue))',
                padding: '6rem 0 4rem',
                textAlign: 'center',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute', top: '-30%', right: '-10%', width: '400px', height: '400px',
                    background: 'radial-gradient(circle, rgba(232,168,124,0.15) 0%, transparent 70%)', borderRadius: '50%'
                }}></div>
                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent-peach)', fontWeight: '600' }}>
                        NOTRE HISTOIRE
                    </span>
                    <h1 style={{ fontFamily: 'var(--font-primary)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginTop: '0.75rem', fontWeight: '800' }}>
                        À Propos de Mamé Fricoto
                    </h1>
                    <p style={{ maxWidth: '550px', margin: '1.25rem auto 0', color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', lineHeight: '1.7' }}>
                        cuisine · maison · partage
                    </p>
                </div>
            </section>

            {/* Story Section */}
            <section className="section-padding" style={{ background: 'white' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }}>
                        <div className="animate-fade-up">
                            <span className="section-subtitle">LA PASSION DE LA CUISINE</span>
                            <h2 className="section-title" style={{ fontSize: '2.4rem' }}>Une Cuisine Authentique,<br />Préparée avec le Cœur</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.9', marginBottom: '1.5rem' }}>
                                {info.about_text || 'Mamé Fricoto, c\'est l\'histoire d\'une passionnée de cuisine qui a décidé de partager ses recettes maison avec vous.'}
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.9', marginBottom: '2rem' }}>
                                Chaque plat est préparé dans notre labo à domicile à Eyguières, avec des ingrédients soigneusement sélectionnés
                                auprès de producteurs locaux. Pas d&apos;additifs, pas de raccourcis — juste de la vraie cuisine comme à la maison.
                            </p>
                            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ background: 'rgba(232,168,124,0.12)', padding: '12px', borderRadius: '12px', color: 'var(--accent-peach-dark)' }}>
                                        <Heart size={20} />
                                    </div>
                                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Fait avec amour</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ background: 'rgba(61,90,128,0.08)', padding: '12px', borderRadius: '12px', color: 'var(--accent-blue)' }}>
                                        <MapPin size={20} />
                                    </div>
                                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Produits locaux</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ background: 'rgba(155,196,168,0.15)', padding: '12px', borderRadius: '12px', color: '#5a8a6a' }}>
                                        <ChefHat size={20} />
                                    </div>
                                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>100% maison</span>
                                </div>
                            </div>
                        </div>
                        <div className="animate-fade-up delay-200" style={{ position: 'relative' }}>
                            <Image
                                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=800&auto=format&fit=crop"
                                alt="Cuisine maison Mamé Fricoto"
                                width={800}
                                height={600}
                                style={{ borderRadius: 'var(--border-radius-lg)', width: '100%', height: 'auto', objectFit: 'cover', boxShadow: '0 20px 50px rgba(61,90,128,0.12)' }}
                            />
                            <div style={{ position: 'absolute', bottom: '-15px', left: '-15px', width: '50%', height: '50%', border: '3px solid var(--accent-peach)', borderRadius: 'var(--border-radius-lg)', zIndex: -1, opacity: 0.3 }}></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services détaillés */}
            <section className="section-padding" style={{ background: 'var(--bg-color)' }}>
                <div className="container">
                    <div className="text-center animate-fade-up" style={{ marginBottom: '4rem' }}>
                        <span className="section-subtitle" style={{ justifyContent: 'center' }}>NOS PRESTATIONS</span>
                        <h2 className="section-title">Ce que Nous Proposons</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                        {[
                            { icon: <UtensilsCrossed size={28} />, title: 'Plats du Jour', desc: 'Chaque jour, des plats mijotés frais du jour. Commandez la veille ou le matin même pour un repas livré ou à retirer.', color: '#E8A87C' },
                            { icon: <CalendarDays size={28} />, title: 'Événements', desc: 'Anniversaires, mariages, baptêmes, fêtes de famille — on prépare un menu sur mesure adapté à votre nombre d\'invités et vos goûts.', color: '#7FB3D3' },
                            { icon: <Building2 size={28} />, title: 'Repas d\'Entreprise', desc: 'Plateaux repas variés, buffets pour séminaires et déjeuners d\'équipe. Des formules professionnelles et savoureuses.', color: '#9BC4A8' },
                            { icon: <ChefHat size={28} />, title: 'Buffets Dînatoires', desc: 'Des mets élégants présentés en buffet pour vos soirées cocktails, vernissages et réceptions. Livraison et mise en place incluses.', color: '#C49AC0' },
                        ].map((service, i) => (
                            <div key={service.title} className={`animate-fade-up delay-${(i + 1) * 100}`} style={{
                                background: 'white', borderRadius: 'var(--border-radius-lg)', padding: '2.5rem',
                                border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                                transition: 'all 0.4s ease'
                            }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: `${service.color}15`, color: service.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                                    {service.icon}
                                </div>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>{service.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.95rem' }}>{service.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ background: 'linear-gradient(135deg, var(--accent-blue-dark), var(--accent-blue))', padding: '5rem 0', textAlign: 'center' }}>
                <div className="container animate-fade-up">
                    <h2 style={{ color: 'white', fontSize: '2.2rem', marginBottom: '1rem', fontFamily: 'var(--font-primary)' }}>
                        Envie de goûter ?
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: '450px', margin: '0 auto 2rem', fontSize: '1.05rem' }}>
                        Appelez-nous pour commander ou demander un devis pour vos événements.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href="tel:0743646411" className="btn-peach" style={{ fontSize: '1.1rem', padding: '18px 40px' }}>
                            <Phone size={20} />
                            07 43 64 64 11
                        </a>
                        <a href="mailto:{info.contact_email}" className="btn-secondary" style={{ borderColor: 'rgba(255,255,255,0.35)', color: 'white' }}>
                            <Truck size={18} />
                            Livraison & Retrait
                        </a>
                    </div>
                </div>
            </section>
        </main>
    );
}

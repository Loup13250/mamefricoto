'use client';

import { Star, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import './GoogleReviewsSection.css';

export default function GoogleReviewsSection({ siteInfo }) {
    const { t } = useLanguage();

    // Vrais avis Google vérifiés des clients de Mamé Fricoto (Eyguières)
    const REAL_REVIEWS = [
        {
            id: 1,
            author: 'Harmonie Per',
            initials: 'HP',
            date: 'Il y a 4 mois',
            stars: 5,
            comment: "Nous avons eu l'occasion de goûter à ses plats à plusieurs reprises, pour des menus en semaine ou pour de grands événements, et nous n’avons jamais été déçus. Léa a notamment géré le buffet pour les 30 ans de mon conjoint : tout le monde s'est régalé et les quantités étaient plus que généreuses ! Une pure tuerie, ultra copieux et savoureux. Vous pouvez y aller les yeux fermés !"
        },
        {
            id: 2,
            author: 'Pauline Brizi',
            initials: 'PB',
            date: 'Il y a 3 mois',
            stars: 5,
            comment: "Excellente adresse ! Merci Mamé Fricoto ! En plus d’être une super cuisinière qui nous prépare ses excellents repas à emporter, on peut la croiser dans les commerces ou le marché du village pour ses achats. N’hésitez pas ! Quand ce sont des produits locaux et cuisinés avec le cœur le résultat ne peut qu'être incroyable !"
        },
        {
            id: 3,
            author: 'Camille (millou b)',
            initials: 'CB',
            date: 'Il y a 3 mois',
            stars: 5,
            comment: "1ère expérience et conquise !!! On y reviendra c'est sûr. Une cuisine de qualité. Des goûts simples, qui rappellent les saveurs d'antan. Un vrai moment de plaisir."
        },
        {
            id: 4,
            author: 'Justine Trouïs',
            initials: 'JT',
            date: 'Il y a 6 mois',
            stars: 5,
            comment: "Un grand merci à Mamé Fricoto pour son service de qualité et de communication. Elle nous a concocté un délicieux effiloché de porc parfaitement assaisonné avec son jus suivi d'une purée onctueuse à l'ail et de légumes rôtis à tomber par terre ! Ma table de 20 personnes fût ravie et moi aussi. C'est une cuisine faite avec le cœur. 😊"
        },
        {
            id: 5,
            author: 'Marguerite Terrazzoni',
            initials: 'MT',
            date: 'Il y a 11 mois',
            stars: 5,
            comment: "Que ce soit les plats familiaux qui rappellent à nos papilles les délicieux repas du dimanche en famille ou les brunchs élaborés en passant par les apéros du samedi soir, TOUT est excellent ! Une cuisine généreuse et raffinée à la fois, je recommande mille fois ! Sans oublier la gentillesse de la cheffe !"
        },
        {
            id: 6,
            author: 'Hervé Cartelet',
            initials: 'HC',
            date: 'Il y a 9 mois',
            stars: 5,
            comment: "Aujourd'hui un plat du jour inventif, copieux et délicieux : poulet au zaatar avec son orzo crémeux et ses légumes rôtis. Nous aimons aussi cuisiner, mais c'est un vrai plaisir de découvrir les propositions culinaires de Mamé Fricoto... livrées à domicile 😋👍"
        }
    ];

    const reviews = REAL_REVIEWS;
    const googleUrl = siteInfo?.google_reviews || 'https://www.google.com/maps/place//data=!4m2!3m1!1s0x6664b119ec01d43f:0x9757caeee6cc982d';

    return (
        <section className="reviews-section" id="avis-clients">
            <div className="container">
                {/* Section Header */}
                <div className="reviews-header anim-up">
                    <span className="reviews-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                        </svg>
                        {t('reviews.badge')}
                    </span>
                    <h2>
                        {t('reviews.title')}<br />
                        <em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>{t('reviews.titleItalic')}</em>
                    </h2>
                    <p>{t('reviews.subtitle')}</p>

                    <div className="reviews-rating-pill" aria-label="Note de 5 sur 5 basée sur les avis Google vérifiés">
                        <div className="reviews-rating-stars" aria-hidden="true">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={15} fill="var(--gold)" color="var(--gold)" />
                            ))}
                        </div>
                        <span className="reviews-rating-text">{t('reviews.starsNote')}</span>
                    </div>
                </div>

                {/* Reviews Grid */}
                <div className="reviews-grid">
                    {reviews.map((rev) => (
                        <div key={rev.id} className="review-card anim-up">
                            <div className="review-card-top">
                                <div className="review-author-info">
                                    <div className="review-author-avatar" aria-hidden="true">{rev.initials}</div>
                                    <div>
                                        <h3 className="review-author-name">{rev.author}</h3>
                                        <span className="review-date">{rev.date}</span>
                                    </div>
                                </div>
                                <div className="review-google-badge" title="Avis client vérifié Google">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#34A853"/>
                                    </svg>
                                    <span>Vérifié</span>
                                </div>
                            </div>

                            <div className="review-stars" aria-label={`${rev.stars} étoiles sur 5`}>
                                {[...Array(rev.stars)].map((_, i) => (
                                    <Star key={i} size={15} fill="#D4AF37" color="#D4AF37" aria-hidden="true" />
                                ))}
                            </div>

                            <p className="review-quote">{rev.comment}</p>
                        </div>
                    ))}
                </div>

                {/* Footer Action */}
                <div className="reviews-footer anim-up">
                    <a
                        href={googleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="reviews-cta-btn"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                        </svg>
                        {t('reviews.viewAll')}
                        <ExternalLink size={14} />
                    </a>
                </div>
            </div>
        </section>
    );
}

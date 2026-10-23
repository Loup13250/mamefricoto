'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { 
    Home, 
    Phone, 
    Calendar, 
    BookOpen, 
    Image as ImageIcon, 
    Sparkles, 
    UtensilsCrossed, 
    ArrowRight 
} from 'lucide-react';

export default function NotFoundView({ siteInfo }) {
    const { t } = useLanguage();
    const phone = siteInfo?.phone || '07 43 64 64 11';
    const phoneTel = phone.replace(/\s+/g, '');

    return (
        <main className="not-found-page">
            <div className="not-found-bg-glow" aria-hidden="true" />

            <div className="not-found-content">
                {/* Badge d'en-tête */}
                <div className="not-found-badge">
                    <Sparkles size={14} />
                    <span>{t('404.badge')}</span>
                </div>

                {/* Chiffre 404 avec assiette et couverts animés */}
                <div className="not-found-digits" aria-hidden="true">
                    <span className="not-found-num">4</span>
                    <div className="not-found-emblem" title="Mamé Fricoto">
                        <UtensilsCrossed size={52} strokeWidth={1.75} />
                    </div>
                    <span className="not-found-num">4</span>
                </div>

                {/* Titre et description */}
                <h1 className="not-found-title">
                    {t('404.title')} <em>{t('404.titleItalic')}</em>
                </h1>

                <p className="not-found-desc">
                    {t('404.desc')}
                </p>

                {/* Actions principales */}
                <div className="not-found-actions">
                    <Link href="/" className="btn-gold">
                        <Home size={18} />
                        <span>{t('404.backHome')}</span>
                    </Link>

                    <a href={`tel:${phoneTel}`} className="btn-outline">
                        <Phone size={18} />
                        <span>{t('404.call')} : {phone}</span>
                    </a>
                </div>

                {/* Liens de suggestion */}
                <section className="not-found-suggestions" aria-label={t('404.suggestionsTitle')}>
                    <h2 className="not-found-suggestions-title">
                        {t('404.suggestionsTitle')}
                    </h2>

                    <div className="not-found-grid">
                        <Link href="/#menu-semaine" className="not-found-card">
                            <div className="not-found-card-icon">
                                <Calendar size={22} />
                            </div>
                            <h3>
                                <span>{t('404.menuTitle')}</span>
                                <ArrowRight size={16} />
                            </h3>
                            <p>{t('404.menuDesc')}</p>
                            <span className="not-found-card-link">
                                {t('404.menuLink')} →
                            </span>
                        </Link>

                        <Link href="/tarifs" className="not-found-card">
                            <div className="not-found-card-icon">
                                <BookOpen size={22} />
                            </div>
                            <h3>
                                <span>{t('404.tarifsTitle')}</span>
                                <ArrowRight size={16} />
                            </h3>
                            <p>{t('404.tarifsDesc')}</p>
                            <span className="not-found-card-link">
                                {t('404.tarifsLink')} →
                            </span>
                        </Link>

                        <Link href="/galerie" className="not-found-card">
                            <div className="not-found-card-icon">
                                <ImageIcon size={22} />
                            </div>
                            <h3>
                                <span>{t('404.galleryTitle')}</span>
                                <ArrowRight size={16} />
                            </h3>
                            <p>{t('404.galleryDesc')}</p>
                            <span className="not-found-card-link">
                                {t('404.galleryLink')} →
                            </span>
                        </Link>

                        <Link href="/a-propos" className="not-found-card">
                            <div className="not-found-card-icon">
                                <Sparkles size={22} />
                            </div>
                            <h3>
                                <span>{t('404.aboutTitle')}</span>
                                <ArrowRight size={16} />
                            </h3>
                            <p>{t('404.aboutDesc')}</p>
                            <span className="not-found-card-link">
                                {t('404.aboutLink')} →
                            </span>
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}

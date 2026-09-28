'use client';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Facebook, Instagram, MapPin, Phone, Clock } from 'lucide-react';
import './Footer.css';

export default function Footer({ siteInfo }) {
    const { t, trans, lang } = useLanguage();
    const info = siteInfo || {};
    const phone = info.phone || '07 43 64 64 11';
    const phoneTel = phone.replace(/\s+/g, '');

    const servicesList = lang === 'en' ? [
        'Daily Homemade Specials',
        'Tailored Private Events',
        'Corporate Lunches & Seminars',
        'Gourmet Cocktail Buffets',
    ] : [
        'Plat du Jour Fait Maison',
        'Événements Privés Sur-Mesure',
        "Repas d'Entreprise & Séminaires",
        'Buffets Dînatoires & Cocktails',
    ];

    return (
        <footer className="site-footer">
            <div className="footer-top">
                <div className="container footer-grid">
                    <div className="footer-brand">
                        <span className="footer-name">Mamé Fricoto</span>
                        <p className="footer-tagline">{trans(info, 'tagline') || t('footer.tagline')}</p>
                        <p className="footer-desc">
                            {trans(info, 'about_text') ? (
                                trans(info, 'about_text').split('\n')[0]
                            ) : (
                                t('footer.desc')
                            )}
                        </p>
                        <div className="social-links">
                            {info.instagram && (
                                <a href={info.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram Mamé Fricoto">
                                    <Instagram size={20} />
                                </a>
                            )}
                            {info.facebook && (
                                <a href={info.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook Mamé Fricoto">
                                    <Facebook size={20} />
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="footer-links">
                        <h3>{t('footer.navTitle')}</h3>
                        <ul>
                            <li><Link href="/" prefetch={true}>{t('nav.home')}</Link></li>
                            <li><Link href="/tarifs" prefetch={true}>{t('nav.tarifs')}</Link></li>
                            <li><Link href="/galerie" prefetch={true}>{t('nav.creations')}</Link></li>
                            <li><Link href="/a-propos" prefetch={true}>{t('nav.about')}</Link></li>
                            <li><Link href="/contact" prefetch={true}>{t('nav.contact')}</Link></li>
                        </ul>
                    </div>

                    <div className="footer-links">
                        <h3>{t('footer.servicesTitle')}</h3>
                        <ul>
                            {servicesList.map((serviceName, i) => (
                                <li key={i}>{serviceName}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="footer-contact">
                        <h3>{t('footer.contactTitle')}</h3>
                        <ul>
                            <li>
                                <MapPin size={16} />
                                <span>{trans(info, 'address') || (lang === 'en' ? 'Eyguières, Provence, France' : 'Eyguières, Bouches-du-Rhône')}</span>
                            </li>
                            <li>
                                <Phone size={16} />
                                <a href={`tel:${phoneTel}`}>{phone}</a>
                            </li>
                            <li>
                                <Clock size={16} />
                                <span>{trans(info, 'hours') || (lang === 'en' ? 'Orders before 10 AM' : 'Commandes avant 10h')}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="container footer-bottom-inner">
                    <p>&copy; {new Date().getFullYear()} {t('footer.copyright')}</p>
                    <p>{t('footer.madeIn')}</p>
                </div>
            </div>
        </footer>
    );
}

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

    const servicesList = [
        { label: t('type.private'), href: '/contact?type=prive' },
        { label: t('type.pro'), href: '/contact?type=entreprise' },
        { label: t('type.other'), href: '/contact?type=autre' },
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
                                    <Instagram size={18} />
                                </a>
                            )}
                            {info.facebook && (
                                <a href={info.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook Mamé Fricoto">
                                    <Facebook size={18} />
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="footer-links footer-nav-col">
                        <h3>{t('footer.navTitle')}</h3>
                        <ul>
                            <li>
                                <Link href="/" className="footer-nav-link">
                                    <span className="footer-link-bullet" aria-hidden="true">›</span>
                                    <span>{t('nav.home')}</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/tarifs" className="footer-nav-link">
                                    <span className="footer-link-bullet" aria-hidden="true">›</span>
                                    <span>{t('nav.tarifs')}</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/galerie" className="footer-nav-link">
                                    <span className="footer-link-bullet" aria-hidden="true">›</span>
                                    <span>{t('nav.creations')}</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/a-propos" className="footer-nav-link">
                                    <span className="footer-link-bullet" aria-hidden="true">›</span>
                                    <span>{t('nav.about')}</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="footer-nav-link">
                                    <span className="footer-link-bullet" aria-hidden="true">›</span>
                                    <span>{t('nav.contact')}</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="footer-links footer-services-col">
                        <h3>{t('footer.servicesTitle')}</h3>
                        <ul>
                            {servicesList.map((service, i) => (
                                <li key={i}>
                                    <Link href={service.href} className="footer-nav-link">
                                        <span className="footer-link-bullet" aria-hidden="true">›</span>
                                        <span>{service.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="footer-contact">
                        <h3>{t('footer.contactTitle')}</h3>
                        <ul>
                            <li>
                                <MapPin size={15} />
                                <span>{trans(info, 'address') || (lang === 'en' ? 'Eyguières, Provence, France' : 'Eyguières, Bouches-du-Rhône')}</span>
                            </li>
                            <li>
                                <Phone size={15} />
                                <a href={`tel:${phoneTel}`}>{phone}</a>
                            </li>
                            <li>
                                <Clock size={15} />
                                <span>{trans(info, 'hours') || (lang === 'en' ? 'Orders before 10 AM' : 'Commandes avant 10h')}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="container footer-bottom-inner">
                    <p className="footer-copyright">&copy; {new Date().getFullYear()} {t('footer.copyright')}</p>
                    <div className="footer-legal-links">
                        <Link href="/mentions-legales" className="footer-legal-link">
                            {t('footer.legalNotice')}
                        </Link>
                        <span className="footer-legal-sep" aria-hidden="true">·</span>
                        <Link href="/politique-de-confidentialite" className="footer-legal-link">
                            {t('footer.privacyPolicy')}
                        </Link>
                    </div>
                    <p className="footer-credits">
                        <span>{t('footer.madeIn')}</span>
                        <span className="footer-legal-sep" aria-hidden="true">·</span>
                        <a
                            href="https://jl-developpement.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="footer-dev-link"
                            title="JL-Développement - Création de sites web professionnels"
                        >
                            {t('footer.credits')}
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
}

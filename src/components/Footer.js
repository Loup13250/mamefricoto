import { getSiteInfo } from '@/lib/data';
import Link from 'next/link';
import './Footer.css';
import { Facebook, Instagram, MapPin, Phone, Clock } from 'lucide-react';

export default async function Footer({ siteInfo }) {
    const info = siteInfo || await getSiteInfo();
    const phone = info.phone || '07 43 64 64 11';
    const phoneTel = phone.replace(/\s+/g, '');

    return (
        <footer className="site-footer">
            <div className="footer-top">
                <div className="container footer-grid">
                    <div className="footer-brand">
                        <span className="footer-name">Mamé Fricoto</span>
                        <p className="footer-tagline">cuisine · maison · partage</p>
                        <p className="footer-desc">
                            Traiteur maison basée à Eyguières. Des plats préparés avec soin,
                            des produits frais et locaux, livrés chez vous ou à retirer au labo.
                        </p>
                        <div className="social-links">
                            {info.instagram && (
                                <a href={info.instagram} target="_blank" rel="noopener noreferrer" aria-label="Suivez Mamé Fricoto sur Instagram (nouvelle fenêtre)">
                                    <Instagram size={20} />
                                </a>
                            )}
                            {info.facebook && (
                                <a href={info.facebook} target="_blank" rel="noopener noreferrer" aria-label="Suivez Mamé Fricoto sur Facebook (nouvelle fenêtre)">
                                    <Facebook size={20} />
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="footer-links">
                        <h3>Navigation</h3>
                        <ul>
                            <li><Link href="/" prefetch={true}>Accueil</Link></li>
                            <li><Link href="/realisations" prefetch={true}>Nos Réalisations</Link></li>
                            <li><Link href="/a-propos" prefetch={true}>À Propos</Link></li>
                            <li><Link href="/contact" prefetch={true}>Contact</Link></li>
                        </ul>
                    </div>

                    <div className="footer-links">
                        <h3>Prestations</h3>
                        <ul>
                            <li>Plat du Jour</li>
                            <li>Événements Privés</li>
                            <li>Repas d&apos;Entreprise</li>
                            <li>Buffet Dînatoire</li>
                        </ul>
                    </div>

                    <div className="footer-contact">
                        <h3>Contact</h3>
                        <ul>
                            <li>
                                <MapPin size={16} />
                                <span>{info.address || 'Eyguières, Bouches-du-Rhône'}</span>
                            </li>
                            <li>
                                <Phone size={16} />
                                <a href={`tel:${phoneTel}`}>{phone}</a>
                            </li>
                            <li>
                                <Clock size={16} />
                                <span>{info.hours || 'Commandes avant 10h'}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="container footer-bottom-inner">
                    <p>&copy; {new Date().getFullYear()} Mamé Fricoto. Tous droits réservés.</p>
                    <p>Fait à Eyguières, Bouches-du-Rhône</p>
                </div>
            </div>
        </footer>
    );
}

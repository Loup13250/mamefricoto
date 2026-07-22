import { getSiteInfo } from '@/lib/data';
import Link from 'next/link';
import './Footer.css';
import { Facebook, Instagram, MapPin, Phone, Clock, Star } from 'lucide-react';

export default function Footer() {
    const info = getSiteInfo();

    return (
        <footer className="site-footer">
            <div className="container footer-grid">
                <div className="footer-brand">
                    <h2 className="footer-logo">Mamé Fricoto</h2>
                    <p className="footer-tagline">cuisine · maison · partage</p>
                    <p className="description">
                        Traiteur maison basée à Eyguières. Des plats préparés avec amour,
                        des produits frais et locaux, livrés chez vous ou à retirer au labo.
                    </p>
                    <div className="social-links">
                        {info.instagram && (
                            <a href={info.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                <Instagram size={24} />
                            </a>
                        )}
                        {info.facebook && (
                            <a href={info.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                <Facebook size={24} />
                            </a>
                        )}
                        {info.google_reviews && (
                            <a href={info.google_reviews} target="_blank" rel="noopener noreferrer" aria-label="Avis Google" className="google-reviews-link">
                                <Star size={24} />
                            </a>
                        )}
                    </div>
                </div>

                <div className="footer-links">
                    <h3>Navigation</h3>
                    <ul>
                        <li><Link href="/">Accueil</Link></li>
                        <li><Link href="/a-propos">À Propos</Link></li>
                        <li><Link href="/contact">Contact</Link></li>
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
                        <li><MapPin size={18} /> {info.address || 'Eyguières, Bouches-du-Rhône'}</li>
                        <li><Phone size={18} /> <a href="tel:0743646411">{info.phone || '07 43 64 64 11'}</a></li>
                        <li><Clock size={18} /> {info.hours || 'Commandes avant 10h'}</li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Mamé Fricoto. Tous droits réservés. Fait avec ❤️ à Eyguières.</p>
            </div>
        </footer>
    );
}

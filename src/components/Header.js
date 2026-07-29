'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Menu as MenuIcon, X as XIcon, Phone, Instagram, Facebook, MapPin } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import './Header.css';

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const isHome = pathname === '/';

    useEffect(() => {
        setScrolled(window.scrollY > 60);
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const prevPathnameRef = useRef(pathname);

    useEffect(() => {
        if (pathname !== prevPathnameRef.current) {
            prevPathnameRef.current = pathname;
            setMobileMenuOpen(false);
        }
    }, [pathname]);

    const closeMobileMenu = () => setMobileMenuOpen(false);
    const toggleMobileMenu = () => setMobileMenuOpen((open) => !open);

    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileMenuOpen]);

    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape' && mobileMenuOpen) {
                closeMobileMenu();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [mobileMenuOpen]);

    const isTop = isHome && !scrolled && !mobileMenuOpen;

    return (
        <header className={`site-header ${isTop ? 'header--hero' : 'header--solid'}`}>
            <div className="container header-inner">
                <Link href="/" className="logo-link" aria-label="Mamé Fricoto — Accueil">
                    <Image
                        src="/logo.png"
                        alt="Mamé Fricoto"
                        width={130}
                        height={46}
                        className="logo-img"
                        style={{ width: 'auto', height: '44px' }}
                        priority
                    />
                </Link>

                <nav className="site-nav" aria-label="Navigation principale">
                    <Link href="/" className={pathname === '/' ? 'nav-link active' : 'nav-link'}>Accueil</Link>
                    <Link href="/a-propos" className={pathname === '/a-propos' ? 'nav-link active' : 'nav-link'}>À Propos</Link>
                    <Link href="/contact" className={pathname === '/contact' ? 'nav-link active' : 'nav-link'}>Contact</Link>
                </nav>

                <div className="header-actions-right">
                    <div className="header-cta">
                        <a href="tel:#" onClick={(e) => e.preventDefault()} className="cta-phone-btn">
                            <Phone size={14} />
                            07 43 <span style={{ filter: 'blur(4px)', userSelect: 'none', opacity: 0.8 }}>64 64</span> 11
                        </a>
                    </div>
                    <ThemeToggle />
                </div>

                <button
                    type="button"
                    className="mobile-toggle"
                    onClick={toggleMobileMenu}
                    aria-expanded={mobileMenuOpen}
                    aria-controls="mobile-nav"
                    aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                >
                    {mobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
                </button>

                <div
                    className={`mobile-backdrop ${mobileMenuOpen ? 'open' : ''}`}
                    onClick={closeMobileMenu}
                    aria-hidden={!mobileMenuOpen}
                />

                <div
                    id="mobile-nav"
                    className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}
                    role="dialog"
                    aria-modal="true"
                    aria-hidden={!mobileMenuOpen}
                >
                    {/* Drawer Header */}
                    <div className="mobile-drawer-header">
                        <div className="mobile-drawer-brand">
                            <span className="mobile-drawer-title">Mamé Fricoto</span>
                            <span className="mobile-drawer-sub">Cuisine Familiale &amp; Fait Maison</span>
                        </div>
                        <button
                            type="button"
                            className="mobile-drawer-close"
                            onClick={closeMobileMenu}
                            aria-label="Fermer le menu"
                        >
                            <XIcon size={22} />
                        </button>
                    </div>

                    {/* Main Nav Links (centered) */}
                    <nav className="mobile-nav-body" aria-label="Navigation mobile">
                        <Link href="/" className={pathname === '/' ? 'mobile-link active' : 'mobile-link'} onClick={closeMobileMenu}>
                            Accueil
                        </Link>
                        <Link href="/a-propos" className={pathname === '/a-propos' ? 'mobile-link active' : 'mobile-link'} onClick={closeMobileMenu}>
                            À Propos
                        </Link>
                        <Link href="/contact" className={pathname === '/contact' ? 'mobile-link active' : 'mobile-link'} onClick={closeMobileMenu}>
                            Contact &amp; Devis
                        </Link>
                    </nav>

                    {/* Drawer Footer */}
                    <div className="mobile-drawer-footer">
                        <ThemeToggle showLabel className="drawer-theme-toggle" />

                        <a href="tel:#" className="mobile-phone-cta" onClick={(e) => { e.preventDefault(); closeMobileMenu(); }}>
                            <Phone size={16} />
                            <span>07 43 <span style={{ filter: 'blur(4px)', userSelect: 'none', opacity: 0.8 }}>64 64</span> 11</span>
                        </a>

                        <div className="mobile-location-tag">
                            <MapPin size={13} style={{ color: 'var(--gold)' }} />
                            <span>Livraison &amp; Retrait à Eyguières (13)</span>
                        </div>

                        <div className="mobile-socials">
                            <a href="https://www.instagram.com/mamefricoto/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                <Instagram size={18} />
                            </a>
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                <Facebook size={18} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

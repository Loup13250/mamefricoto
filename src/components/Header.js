'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Menu as MenuIcon, X as XIcon, Phone } from 'lucide-react';
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

    const headerClass = (!isHome || scrolled || mobileMenuOpen) ? 'site-header--scrolled' : 'site-header--top';

    return (
        <header className={`site-header ${headerClass}`}>
            <div className="container header-container">
                <Link href="/" className="logo-link" aria-label="Mamé Fricoto — Accueil">
                    <Image
                        src="/logo.png"
                        alt="Mamé Fricoto"
                        width={140}
                        height={50}
                        className="logo-img"
                        priority
                    />
                </Link>

                <nav className="site-nav">
                    <Link href="/" className={pathname === '/' ? 'active' : ''}>Accueil</Link>
                    <Link href="/a-propos" className={pathname === '/a-propos' ? 'active' : ''}>À Propos</Link>
                    <Link href="/contact" className={pathname === '/contact' ? 'active' : ''}>Contact</Link>
                </nav>

                <div className="header-actions">
                    <a href="tel:0743646411" className="btn-primary header-cta-btn">
                        <Phone size={16} />
                        Commander
                    </a>
                </div>

                <button
                    type="button"
                    className="mobile-menu-toggle"
                    onClick={toggleMobileMenu}
                    aria-expanded={mobileMenuOpen}
                    aria-controls="mobile-navigation"
                    aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu de navigation'}
                >
                    {mobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
                </button>

                <div
                    className={`mobile-drawer-backdrop ${mobileMenuOpen ? 'open' : ''}`}
                    onClick={closeMobileMenu}
                    aria-hidden={!mobileMenuOpen}
                />

                <div
                    id="mobile-navigation"
                    className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}
                    role="dialog"
                    aria-modal="true"
                    aria-hidden={!mobileMenuOpen}
                >
                    <nav className="mobile-nav" aria-label="Navigation mobile">
                        <Link href="/" className={pathname === '/' ? 'active' : ''} onClick={closeMobileMenu}>Accueil</Link>
                        <Link href="/a-propos" className={pathname === '/a-propos' ? 'active' : ''} onClick={closeMobileMenu}>À Propos</Link>
                        <Link href="/contact" className={pathname === '/contact' ? 'active' : ''} onClick={closeMobileMenu}>Contact</Link>
                        <a href="tel:0743646411" className="btn-primary mobile-cta-btn" onClick={closeMobileMenu}>
                            <Phone size={18} />
                            Commander — 07 43 64 64 11
                        </a>
                    </nav>
                </div>
            </div>
        </header>
    );
}

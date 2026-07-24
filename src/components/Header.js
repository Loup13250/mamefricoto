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

                <div className="header-cta">
                    <a href="tel:0743646411" className="cta-phone-btn">
                        <Phone size={14} />
                        07 43 64 64 11
                    </a>
                </div>

                <button
                    type="button"
                    className="mobile-toggle"
                    onClick={toggleMobileMenu}
                    aria-expanded={mobileMenuOpen}
                    aria-controls="mobile-nav"
                    aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                >
                    {mobileMenuOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
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
                    <nav className="mobile-nav-links" aria-label="Navigation mobile">
                        <Link href="/" className={pathname === '/' ? 'mobile-link active' : 'mobile-link'} onClick={closeMobileMenu}>Accueil</Link>
                        <Link href="/a-propos" className={pathname === '/a-propos' ? 'mobile-link active' : 'mobile-link'} onClick={closeMobileMenu}>À Propos</Link>
                        <Link href="/contact" className={pathname === '/contact' ? 'mobile-link active' : 'mobile-link'} onClick={closeMobileMenu}>Contact</Link>
                        <a href="tel:0743646411" className="btn-gold mobile-cta" onClick={closeMobileMenu}>
                            <Phone size={16} />
                            Commander — 07 43 64 64 11
                        </a>
                    </nav>
                </div>
            </div>
        </header>
    );
}

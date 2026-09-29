'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Menu as MenuIcon, X as XIcon, Phone, Instagram, Facebook, MapPin } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import LanguageToggle from './LanguageToggle';
import './Header.css';

export default function Header({ siteInfo }) {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const isHome = pathname === '/';
    const { t, trans } = useLanguage();

    const phone = siteInfo?.phone || '07 43 64 64 11';
    const phoneTel = phone.replace(/\s+/g, '');
    const logoSrc = siteInfo?.site_icon || siteInfo?.logo || '/icon.svg';

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
                <Link href="/" className="logo-link" aria-label={`Mamé Fricoto — ${t('nav.home')}`}>
                    <div className="logo-round-wrap">
                        <Image
                            src={logoSrc}
                            alt="Mamé Fricoto"
                            width={48}
                            height={48}
                            className="logo-img"
                            priority
                            unoptimized
                        />
                    </div>
                </Link>

                <nav className="site-nav" aria-label="Navigation principale">
                    <Link href="/" prefetch={true} className={pathname === '/' ? 'nav-link active' : 'nav-link'}>
                        {t('nav.home')}
                    </Link>
                    <Link href="/tarifs" prefetch={true} className={pathname === '/tarifs' || pathname === '/prestations' ? 'nav-link active' : 'nav-link'}>
                        {t('nav.tarifs')}
                    </Link>
                    <Link href="/galerie" prefetch={true} className={pathname === '/galerie' || pathname === '/realisations' ? 'nav-link active' : 'nav-link'}>
                        {t('nav.creations')}
                    </Link>
                    <Link href="/a-propos" prefetch={true} className={pathname === '/a-propos' ? 'nav-link active' : 'nav-link'}>
                        {t('nav.about')}
                    </Link>
                    <Link href="/contact" prefetch={true} className={pathname === '/contact' ? 'nav-link active' : 'nav-link'}>
                        {t('nav.contact')}
                    </Link>
                </nav>

                <div className="header-actions-right">
                    <div className="header-cta">
                        <a href={`tel:${phoneTel}`} className="cta-phone-btn" title={`${t('nav.callUs')} ${phone}`}>
                            <Phone size={14} />
                            {phone}
                        </a>
                    </div>
                    <LanguageToggle />
                </div>

                <button
                    type="button"
                    className="mobile-toggle"
                    onClick={toggleMobileMenu}
                    aria-expanded={mobileMenuOpen}
                    aria-controls="mobile-nav"
                    aria-label={mobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
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
                    {...(!mobileMenuOpen ? { inert: '' } : {})}
                >
                    {/* Drawer Header */}
                    <div className="mobile-drawer-header">
                        <div className="mobile-drawer-brand">
                            <span className="mobile-drawer-title">Mamé Fricoto</span>
                            <span className="mobile-drawer-sub">{t('nav.brandSubtitle')}</span>
                        </div>
                        <button
                            type="button"
                            className="mobile-drawer-close"
                            onClick={closeMobileMenu}
                            aria-label={t('nav.closeMenu')}
                        >
                            <XIcon size={22} />
                        </button>
                    </div>

                    {/* Main Nav Links */}
                    <nav className="mobile-nav-body" aria-label="Navigation mobile">
                        <Link href="/" prefetch={true} className={pathname === '/' ? 'mobile-link active' : 'mobile-link'} onClick={closeMobileMenu}>
                            {t('nav.home')}
                        </Link>
                        <Link href="/tarifs" prefetch={true} className={pathname === '/tarifs' || pathname === '/prestations' ? 'mobile-link active' : 'mobile-link'} onClick={closeMobileMenu}>
                            {t('nav.tarifs')}
                        </Link>
                        <Link href="/galerie" prefetch={true} className={pathname === '/galerie' || pathname === '/realisations' ? 'mobile-link active' : 'mobile-link'} onClick={closeMobileMenu}>
                            {t('nav.creations')}
                        </Link>
                        <Link href="/a-propos" prefetch={true} className={pathname === '/a-propos' ? 'mobile-link active' : 'mobile-link'} onClick={closeMobileMenu}>
                            {t('nav.about')}
                        </Link>
                        <Link href="/contact" prefetch={true} className={pathname === '/contact' ? 'mobile-link active' : 'mobile-link'} onClick={closeMobileMenu}>
                            {t('nav.contact')}
                        </Link>
                    </nav>

                    {/* Drawer Footer */}
                    <div className="mobile-drawer-footer">
                        <LanguageToggle showLabel className="drawer-theme-toggle" />

                        <a href={`tel:${phoneTel}`} className="mobile-phone-cta">
                            <Phone size={16} />
                            <span>{phone}</span>
                        </a>

                        <div className="mobile-location-tag">
                            <MapPin size={13} style={{ color: 'var(--gold)' }} />
                            <span>{trans(siteInfo, 'address') || 'Eyguières, Bouches-du-Rhône'}</span>
                        </div>

                        <div className="mobile-socials">
                            {siteInfo?.instagram && (
                                <a href={siteInfo.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                    <Instagram size={18} />
                                </a>
                            )}
                            {siteInfo?.facebook && (
                                <a href={siteInfo.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                    <Facebook size={18} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

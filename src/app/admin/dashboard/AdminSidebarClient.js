'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { adminLogout } from '@/app/actions';
import { 
    LayoutDashboard, 
    CalendarDays, 
    Image as ImageIcon, 
    Settings, 
    LogOut, 
    ChefHat, 
    Mail, 
    Camera, 
    Menu as MenuIcon, 
    X,
    ExternalLink,
    Heart,
    Receipt,
    Sparkles,
    ChevronRight
} from 'lucide-react';

export default function AdminSidebarClient({ children, unreadCount = 0 }) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [prevPathname, setPrevPathname] = useState(pathname);
    if (prevPathname !== pathname) {
        setPrevPathname(pathname);
        setMobileOpen(false);
    }

    // Helpers d'état actif
    const isAccueilActive = pathname === '/admin/dashboard';
    const isMenuSemaineActive = pathname === '/admin/dashboard/menu-semaine';
    const isCarouselActive = pathname === '/admin/dashboard/carousel';
    const isTarifsActive = pathname === '/admin/dashboard/tarifs' || pathname === '/admin/dashboard/prestations';
    const isGalerieActive = pathname === '/admin/dashboard/galerie';
    const isAProposActive = pathname === '/admin/dashboard/a-propos';
    const isMessagesActive = pathname === '/admin/dashboard/messages';
    const isSettingsActive = pathname === '/admin/dashboard/settings';

    return (
        <div className="admin-dashboard-layout">
            {/* Header Mobile */}
            <header className="admin-mobile-header">
                <a href="/" target="_blank" rel="noopener noreferrer" className="brand-title">
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #C8A96E, #9C7232)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0E0D0C',
                        boxShadow: '0 2px 8px rgba(200, 169, 110, 0.3)'
                    }}>
                        <ChefHat size={18} />
                    </div>
                    <span style={{ fontWeight: '600', letterSpacing: '0.02em' }}>Mamé Fricoto</span>
                </a>
                <button
                    className="admin-mobile-toggle"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Menu"
                >
                    {mobileOpen ? <X size={22} /> : <MenuIcon size={22} />}
                </button>
            </header>

            {/* Voile sombre pour mobile */}
            <div
                className={`admin-sidebar-overlay ${mobileOpen ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
            />

            {/* Sidebar Principale */}
            <aside className={`admin-sidebar ${mobileOpen ? 'open' : ''}`}>
                {/* Brand Header */}
                <div className="admin-brand-header">
                    <a href="/" target="_blank" rel="noopener noreferrer" className="admin-brand-link" title="Voir le site public">
                        <div className="admin-brand-icon">
                            <ChefHat size={22} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="admin-brand-title">Mamé Fricoto</span>
                            <span className="admin-brand-sub">Administration Traiteur</span>
                        </div>
                    </a>
                </div>

                {/* Navigation Navigation principale ordonnée selon le site */}
                <nav className="admin-nav-container">
                    {/* SECTION: PAGES DU SITE */}
                    <div className="admin-nav-section-title">
                        <span>PAGES DU SITE</span>
                    </div>

                    {/* 1. ACCUEIL */}
                    <div className="admin-nav-group">
                        <Link
                            href="/admin/dashboard"
                            className={`admin-nav-item ${isAccueilActive ? 'active' : ''}`}
                        >
                            <div className="admin-nav-item-icon">
                                <LayoutDashboard size={18} />
                            </div>
                            <span className="admin-nav-item-text">Accueil</span>
                            {isAccueilActive && <span className="admin-nav-active-pill" />}
                        </Link>

                        {/* Sous-items Accueil : Menu de la semaine & Carrousel */}
                        <div className="admin-nav-sublist">
                            <Link
                                href="/admin/dashboard/menu-semaine"
                                className={`admin-nav-subitem ${isMenuSemaineActive ? 'active' : ''}`}
                            >
                                <CalendarDays size={14} />
                                <span>Menu de la Semaine</span>
                            </Link>
                            <Link
                                href="/admin/dashboard/carousel"
                                className={`admin-nav-subitem ${isCarouselActive ? 'active' : ''}`}
                            >
                                <ImageIcon size={14} />
                                <span>Carrousel Bannière</span>
                            </Link>
                        </div>
                    </div>

                    {/* 2. TARIFS */}
                    <Link
                        href="/admin/dashboard/tarifs"
                        className={`admin-nav-item ${isTarifsActive ? 'active' : ''}`}
                    >
                        <div className="admin-nav-item-icon">
                            <Receipt size={18} />
                        </div>
                        <span className="admin-nav-item-text">Tarifs</span>
                        {isTarifsActive && <span className="admin-nav-active-pill" />}
                    </Link>

                    {/* 3. GALERIE */}
                    <Link
                        href="/admin/dashboard/galerie"
                        className={`admin-nav-item ${isGalerieActive ? 'active' : ''}`}
                    >
                        <div className="admin-nav-item-icon">
                            <Camera size={18} />
                        </div>
                        <span className="admin-nav-item-text">Galerie</span>
                        {isGalerieActive && <span className="admin-nav-active-pill" />}
                    </Link>

                    {/* 4. À PROPOS (Histoire, Photo & Prestations) */}
                    <Link
                        href="/admin/dashboard/a-propos"
                        className={`admin-nav-item ${isAProposActive ? 'active' : ''}`}
                    >
                        <div className="admin-nav-item-icon">
                            <Heart size={18} />
                        </div>
                        <span className="admin-nav-item-text">À Propos</span>
                        {isAProposActive && <span className="admin-nav-active-pill" />}
                    </Link>

                    {/* 5. CONTACT & DEVIS */}
                    <Link
                        href="/admin/dashboard/messages"
                        className={`admin-nav-item ${isMessagesActive ? 'active' : ''}`}
                    >
                        <div className="admin-nav-item-icon">
                            <Mail size={18} />
                        </div>
                        <span className="admin-nav-item-text">Contact &amp; Devis</span>
                        {unreadCount > 0 ? (
                            <span className="admin-nav-badge-unread">{unreadCount}</span>
                        ) : (
                            isMessagesActive && <span className="admin-nav-active-pill" />
                        )}
                    </Link>

                    {/* SECTION: SYSTÈME */}
                    <div className="admin-nav-section-title" style={{ marginTop: '1.25rem' }}>
                        <span>PARAMÈTRES</span>
                    </div>

                    {/* 6. INFORMATIONS SITE */}
                    <Link
                        href="/admin/dashboard/settings"
                        className={`admin-nav-item ${isSettingsActive ? 'active' : ''}`}
                    >
                        <div className="admin-nav-item-icon">
                            <Settings size={18} />
                        </div>
                        <span className="admin-nav-item-text">Informations Site</span>
                        {isSettingsActive && <span className="admin-nav-active-pill" />}
                    </Link>
                </nav>

                {/* Footer Sidebar : Lien site public + Déconnexion */}
                <div className="admin-sidebar-footer-custom">
                    <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-sidebar-public-btn"
                        title="Ouvrir le site public dans un nouvel onglet"
                    >
                        <ExternalLink size={15} />
                        <span>Voir le site public</span>
                    </a>

                    <form action={adminLogout} style={{ marginTop: '0.5rem' }}>
                        <button
                            type="submit"
                            className="admin-sidebar-logout-btn"
                            title="Se déconnecter de l'administration"
                        >
                            <LogOut size={16} />
                            <span>Déconnexion</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Contenu principal */}
            <main className="admin-content">
                {children}
            </main>
        </div>
    );
}

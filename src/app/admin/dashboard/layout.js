'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { adminLogout } from '@/app/actions';
import { LayoutDashboard, CalendarDays, Image as ImageIcon, Settings, LogOut, ChefHat, Mail, Camera, Menu as MenuIcon, X } from 'lucide-react';

import ThemeToggle from '@/components/ThemeToggle';

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Close mobile drawer on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    return (
        <div className="admin-dashboard-layout">
            {/* Mobile Header Bar */}
            <header className="admin-mobile-header">
                <a href="/" target="_blank" rel="noopener noreferrer" className="brand-title">
                    <ChefHat size={22} style={{ color: 'var(--admin-gold)' }} />
                    <span>Mamé Fricoto</span>
                </a>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ThemeToggle />
                    <button
                        className="admin-mobile-toggle"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle navigation"
                    >
                        {mobileOpen ? <X size={22} /> : <MenuIcon size={22} />}
                    </button>
                </div>
            </header>

            {/* Backdrop Overlay */}
            <div
                className={`admin-sidebar-overlay ${mobileOpen ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`admin-sidebar ${mobileOpen ? 'open' : ''}`}>
                <div className="brand">
                    <a href="/" target="_blank" rel="noopener noreferrer" className="brand-link">
                        <div className="brand-icon">
                            <ChefHat size={20} />
                        </div>
                        <span>Mamé Fricoto</span>
                    </a>
                </div>
                <nav className="admin-nav">
                    <Link href="/admin/dashboard" className={`admin-nav-link ${pathname === '/admin/dashboard' ? 'active' : ''}`}>
                        <LayoutDashboard size={18} />
                        <span>Vue d&apos;ensemble</span>
                    </Link>
                    <Link href="/admin/dashboard/menu-semaine" className={`admin-nav-link ${pathname === '/admin/dashboard/menu-semaine' ? 'active' : ''}`}>
                        <CalendarDays size={18} />
                        <span>Menu de la Semaine</span>
                    </Link>
                    <Link href="/admin/dashboard/messages" className={`admin-nav-link ${pathname === '/admin/dashboard/messages' ? 'active' : ''}`}>
                        <Mail size={18} />
                        <span>Messages & Contacts</span>
                    </Link>
                    <Link href="/admin/dashboard/galerie" className={`admin-nav-link ${pathname === '/admin/dashboard/galerie' ? 'active' : ''}`}>
                        <Camera size={18} />
                        <span>Nos Réalisations</span>
                    </Link>
                    <Link href="/admin/dashboard/carousel" className={`admin-nav-link ${pathname === '/admin/dashboard/carousel' ? 'active' : ''}`}>
                        <ImageIcon size={18} />
                        <span>Photos Carrousel</span>
                    </Link>
                    <Link href="/admin/dashboard/prestations" className={`admin-nav-link ${pathname === '/admin/dashboard/prestations' ? 'active' : ''}`}>
                        <ChefHat size={18} />
                        <span>Prestations & Services</span>
                    </Link>
                    <Link href="/admin/dashboard/settings" className={`admin-nav-link ${pathname === '/admin/dashboard/settings' ? 'active' : ''}`}>
                        <Settings size={18} />
                        <span>Informations Site</span>
                    </Link>
                </nav>
                <div className="admin-sidebar-footer">
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.25rem' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-subtle)', fontWeight: '600' }}>Thème</span>
                        <ThemeToggle showLabel />
                    </div>
                    <form action={adminLogout}>
                        <button type="submit" className="admin-nav-link" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <LogOut size={18} />
                            <span>Déconnexion</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-content">
                {children}
            </main>
        </div>
    );
}

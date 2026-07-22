'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { adminLogout } from '@/app/actions';
import { LayoutDashboard, Newspaper, CalendarDays, Image as ImageIcon, Settings, LogOut, ChefHat, Mail, Camera } from 'lucide-react';

export default function DashboardLayout({ children }) {
    const pathname = usePathname();

    return (
        <div className="admin-dashboard-layout">
            <aside className="admin-sidebar">
                <div className="brand">
                    <Link href="/" className="brand-link" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'inherit' }}>
                        <div className="brand-icon">
                            <ChefHat size={18} />
                        </div>
                        Mamé Fricoto
                    </Link>
                </div>
                <nav className="admin-nav">
                    <Link href="/admin/dashboard" className={`admin-nav-link ${pathname === '/admin/dashboard' ? 'active' : ''}`}>
                        <LayoutDashboard size={18} /> Vue d&apos;ensemble
                    </Link>
                    <Link href="/admin/dashboard/menu-semaine" className={`admin-nav-link ${pathname === '/admin/dashboard/menu-semaine' ? 'active' : ''}`}>
                        <CalendarDays size={18} /> Menu de la Semaine
                    </Link>
                    <Link href="/admin/dashboard/messages" className={`admin-nav-link ${pathname === '/admin/dashboard/messages' ? 'active' : ''}`}>
                        <Mail size={18} /> Messages & Contacts
                    </Link>
                    <Link href="/admin/dashboard/galerie" className={`admin-nav-link ${pathname === '/admin/dashboard/galerie' ? 'active' : ''}`}>
                        <Camera size={18} /> Galerie Instagram / Stories
                    </Link>
                    <Link href="/admin/dashboard/articles" className={`admin-nav-link ${pathname === '/admin/dashboard/articles' ? 'active' : ''}`}>
                        <Newspaper size={18} /> Actualités
                    </Link>
                    <Link href="/admin/dashboard/carousel" className={`admin-nav-link ${pathname === '/admin/dashboard/carousel' ? 'active' : ''}`}>
                        <ImageIcon size={18} /> Photos Carrousel
                    </Link>
                    <Link href="/admin/dashboard/settings" className={`admin-nav-link ${pathname === '/admin/dashboard/settings' ? 'active' : ''}`}>
                        <Settings size={18} /> Informations & Images Site
                    </Link>
                </nav>
                <div style={{ padding: '1rem', borderTop: '1px solid var(--admin-border)' }}>
                    <form action={adminLogout}>
                        <button type="submit" className="admin-nav-link" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '0.75rem 1.5rem' }}>
                            <LogOut size={18} /> Déconnexion
                        </button>
                    </form>
                </div>
            </aside>
            <main className="admin-content">
                {children}
            </main>
        </div>
    );
}

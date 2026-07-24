import Link from 'next/link';
import { getSiteInfo, getCurrentWeeklyMenu, getContactMessages, getUnreadMessageCount, getGalleryPosts } from '@/lib/data';
import { CalendarDays, Mail, Camera, Settings, ExternalLink, ArrowRight, Clock, Phone, MapPin, MessageSquare, Image as ImageIcon, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Dashboard | Admin Mamé Fricoto',
};

export default async function DashboardOverview() {
    const info = await getSiteInfo();
    const currentMenu = await getCurrentWeeklyMenu();
    const messages = await getContactMessages();
    const unreadCount = await getUnreadMessageCount();
    const galleryPosts = await getGalleryPosts();

    const recentMessages = messages.slice(0, 3);

    return (
        <div className="anim-fade" style={{ width: '100%' }}>
            {/* Header section with site link */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div>
                    <span className="label" style={{ display: 'block', marginBottom: '0.4rem' }}>Tableau de bord</span>
                    <h1 className="title-md" style={{ color: 'var(--admin-text)', marginBottom: '0.3rem' }}>
                        Bienvenue, Mamé Fricoto 👋
                    </h1>
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.95rem' }}>
                        Gérez vos menus, messages et visuels en toute simplicité.
                    </p>
                </div>
                <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-btn admin-btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '10px 18px', fontSize: '0.85rem' }}
                >
                    <ExternalLink size={16} /> Voir le site public
                </a>
            </div>

            {/* Practical Notification & Status Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
                
                {/* 1. Messages Notification Card */}
                <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem', position: 'relative' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: unreadCount > 0 ? 'rgba(196, 89, 58, 0.15)' : 'rgba(200, 169, 110, 0.1)', borderRadius: '10px', color: unreadCount > 0 ? '#E06D53' : 'var(--admin-gold)' }}>
                                <Mail size={24} />
                            </div>
                            {unreadCount > 0 && (
                                <span style={{ background: '#C4593A', color: '#fff', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.05em' }}>
                                    {unreadCount} NON LU{unreadCount > 1 ? 'S' : ''}
                                </span>
                            )}
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--admin-text)', marginBottom: '0.2rem' }}>
                            Messages & Demandes
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                            {messages.length} message{messages.length > 1 ? 's' : ''} au total dans la boîte de réception.
                        </p>
                    </div>
                    <Link href="/admin/dashboard/messages" style={{ marginTop: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-gold)', textDecoration: 'none' }}>
                        Accéder aux messages <ArrowRight size={14} />
                    </Link>
                </div>

                {/* 2. Menu de la semaine Status Card */}
                <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(200, 169, 110, 0.1)', borderRadius: '10px', color: 'var(--admin-gold)' }}>
                                <CalendarDays size={24} />
                            </div>
                            <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontSize: '0.75rem', fontWeight: '600', padding: '3px 10px', borderRadius: '20px' }}>
                                MENU ACTIF
                            </span>
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--admin-text)', marginBottom: '0.2rem' }}>
                            {currentMenu ? currentMenu.title : 'Aucun menu actif'}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                            {currentMenu?.week_dates ? `Période : ${currentMenu.week_dates}` : 'Mettez à jour le menu publié sur le site.'}
                        </p>
                    </div>
                    <Link href="/admin/dashboard/menu-semaine" style={{ marginTop: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-gold)', textDecoration: 'none' }}>
                        Gérer le menu de la semaine <ArrowRight size={14} />
                    </Link>
                </div>

                {/* 3. Galerie Instagram */}
                <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(200, 169, 110, 0.1)', borderRadius: '10px', color: 'var(--admin-gold)' }}>
                                <Camera size={24} />
                            </div>
                            <span style={{ fontSize: '1.3rem', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--admin-text)' }}>
                                {galleryPosts.length}
                            </span>
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--admin-text)', marginBottom: '0.2rem' }}>
                            Galerie & Réalisations
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                            Photos et vidéos affichées dans la galerie du site.
                        </p>
                    </div>
                    <Link href="/admin/dashboard/galerie" style={{ marginTop: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-gold)', textDecoration: 'none' }}>
                        Ajouter / Modifier des visuels <ArrowRight size={14} />
                    </Link>
                </div>

            </div>

            {/* Quick Navigation Tools Grid */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--admin-text)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={18} style={{ color: 'var(--admin-gold)' }} /> Raccourcis de Gestion
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <Link href="/admin/dashboard/menu-semaine" className="admin-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', transition: 'transform 0.2s, border-color 0.2s' }}>
                        <div style={{ padding: '0.6rem', background: 'rgba(200,169,110,0.1)', borderRadius: '8px', color: 'var(--admin-gold)' }}>
                            <CalendarDays size={20} />
                        </div>
                        <div>
                            <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--admin-text)' }}>Menu de la semaine</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>Modifier le menu</span>
                        </div>
                    </Link>

                    <Link href="/admin/dashboard/messages" className="admin-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
                        <div style={{ padding: '0.6rem', background: 'rgba(196,89,58,0.1)', borderRadius: '8px', color: '#E06D53' }}>
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--admin-text)' }}>Voir les messages</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{unreadCount > 0 ? `${unreadCount} non lu(s)` : 'Aucun nouveau'}</span>
                        </div>
                    </Link>

                    <Link href="/admin/dashboard/galerie" className="admin-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
                        <div style={{ padding: '0.6rem', background: 'rgba(200,169,110,0.1)', borderRadius: '8px', color: 'var(--admin-gold)' }}>
                            <Camera size={20} />
                        </div>
                        <div>
                            <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--admin-text)' }}>Galerie Insta</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>Publier une photo</span>
                        </div>
                    </Link>

                    <Link href="/admin/dashboard/carousel" className="admin-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
                        <div style={{ padding: '0.6rem', background: 'rgba(200,169,110,0.1)', borderRadius: '8px', color: 'var(--admin-gold)' }}>
                            <ImageIcon size={20} />
                        </div>
                        <div>
                            <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--admin-text)' }}>Bannière Accueil</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>Carrousel principal</span>
                        </div>
                    </Link>

                    <Link href="/admin/dashboard/settings" className="admin-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
                        <div style={{ padding: '0.6rem', background: 'rgba(200,169,110,0.1)', borderRadius: '8px', color: 'var(--admin-gold)' }}>
                            <Settings size={20} />
                        </div>
                        <div>
                            <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--admin-text)' }}>Infos du site</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>Téléphone, À propos...</span>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Recent Messages Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                <div className="admin-card">
                    <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mail size={18} style={{ color: 'var(--admin-gold)' }} /> Derniers messages reçus
                        </h2>
                        <Link href="/admin/dashboard/messages" style={{ fontSize: '0.85rem', color: 'var(--admin-gold)', textDecoration: 'none', fontWeight: '600' }}>
                            Tout voir →
                        </Link>
                    </div>

                    {recentMessages.length === 0 ? (
                        <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>
                            Aucun message reçu pour le moment.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {recentMessages.map(msg => (
                                <div key={msg.id} style={{
                                    padding: '1rem',
                                    borderRadius: '6px',
                                    background: msg.is_read ? 'rgba(255,255,255,0.02)' : 'rgba(200,169,110,0.06)',
                                    border: `1px solid ${msg.is_read ? 'var(--admin-border)' : 'rgba(200,169,110,0.25)'}`,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '0.5rem'
                                }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                            <strong style={{ fontSize: '0.95rem', color: 'var(--admin-text)' }}>{msg.name}</strong>
                                            {msg.event_type && (
                                                <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(196,89,58,0.2)', color: '#E06D53', borderRadius: '4px', textTransform: 'uppercase', fontWeight: '700' }}>
                                                    {msg.event_type}
                                                </span>
                                            )}
                                            {!msg.is_read && (
                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C4593A' }}></span>
                                            )}
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '500px' }}>
                                            {msg.message}
                                        </p>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                                        {msg.created_at ? new Date(msg.created_at).toLocaleDateString('fr-FR') : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

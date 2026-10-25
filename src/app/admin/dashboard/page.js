import Link from 'next/link';
import { getCurrentWeeklyMenu, getContactMessages, getUnreadMessageCount, getGalleryPosts } from '@/lib/data';
import { CalendarDays, Mail, Camera, Settings, ExternalLink, ArrowRight, MessageSquare, Image as ImageIcon, Receipt, Heart, Languages, History } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Tableau de bord | Admin Mamé Fricoto',
};

const SHORTCUTS = [
    { href: '/admin/dashboard/menu-semaine', icon: CalendarDays, title: 'Menu de la semaine', text: 'Mettre à jour la carte' },
    { href: '/admin/dashboard/carousel', icon: ImageIcon, title: 'Carrousel d\u2019accueil', text: 'Photos plein écran' },
    { href: '/admin/dashboard/tarifs', icon: Receipt, title: 'Tarifs & cartes', text: 'Formules et cartes PDF' },
    { href: '/admin/dashboard/galerie', icon: Camera, title: 'Galerie photos', text: 'Coulisses et plats' },
    { href: '/admin/dashboard/a-propos', icon: Heart, title: 'À propos', text: 'Photo officielle et histoire' },
    { href: '/admin/dashboard/messages', icon: MessageSquare, title: 'Contact & devis', text: 'Boîte de réception' },
    { href: '/admin/dashboard/textes', icon: Languages, title: 'Textes du site', text: 'Éditeur bilingue FR / EN' },
    { href: '/admin/dashboard/settings', icon: Settings, title: 'Infos & réglages', text: 'Téléphone, logo et favicon' },
    { href: '/admin/dashboard/logs', icon: History, title: 'Journal d\u2019activité', text: 'Modifications et connexions' },
];

function frenchToday() {
    const now = new Date();
    const hour = Number(new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', hour12: false, timeZone: 'Europe/Paris' }).format(now));
    const date = new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris',
    }).format(now);
    return {
        greeting: hour >= 18 || hour < 5 ? 'Bonsoir' : 'Bonjour',
        date: date.charAt(0).toUpperCase() + date.slice(1),
    };
}

export default async function DashboardOverview() {
    const [currentMenu, messages, unreadCount, galleryPosts] = await Promise.all([
        getCurrentWeeklyMenu(),
        getContactMessages(),
        getUnreadMessageCount(),
        getGalleryPosts(),
    ]);

    const recentMessages = messages.slice(0, 3);
    const { greeting, date } = frenchToday();

    return (
        <div className="anim-fade" style={{ width: '100%' }}>
            {/* En-tête */}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '2.25rem',
                paddingBottom: '1.5rem',
                borderBottom: '1px solid var(--admin-border)',
            }}>
                <div>
                    <span style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--admin-gold-dark)' }}>
                        {date}
                    </span>
                    <h1 style={{ fontSize: '2.6rem', lineHeight: 1.05, color: 'var(--admin-text)', margin: 0 }}>
                        {greeting}, Mamé Fricoto
                    </h1>
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.95rem', margin: '0.6rem 0 0' }}>
                        Menus, messages et visuels du site, au même endroit.
                    </p>
                </div>
                <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-btn admin-btn-secondary"
                >
                    <ExternalLink size={15} /> Voir le site public
                </a>
            </header>

            {/* Information de persistance (uniquement si la base cloud n'est pas liée) */}
            {!process.env.TURSO_DATABASE_URL && (
                <div style={{
                    border: '1px solid var(--admin-border)',
                    borderRadius: 'var(--admin-radius-md)',
                    padding: '1rem 1.25rem',
                    marginBottom: '2rem',
                    color: 'var(--admin-text-muted)',
                    fontSize: '0.88rem',
                    lineHeight: 1.6,
                    background: 'var(--admin-card-bg)',
                }}>
                    <strong style={{ color: 'var(--admin-text)' }}>Astuce persistance (Vercel).</strong>{' '}
                    Les conteneurs Vercel sont éphémères : pour conserver à 100 % vos ajouts et suppressions, liez les variables d&apos;environnement <code>TURSO_DATABASE_URL</code> et <code>TURSO_AUTH_TOKEN</code> (Settings ➔ Environment Variables).
                </div>
            )}

            {/* Trois tuiles d'état : entièrement cliquables */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.1rem', marginBottom: '3rem' }}>
                <Link href="/admin/dashboard/messages" className="admin-tile">
                    <div className="admin-tile-top">
                        <span className="admin-tile-eyebrow"><Mail size={14} /> Messages</span>
                        <span className={`admin-tile-status ${unreadCount > 0 ? 'is-alert' : ''}`}>
                            {unreadCount > 0 ? `${unreadCount} non lu${unreadCount > 1 ? 's' : ''}` : 'À jour'}
                        </span>
                    </div>
                    <h2 className="admin-tile-title">Messages &amp; demandes</h2>
                    <p className="admin-tile-text">
                        {messages.length} message{messages.length > 1 ? 's' : ''} reçu{messages.length > 1 ? 's' : ''} dans votre boîte de contact.
                    </p>
                    <span className="admin-tile-go">Accéder aux messages <ArrowRight size={15} /></span>
                </Link>

                <Link href="/admin/dashboard/menu-semaine" className="admin-tile">
                    <div className="admin-tile-top">
                        <span className="admin-tile-eyebrow"><CalendarDays size={14} /> Menu de la semaine</span>
                        <span className={`admin-tile-status ${currentMenu ? '' : 'is-neutral'}`}>
                            {currentMenu ? 'En ligne' : 'Aucun menu'}
                        </span>
                    </div>
                    <h2 className="admin-tile-title">{currentMenu ? currentMenu.title : 'Aucun menu actif'}</h2>
                    <p className="admin-tile-text">
                        {currentMenu?.week_dates ? `Période : ${currentMenu.week_dates}` : 'Mettez à jour le menu publié sur le site.'}
                    </p>
                    <span className="admin-tile-go">Gérer le menu <ArrowRight size={15} /></span>
                </Link>

                <Link href="/admin/dashboard/galerie" className="admin-tile">
                    <div className="admin-tile-top">
                        <span className="admin-tile-eyebrow"><Camera size={14} /> Galerie</span>
                        <span className={`admin-tile-status ${galleryPosts.length > 0 ? '' : 'is-neutral'}`}>
                            {galleryPosts.length > 0 ? `${galleryPosts.length} média${galleryPosts.length > 1 ? 's' : ''}` : 'Vide'}
                        </span>
                    </div>
                    <h2 className="admin-tile-title">Galerie &amp; coulisses</h2>
                    <p className="admin-tile-text">Photos et vidéos publiées sur la page Galerie.</p>
                    <span className="admin-tile-go">Gérer la galerie <ArrowRight size={15} /></span>
                </Link>
            </div>

            {/* Raccourcis de gestion */}
            <section style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.1rem' }}>
                    <h2 style={{ fontSize: '1.6rem', margin: 0, color: 'var(--admin-text)', whiteSpace: 'nowrap' }}>Raccourcis de gestion</h2>
                    <span style={{ flex: 1, height: '1px', background: 'var(--admin-border)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.9rem' }}>
                    {SHORTCUTS.map(({ href, icon: Icon, title, text }) => (
                        <Link key={href} href={href} className="admin-tile admin-tile--compact">
                            <span className="admin-tile-icon"><Icon size={19} strokeWidth={1.7} /></span>
                            <span style={{ minWidth: 0 }}>
                                <strong className="admin-tile-title" style={{ display: 'block' }}>{title}</strong>
                                <span className="admin-tile-text" style={{ display: 'block' }}>{text}</span>
                            </span>
                            <ArrowRight size={16} className="admin-tile-arrow" />
                        </Link>
                    ))}
                </div>
            </section>

            {/* Derniers messages */}
            <section>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.1rem' }}>
                    <h2 style={{ fontSize: '1.6rem', margin: 0, color: 'var(--admin-text)', whiteSpace: 'nowrap' }}>Derniers messages</h2>
                    <span style={{ flex: 1, height: '1px', background: 'var(--admin-border)' }} />
                    <Link href="/admin/dashboard/messages" className="admin-link-btn" style={{ textDecoration: 'none' }}>
                        Tout voir →
                    </Link>
                </div>

                {recentMessages.length === 0 ? (
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.92rem' }}>
                        Aucun message reçu pour le moment.
                    </p>
                ) : (
                    <div className="admin-log-list">
                        {recentMessages.map(msg => (
                            <Link key={msg.id} href="/admin/dashboard/messages" className="admin-msg-row">
                                <span className="admin-msg-dot" data-unread={!msg.is_read} aria-hidden="true" />
                                <span style={{ minWidth: 0, flex: 1 }}>
                                    <span style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
                                        <strong style={{ fontSize: '0.95rem', fontWeight: msg.is_read ? 550 : 700, color: 'var(--admin-text)' }}>{msg.name}</strong>
                                        {msg.event_type && (
                                            <span style={{ fontSize: '0.74rem', color: 'var(--admin-gold-dark)', fontStyle: 'italic' }}>{msg.event_type}</span>
                                        )}
                                    </span>
                                    <span style={{ display: 'block', fontSize: '0.86rem', color: 'var(--admin-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {msg.message}
                                    </span>
                                </span>
                                <span style={{ fontSize: '0.76rem', color: 'var(--admin-text-subtle)', whiteSpace: 'nowrap' }}>
                                    {msg.created_at ? new Date(msg.created_at).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' }) : ''}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

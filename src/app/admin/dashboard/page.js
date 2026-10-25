import Link from 'next/link';
import { getCurrentWeeklyMenu, getContactMessages, getUnreadMessageCount, getGalleryPosts } from '@/lib/data';
import { CalendarDays, Mail, Camera, Settings, ExternalLink, ArrowRight, MessageSquare, Image as ImageIcon, Receipt, Heart, Languages, History } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Tableau de bord | Admin Mamé Fricoto',
};

const SHORTCUTS = [
    { href: '/admin/dashboard/menu-semaine', icon: CalendarDays, title: 'Menu de la semaine', text: 'Mettre à jour la carte', color: '#C2572D', bg: 'rgba(194, 87, 45, 0.1)', border: 'rgba(194, 87, 45, 0.25)' },
    { href: '/admin/dashboard/carousel', icon: ImageIcon, title: 'Carrousel d’accueil', text: 'Photos plein écran', color: '#315B8C', bg: 'rgba(49, 91, 140, 0.1)', border: 'rgba(49, 91, 140, 0.25)' },
    { href: '/admin/dashboard/tarifs', icon: Receipt, title: 'Tarifs & cartes', text: 'Formules et cartes PDF', color: '#D97706', bg: 'rgba(217, 119, 6, 0.12)', border: 'rgba(217, 119, 6, 0.25)' },
    { href: '/admin/dashboard/galerie', icon: Camera, title: 'Galerie photos', text: 'Coulisses et plats', color: '#059669', bg: 'rgba(5, 150, 105, 0.12)', border: 'rgba(5, 150, 105, 0.25)' },
    { href: '/admin/dashboard/a-propos', icon: Heart, title: 'À propos', text: 'Photo officielle et histoire', color: '#E11D48', bg: 'rgba(225, 29, 72, 0.1)', border: 'rgba(225, 29, 72, 0.25)' },
    { href: '/admin/dashboard/messages', icon: MessageSquare, title: 'Contact & devis', text: 'Boîte de réception', color: '#0284C7', bg: 'rgba(2, 132, 199, 0.1)', border: 'rgba(2, 132, 199, 0.25)' },
    { href: '/admin/dashboard/textes', icon: Languages, title: 'Textes du site', text: 'Éditeur bilingue FR / EN', color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.1)', border: 'rgba(124, 58, 237, 0.25)' },
    { href: '/admin/dashboard/settings', icon: Settings, title: 'Infos & réglages', text: 'Téléphone, logo et favicon', color: '#8D5B4C', bg: 'rgba(141, 91, 76, 0.1)', border: 'rgba(141, 91, 76, 0.25)' },
    { href: '/admin/dashboard/logs', icon: History, title: 'Journal d’activité', text: 'Modifications et connexions', color: '#475569', bg: 'rgba(71, 85, 105, 0.1)', border: 'rgba(71, 85, 105, 0.25)' },
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
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        marginBottom: '0.6rem',
                        padding: '4px 12px',
                        borderRadius: '999px',
                        background: 'linear-gradient(135deg, rgba(194, 87, 45, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
                        border: '1px solid rgba(194, 87, 45, 0.22)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: '#C2572D',
                        letterSpacing: '0.04em'
                    }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#C2572D' }} />
                        {date}
                    </div>
                    <h1 style={{ fontSize: '2.6rem', lineHeight: 1.05, color: 'var(--admin-text)', margin: 0 }}>
                        {greeting}, <span style={{ color: '#C2572D' }}>Mamé Fricoto</span>
                    </h1>
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.95rem', margin: '0.6rem 0 0' }}>
                        Menus, messages et visuels du site, au même endroit.
                    </p>
                </div>
                <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-btn"
                    style={{
                        background: 'linear-gradient(135deg, #3A669A 0%, #244872 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        boxShadow: '0 4px 14px rgba(36, 72, 114, 0.28)',
                        padding: '10px 18px',
                        fontWeight: '600',
                        fontSize: '0.85rem'
                    }}
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

            {/* Trois tuiles d'état : entièrement cliquables avec couleurs provençales */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.1rem', marginBottom: '3rem' }}>
                <Link href="/admin/dashboard/messages" className="admin-tile admin-tile--blue">
                    <div className="admin-tile-top">
                        <span className="admin-tile-eyebrow" style={{ color: '#2563EB' }}>
                            <span style={{
                                width: '26px', height: '26px', borderRadius: '50%',
                                background: 'rgba(37, 99, 235, 0.12)',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                color: '#2563EB', flexShrink: 0
                            }}>
                                <Mail size={14} />
                            </span>
                            Messages &amp; Devis
                        </span>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            fontSize: '0.74rem', fontWeight: 700, padding: '3px 10px', borderRadius: '999px',
                            background: unreadCount > 0 ? '#FEE2E2' : '#EFF6FF',
                            color: unreadCount > 0 ? '#DC2626' : '#2563EB',
                            border: unreadCount > 0 ? '1px solid #FCA5A5' : '1px solid #BFDBFE'
                        }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: unreadCount > 0 ? '#DC2626' : '#2563EB' }} />
                            {unreadCount > 0 ? `${unreadCount} non lu${unreadCount > 1 ? 's' : ''}` : 'À jour'}
                        </span>
                    </div>
                    <h2 className="admin-tile-title">Messages &amp; demandes</h2>
                    <p className="admin-tile-text">
                        {messages.length} message{messages.length > 1 ? 's' : ''} reçu{messages.length > 1 ? 's' : ''} dans votre boîte de contact.
                    </p>
                    <span className="admin-tile-go">Accéder aux messages <ArrowRight size={15} /></span>
                </Link>

                <Link href="/admin/dashboard/menu-semaine" className="admin-tile admin-tile--terra">
                    <div className="admin-tile-top">
                        <span className="admin-tile-eyebrow" style={{ color: '#C2572D' }}>
                            <span style={{
                                width: '26px', height: '26px', borderRadius: '50%',
                                background: 'rgba(194, 87, 45, 0.12)',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                color: '#C2572D', flexShrink: 0
                            }}>
                                <CalendarDays size={14} />
                            </span>
                            Menu de la semaine
                        </span>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            fontSize: '0.74rem', fontWeight: 700, padding: '3px 10px', borderRadius: '999px',
                            background: currentMenu ? '#ECFDF5' : '#F3F4F6',
                            color: currentMenu ? '#059669' : '#6B7280',
                            border: currentMenu ? '1px solid #A7F3D0' : '1px solid #E5E7EB'
                        }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: currentMenu ? '#059669' : '#9CA3AF' }} />
                            {currentMenu ? 'En ligne' : 'Aucun menu'}
                        </span>
                    </div>
                    <h2 className="admin-tile-title">{currentMenu ? currentMenu.title : 'Aucun menu actif'}</h2>
                    <p className="admin-tile-text">
                        {currentMenu?.week_dates ? `Période : ${currentMenu.week_dates}` : 'Mettez à jour le menu publié sur le site.'}
                    </p>
                    <span className="admin-tile-go">Gérer le menu <ArrowRight size={15} /></span>
                </Link>

                <Link href="/admin/dashboard/galerie" className="admin-tile admin-tile--amber">
                    <div className="admin-tile-top">
                        <span className="admin-tile-eyebrow" style={{ color: '#D97706' }}>
                            <span style={{
                                width: '26px', height: '26px', borderRadius: '50%',
                                background: 'rgba(217, 119, 6, 0.12)',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                color: '#D97706', flexShrink: 0
                            }}>
                                <Camera size={14} />
                            </span>
                            Galerie &amp; coulisses
                        </span>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            fontSize: '0.74rem', fontWeight: 700, padding: '3px 10px', borderRadius: '999px',
                            background: galleryPosts.length > 0 ? '#FEF3C7' : '#F3F4F6',
                            color: galleryPosts.length > 0 ? '#B45309' : '#6B7280',
                            border: galleryPosts.length > 0 ? '1px solid #FDE68A' : '1px solid #E5E7EB'
                        }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: galleryPosts.length > 0 ? '#D97706' : '#9CA3AF' }} />
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
                    {SHORTCUTS.map(({ href, icon: Icon, title, text, color, bg, border }) => (
                        <Link
                            key={href}
                            href={href}
                            className="admin-tile admin-tile--compact"
                            style={{
                                '--tile-color': color,
                                '--tile-bg': bg,
                                '--tile-border': border,
                            }}
                        >
                            <span className="admin-tile-icon">
                                <Icon size={19} strokeWidth={1.8} />
                            </span>
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

import Link from 'next/link';
import { getSiteInfo, getCurrentWeeklyMenu, getContactMessages, getUnreadMessageCount, getGalleryPosts } from '@/lib/data';
import { CalendarDays, Mail, Camera, Settings, ExternalLink, ArrowRight, Clock, Phone, MapPin, MessageSquare, Image as ImageIcon, Sparkles, Receipt, Heart, Languages } from 'lucide-react';


export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Dashboard | Admin Mamé Fricoto',
};

export default async function DashboardOverview() {
    const [info, currentMenu, messages, unreadCount, galleryPosts] = await Promise.all([
        getSiteInfo(),
        getCurrentWeeklyMenu(),
        getContactMessages(),
        getUnreadMessageCount(),
        getGalleryPosts(),
    ]);

    const recentMessages = messages.slice(0, 3);

    return (
        <div className="anim-fade" style={{ width: '100%' }}>
            {/* En-tête avec lien vers le site */}
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

            {/* Information Persistance Cloud Vercel */}
            {!process.env.TURSO_DATABASE_URL && (
                <div style={{
                    background: 'rgba(200, 169, 110, 0.1)',
                    border: '1px solid rgba(200, 169, 110, 0.3)',
                    borderRadius: '8px',
                    padding: '1.25rem 1.5rem',
                    marginBottom: '2rem',
                    color: 'var(--admin-text)',
                    fontSize: '0.9rem',
                    lineHeight: '1.6'
                }}>
                    <strong style={{ color: 'var(--admin-gold)', display: 'block', fontSize: '1rem', marginBottom: '0.3rem' }}>
                        ℹ️ Astuce Persistance Permanente (Vercel Serverless)
                    </strong>
                    Sur Vercel, les conteneurs de serveur sont éphémères. Pour que l&apos;intégralité de vos ajouts et suppressions (carrousel, galerie, menus) soient sauvegardés à 100% pour toujours, il suffit de lier les 2 variables d&apos;environnement gratuites <code>TURSO_DATABASE_URL</code> et <code>TURSO_AUTH_TOKEN</code> dans Vercel (Settings ➔ Environment Variables).
                </div>
            )}

            {/* Cartes de notifications et de statut */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
                
                {/* 1. Carte des messages - bleu */}
                <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem', position: 'relative', borderLeft: '3px solid #0284C7' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: unreadCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(2, 132, 199, 0.12)', borderRadius: '12px', color: unreadCount > 0 ? '#ef4444' : '#0284C7' }}>
                                <Mail size={24} />
                            </div>
                            {unreadCount > 0 ? (
                                <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.75rem', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', letterSpacing: '0.05em', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)' }}>
                                    {unreadCount} NON LU{unreadCount > 1 ? 'S' : ''}
                                </span>
                            ) : (
                                <span style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284C7', fontSize: '0.72rem', fontWeight: '700', padding: '3px 9px', borderRadius: '20px' }}>
                                    À JOUR
                                </span>
                            )}
                        </div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--admin-text)', marginBottom: '0.2rem' }}>
                            Messages &amp; Demandes
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                            {messages.length} message{messages.length > 1 ? 's' : ''} reçus dans votre boîte de contact.
                        </p>
                    </div>
                    <Link href="/admin/dashboard/messages" style={{ marginTop: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#0284C7', textDecoration: 'none' }}>
                        Accéder aux messages <ArrowRight size={14} />
                    </Link>
                </div>

                {/* 2. Carte du menu de la semaine - vert */}
                <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem', borderLeft: '3px solid #059669' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(5, 150, 105, 0.12)', borderRadius: '12px', color: '#059669' }}>
                                <CalendarDays size={24} />
                            </div>
                            <span style={{ background: 'rgba(5, 150, 105, 0.15)', color: '#059669', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>
                                MENU EN LIGNE
                            </span>
                        </div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--admin-text)', marginBottom: '0.2rem' }}>
                            {currentMenu ? currentMenu.title : 'Aucun menu actif'}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                            {currentMenu?.week_dates ? `Période : ${currentMenu.week_dates}` : 'Mettez à jour le menu publié sur le site.'}
                        </p>
                    </div>
                    <Link href="/admin/dashboard/menu-semaine" style={{ marginTop: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#059669', textDecoration: 'none' }}>
                        Gérer le menu de la semaine <ArrowRight size={14} />
                    </Link>
                </div>

                {/* 3. Carte de la galerie - rose */}
                <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem', borderLeft: '3px solid #E11D48' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(225, 29, 72, 0.12)', borderRadius: '12px', color: '#E11D48' }}>
                                <Camera size={24} />
                            </div>
                            <span style={{ background: 'rgba(225, 29, 72, 0.12)', color: '#E11D48', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>
                                {galleryPosts.length} MÉDIAS
                            </span>
                        </div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--admin-text)', marginBottom: '0.2rem' }}>
                            Galerie &amp; Coulisses
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                            Photos et vidéos publiées sur la page Galerie.
                        </p>
                    </div>
                    <Link href="/admin/dashboard/galerie" style={{ marginTop: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#E11D48', textDecoration: 'none' }}>
                        Gérer la galerie <ArrowRight size={14} />
                    </Link>
                </div>

            </div>

            {/* Grille de raccourcis (8 raccourcis colorés) */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--admin-text)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={18} style={{ color: 'var(--admin-gold)' }} /> Raccourcis de Gestion
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                    
                    {/* 1. Menu de la semaine - Vert émeraude */}
                    <Link href="/admin/dashboard/menu-semaine" className="admin-shortcut-card" style={{ borderColor: 'rgba(5, 150, 105, 0.25)' }}>
                        <div className="admin-shortcut-icon" style={{ background: 'rgba(5, 150, 105, 0.12)', color: '#059669' }}>
                            <CalendarDays size={22} />
                        </div>
                        <div>
                            <strong style={{ display: 'block', fontSize: '0.92rem', color: 'var(--admin-text)' }}>Menu Semaine</strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>Mettre à jour la carte</span>
                        </div>
                        <ArrowRight size={15} className="admin-shortcut-arrow" style={{ color: '#059669' }} />
                    </Link>

                    {/* 2. Carrousel Bannière - Violet */}
                    <Link href="/admin/dashboard/carousel" className="admin-shortcut-card" style={{ borderColor: 'rgba(124, 58, 237, 0.25)' }}>
                        <div className="admin-shortcut-icon" style={{ background: 'rgba(124, 58, 237, 0.12)', color: '#7C3AED' }}>
                            <ImageIcon size={22} />
                        </div>
                        <div>
                            <strong style={{ display: 'block', fontSize: '0.92rem', color: 'var(--admin-text)' }}>Carrousel Accueil</strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>Photos plein écran</span>
                        </div>
                        <ArrowRight size={15} className="admin-shortcut-arrow" style={{ color: '#7C3AED' }} />
                    </Link>

                    {/* 3. Tarifs & Cartes - Terracotta */}
                    <Link href="/admin/dashboard/tarifs" className="admin-shortcut-card" style={{ borderColor: 'rgba(194, 65, 12, 0.25)' }}>
                        <div className="admin-shortcut-icon" style={{ background: 'rgba(194, 65, 12, 0.12)', color: '#C2410C' }}>
                            <Receipt size={22} />
                        </div>
                        <div>
                            <strong style={{ display: 'block', fontSize: '0.92rem', color: 'var(--admin-text)' }}>Tarifs &amp; Cartes</strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>Formules &amp; Cartes PDF</span>
                        </div>
                        <ArrowRight size={15} className="admin-shortcut-arrow" style={{ color: '#C2410C' }} />
                    </Link>

                    {/* 4. Galerie - Rose corail */}
                    <Link href="/admin/dashboard/galerie" className="admin-shortcut-card" style={{ borderColor: 'rgba(225, 29, 72, 0.25)' }}>
                        <div className="admin-shortcut-icon" style={{ background: 'rgba(225, 29, 72, 0.12)', color: '#E11D48' }}>
                            <Camera size={22} />
                        </div>
                        <div>
                            <strong style={{ display: 'block', fontSize: '0.92rem', color: 'var(--admin-text)' }}>Galerie Photos</strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>Coulisses &amp; plats</span>
                        </div>
                        <ArrowRight size={15} className="admin-shortcut-arrow" style={{ color: '#E11D48' }} />
                    </Link>

                    {/* 5. À Propos - Prune / Vin */}
                    <Link href="/admin/dashboard/a-propos" className="admin-shortcut-card" style={{ borderColor: 'rgba(190, 24, 93, 0.25)' }}>
                        <div className="admin-shortcut-icon" style={{ background: 'rgba(190, 24, 93, 0.12)', color: '#BE185D' }}>
                            <Heart size={22} />
                        </div>
                        <div>
                            <strong style={{ display: 'block', fontSize: '0.92rem', color: 'var(--admin-text)' }}>À Propos</strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>Photo officielle &amp; histoire</span>
                        </div>
                        <ArrowRight size={15} className="admin-shortcut-arrow" style={{ color: '#BE185D' }} />
                    </Link>

                    {/* 6. Messages & Devis - Bleu Océan */}
                    <Link href="/admin/dashboard/messages" className="admin-shortcut-card" style={{ borderColor: 'rgba(2, 132, 199, 0.25)' }}>
                        <div className="admin-shortcut-icon" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284C7' }}>
                            <MessageSquare size={22} />
                        </div>
                        <div>
                            <strong style={{ display: 'block', fontSize: '0.92rem', color: 'var(--admin-text)' }}>Contact &amp; Devis</strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>{unreadCount > 0 ? `${unreadCount} nouveau(x)` : 'Boîte de réception'}</span>
                        </div>
                        <ArrowRight size={15} className="admin-shortcut-arrow" style={{ color: '#0284C7' }} />
                    </Link>

                    {/* 7. Textes du site - Indigo */}
                    <Link href="/admin/dashboard/textes" className="admin-shortcut-card" style={{ borderColor: 'rgba(79, 70, 229, 0.25)' }}>
                        <div className="admin-shortcut-icon" style={{ background: 'rgba(79, 70, 229, 0.12)', color: '#4F46E5' }}>
                            <Languages size={22} />
                        </div>
                        <div>
                            <strong style={{ display: 'block', fontSize: '0.92rem', color: 'var(--admin-text)' }}>Textes du site</strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>Éditeur bilingue FR / EN</span>
                        </div>
                        <ArrowRight size={15} className="admin-shortcut-arrow" style={{ color: '#4F46E5' }} />
                    </Link>

                    {/* 8. Informations du site - Ambre / Or */}
                    <Link href="/admin/dashboard/settings" className="admin-shortcut-card" style={{ borderColor: 'rgba(217, 119, 6, 0.25)' }}>
                        <div className="admin-shortcut-icon" style={{ background: 'rgba(217, 119, 6, 0.12)', color: '#D97706' }}>
                            <Settings size={22} />
                        </div>
                        <div>
                            <strong style={{ display: 'block', fontSize: '0.92rem', color: 'var(--admin-text)' }}>Infos &amp; Réglages</strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>Téléphone, logo &amp; SEO</span>
                        </div>
                        <ArrowRight size={15} className="admin-shortcut-arrow" style={{ color: '#D97706' }} />
                    </Link>

                </div>

            </div>

            {/* Derniers messages */}
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
                                    borderRadius: '8px',
                                    background: msg.is_read ? 'var(--admin-surface)' : 'rgba(200,169,110,0.08)',
                                    border: `1px solid ${msg.is_read ? 'var(--admin-border)' : 'rgba(200,169,110,0.25)'}`,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '0.75rem',
                                    width: '100%',
                                    minWidth: 0,
                                    boxSizing: 'border-box'
                                }}>
                                    <div style={{ minWidth: 0, flex: '1 1 200px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                                            <strong style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--admin-text)', fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
                                                {msg.name}
                                            </strong>
                                            {msg.event_type && (
                                                <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(196,89,58,0.2)', color: '#E06D53', borderRadius: '4px', textTransform: 'uppercase', fontWeight: '700' }}>
                                                    {msg.event_type}
                                                </span>
                                            )}
                                            {!msg.is_read && (
                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C4593A', flexShrink: 0 }}></span>
                                            )}
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', maxWidth: '100%' }}>
                                            {msg.message}
                                        </p>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>
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

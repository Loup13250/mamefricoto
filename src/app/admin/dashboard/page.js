import { getSiteInfo, getAllWeeklyMenus, getArticles } from '@/lib/data';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Dashboard | Admin Mamé Fricoto',
};

export default function DashboardOverview() {
    const info = getSiteInfo();
    const menus = getAllWeeklyMenus();
    const articles = getArticles();

    return (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem', width: '100%' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b', fontFamily: 'var(--font-primary)' }}>
                    Bienvenue sur votre espace Admin
                </h1>
                <p style={{ color: '#64748b' }}>Un aperçu rapide de votre site Mamé Fricoto.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '700px', marginBottom: '2.5rem' }}>
                <div className="admin-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '140px', borderTop: '4px solid var(--admin-primary)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#64748b' }}>Menus Publiés</h3>
                    <p style={{ fontSize: '3rem', fontWeight: '700', color: 'var(--admin-primary)' }}>{menus.length}</p>
                </div>
                <div className="admin-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '140px', borderTop: '4px solid var(--admin-accent)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#64748b' }}>Articles</h3>
                    <p style={{ fontSize: '3rem', fontWeight: '700', color: 'var(--admin-accent)' }}>{articles.length}</p>
                </div>
                <div className="admin-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '140px', borderTop: '4px solid #22c55e' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#64748b' }}>État du Site</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e', background: '#f0fdf4', padding: '8px 16px', borderRadius: '999px', marginTop: '0.5rem' }}>
                        <div style={{ width: '10px', height: '10px', background: '#22c55e', borderRadius: '50%' }}></div>
                        <p style={{ fontWeight: '600' }}>En ligne</p>
                    </div>
                </div>
            </div>

            <div className="admin-card" style={{ width: '100%', maxWidth: '700px', textAlign: 'center', background: 'white', border: '1px solid var(--admin-border)' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                    <span style={{ width: '30px', height: '2px', background: '#e2e8f0' }}></span>
                    Informations de votre site
                    <span style={{ width: '30px', height: '2px', background: '#e2e8f0' }}></span>
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'left', background: '#fafaf8', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1ede8' }}>
                    <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Téléphone</span>
                        <p style={{ fontWeight: '500', color: '#1e293b' }}>{info.phone}</p>
                    </div>
                    <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Adresse</span>
                        <p style={{ fontWeight: '500', color: '#1e293b' }}>{info.address}</p>
                    </div>
                    <div style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Horaires</span>
                        <p style={{ fontWeight: '500', color: '#1e293b' }}>{info.hours}</p>
                    </div>
                </div>
                <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                    Allez dans <strong>Informations Site</strong> pour modifier ces valeurs.
                </p>
            </div>
        </div>
    );
}

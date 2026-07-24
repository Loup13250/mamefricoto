import { getSiteInfo } from '@/lib/data';
import SettingsFormClient from './SettingsFormClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const info = await getSiteInfo();

    return (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem', color: '#F5F0E8' }}>
                    Informations &amp; Visuels du Site
                </h1>
                <p style={{ color: 'rgba(245,240,232,0.5)' }}>
                    Modifiez facilement le logo, la photo d&apos;accueil, vos coordonnées et vos réseaux.
                </p>
            </div>

            <div className="admin-card" style={{ width: '100%', maxWidth: '750px' }}>
                <SettingsFormClient info={info} />
            </div>
        </div>
    );
}

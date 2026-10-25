import { getActivityLogs } from '@/lib/logs';
import LogsClient from './LogsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
    title: 'Journal d\'Activité | Admin Mamé Fricoto',
    description: 'Historique et audit complet de toutes les modifications effectuées sur le site.',
};

export default async function ActivityLogsPage() {
    const logs = await getActivityLogs(200);
    return <LogsClient initialLogs={logs} />;
}

import { getUnreadMessageCount } from '@/lib/data';
import AdminSidebarClient from './AdminSidebarClient';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }) {
    const unreadCount = await getUnreadMessageCount().catch(() => 0);

    return (
        <AdminSidebarClient unreadCount={unreadCount}>
            {children}
        </AdminSidebarClient>
    );
}

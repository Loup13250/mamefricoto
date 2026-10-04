import { getUnreadMessageCount } from '@/lib/data';
import { redirect } from 'next/navigation';
import AdminSidebarClient from './AdminSidebarClient';
import { isAdminRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }) {
    const authenticated = await isAdminRequest();
    if (!authenticated) {
        redirect('/admin');
    }

    const unreadCount = await getUnreadMessageCount().catch(() => 0);

    return (
        <AdminSidebarClient unreadCount={unreadCount}>
            {children}
        </AdminSidebarClient>
    );
}

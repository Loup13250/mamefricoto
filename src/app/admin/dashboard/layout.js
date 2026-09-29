import { getUnreadMessageCount } from '@/lib/data';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminSidebarClient from './AdminSidebarClient';

export const dynamic = 'force-dynamic';

async function isAuthenticated() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_session')?.value;
        // A valid session token is a non-empty UUID-format string
        return typeof token === 'string' && token.length >= 32;
    } catch {
        return false;
    }
}

export default async function DashboardLayout({ children }) {
    const authenticated = await isAuthenticated();
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

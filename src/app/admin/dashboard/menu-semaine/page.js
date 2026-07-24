import { getAllWeeklyMenus } from '@/lib/data';
import WeeklyMenuClient from './WeeklyMenuClient';

export const dynamic = 'force-dynamic';

export default async function WeeklyMenuPage() {
    const menus = await getAllWeeklyMenus();
    return <WeeklyMenuClient menus={menus} />;
}

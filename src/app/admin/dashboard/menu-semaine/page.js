import { getAllWeeklyMenus } from '@/lib/data';
import WeeklyMenuClient from './WeeklyMenuClient';

export const dynamic = 'force-dynamic';

export default function WeeklyMenuPage() {
    const menus = getAllWeeklyMenus();
    return <WeeklyMenuClient menus={menus} />;
}

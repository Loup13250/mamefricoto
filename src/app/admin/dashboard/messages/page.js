import { getContactMessages } from '@/lib/data';
import MessagesClient from './MessagesClient';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Messages | Admin Mamé Fricoto',
};

export default async function MessagesPage() {
    const messages = await getContactMessages();
    return <MessagesClient messages={messages} />;
}

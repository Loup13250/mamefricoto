import { getContactMessages } from '@/lib/data';
import MessagesClient from './MessagesClient';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Messages | Admin Mamé Fricoto',
};

export default function MessagesPage() {
    const messages = getContactMessages();
    return <MessagesClient messages={messages} />;
}

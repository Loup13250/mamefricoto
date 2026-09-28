import { getSiteInfo } from '@/lib/data';
import ContactClient from './ContactClient';

export const metadata = {
    title: 'Contact & Devis | Mamé Fricoto — Traiteur Maison',
    description: 'Contactez Mamé Fricoto pour vos commandes de plats du jour, buffets dînatoires ou événements privés à Eyguières.',
};

export const revalidate = 3600;

export default async function ContactPage() {
    const info = await getSiteInfo();

    return <ContactClient info={info} />;
}

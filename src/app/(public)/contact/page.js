import { getSiteInfo } from '@/lib/data';
import { SITE_URL } from '@/lib/site';
import ContactClient from './ContactClient';

export const metadata = {
    title: 'Contact & Devis',
    description: "Contactez Mamé Fricoto pour vos commandes de plats du jour, buffets dînatoires ou événements privés et professionnels à Eyguières et en Provence.",
    alternates: {
        canonical: `${SITE_URL}/contact`,
    },
    openGraph: {
        title: 'Contact & Devis | Mamé Fricoto',
        description: "Demandez un devis sur mesure ou contactez Mamé Fricoto à Eyguières.",
        url: `${SITE_URL}/contact`,
    },
};

export const revalidate = 3600;

export default async function ContactPage() {
    const info = await getSiteInfo();

    return <ContactClient info={info} />;
}

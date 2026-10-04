import { getSiteInfo, getServices } from '@/lib/data';
import { SITE_URL } from '@/lib/site';
import AProposClient from './AProposClient';

export const metadata = {
    title: 'À Propos',
    description: "Découvrez l'histoire de Mamé Fricoto, traiteur artisanal et cuisine familiale à Eyguières. Produits frais de saison et recettes provençales préparées avec passion.",
    alternates: {
        canonical: `${SITE_URL}/a-propos`,
    },
    openGraph: {
        title: 'À Propos | Mamé Fricoto',
        description: "L'histoire et la passion culinaire de Mamé Fricoto, traiteur artisanal à Eyguières.",
        url: `${SITE_URL}/a-propos`,
    },
};

export const revalidate = 3600;

export default async function AProposPage() {
    const info = await getSiteInfo();
    const services = await getServices();

    return <AProposClient info={info} services={services} />;
}

import { getPricingDocuments, getSiteInfo } from '@/lib/data';
import { SITE_URL } from '@/lib/site';
import TarifsClient from './TarifsClient';

export const metadata = {
    title: 'Tarifs & Cartes Traiteur',
    description: "Consultez les cartes et grilles tarifaires de nos repas faits maison, buffets dînatoires et formules traiteur à Eyguières et en Provence.",
    alternates: {
        canonical: `${SITE_URL}/tarifs`,
    },
    openGraph: {
        title: 'Tarifs & Cartes Traiteur | Mamé Fricoto',
        description: "Consultez les cartes et grilles tarifaires de nos repas faits maison et formules traiteur à Eyguières.",
        url: `${SITE_URL}/tarifs`,
    },
};

export const revalidate = 60;

export default async function TarifsPage() {
    const [siteInfo, pricingDocuments] = await Promise.all([
        getSiteInfo(),
        getPricingDocuments(),
    ]);

    return (
        <TarifsClient
            siteInfo={siteInfo}
            pricingDocuments={pricingDocuments}
        />
    );
}

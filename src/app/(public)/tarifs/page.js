import { getPricingDocuments, getSiteInfo } from '@/lib/data';
import TarifsClient from './TarifsClient';

export const metadata = {
    title: 'Tarifs | Mamé Fricoto - Traiteur Maison Eyguières',
    description: "Consultez les cartes et grilles tarifaires de nos repas faits maison, buffets dînatoires et formules traiteur à Eyguières et en Provence.",
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


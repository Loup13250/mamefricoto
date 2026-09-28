import { getSiteInfo, getServices, getPricingDocuments } from '@/lib/data';
import TarifsClient from './TarifsClient';

export const metadata = {
    title: 'Tarifs & Prestations | Mamé Fricoto — Traiteur Maison Eyguières',
    description: "Consultez les cartes et grilles tarifaires de nos repas faits maison, buffets dînatoires et prestations traiteur à Eyguières et en Provence.",
};

export const revalidate = 60;

export default async function TarifsPage() {
    const [siteInfo, services, pricingDocuments] = await Promise.all([
        getSiteInfo(),
        getServices(),
        getPricingDocuments(),
    ]);

    return (
        <TarifsClient
            siteInfo={siteInfo}
            services={services}
            pricingDocuments={pricingDocuments}
        />
    );
}

import { getServices, getPricingDocuments } from '@/lib/data';
import ServicesClient from './ServicesClient';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Tarifs & Prestations | Admin Mamé Fricoto',
};

export default async function PrestationsAdminPage() {
    const [services, pricingDocuments] = await Promise.all([
        getServices(),
        getPricingDocuments(),
    ]);

    return (
        <ServicesClient
            services={services}
            pricingDocuments={pricingDocuments}
        />
    );
}

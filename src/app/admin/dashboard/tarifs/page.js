import { getPricingDocuments } from '@/lib/data';
import TarifsAdminClient from './TarifsAdminClient';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Tarifs | Admin Mamé Fricoto',
};

export default async function TarifsAdminPage() {
    const pricingDocuments = await getPricingDocuments();

    return <TarifsAdminClient pricingDocuments={pricingDocuments} />;
}

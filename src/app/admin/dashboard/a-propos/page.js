import { getSiteInfo, getServices } from '@/lib/data';
import AProposAdminClient from './AProposAdminClient';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'À Propos & Prestations | Admin Mamé Fricoto',
};

export default async function AProposAdminPage() {
    const [info, services] = await Promise.all([
        getSiteInfo(),
        getServices(),
    ]);

    return <AProposAdminClient info={info} services={services} />;
}

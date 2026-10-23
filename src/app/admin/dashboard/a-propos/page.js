import { getSiteInfo, getServices } from '@/lib/data';
import { parseCustomTexts, CUSTOM_TEXTS_KEY } from '@/lib/siteTexts';
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

    const customTexts = parseCustomTexts(info?.[CUSTOM_TEXTS_KEY]);

    return <AProposAdminClient info={info} services={services} customTexts={customTexts} />;
}

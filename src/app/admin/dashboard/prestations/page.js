import { getServices } from '@/lib/data';
import ServicesClient from './ServicesClient';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Prestations | Admin Mamé Fricoto',
};

export default async function PrestationsAdminPage() {
    const services = await getServices();

    return <ServicesClient services={services} />;
}

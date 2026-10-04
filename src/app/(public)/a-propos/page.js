import { getSiteInfo, getServices } from '@/lib/data';
import AProposClient from './AProposClient';

export const metadata = {
    title: 'À Propos | Mamé Fricoto - Traiteur Maison',
    description: "Découvrez l'histoire de Mamé Fricoto, traiteur maison à Eyguières. Cuisine faite avec soin et produits frais.",
};

export const revalidate = 3600;

export default async function AProposPage() {
    const info = await getSiteInfo();
    const services = await getServices();

    return <AProposClient info={info} services={services} />;
}

import { getSiteInfo, getGalleryPosts } from '@/lib/data';
import RealisationsClient from '../realisations/RealisationsClient';

export const metadata = {
    title: 'Galerie & Coulisses | Mamé Fricoto - Traiteur Maison Eyguières',
    description: "Découvrez en images nos buffets dînatoires, réceptions privées, plats faits maison et les coulisses de la cuisine de Mamé Fricoto à Eyguières.",
};

export const revalidate = 3600;

export default async function GaleriePage() {
    const siteInfo = await getSiteInfo();
    const galleryPosts = await getGalleryPosts();

    return <RealisationsClient siteInfo={siteInfo} galleryPosts={galleryPosts} />;
}

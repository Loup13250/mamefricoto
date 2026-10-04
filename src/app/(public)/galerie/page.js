import { getSiteInfo, getGalleryPosts } from '@/lib/data';
import { SITE_URL } from '@/lib/site';
import RealisationsClient from '../realisations/RealisationsClient';

export const metadata = {
    title: 'Galerie & Coulisses',
    description: "Découvrez en images nos buffets dînatoires, réceptions privées, plats faits maison et les coulisses de la cuisine de Mamé Fricoto à Eyguières.",
    alternates: {
        canonical: `${SITE_URL}/galerie`,
    },
    openGraph: {
        title: 'Galerie & Coulisses | Mamé Fricoto',
        description: "Découvrez en images nos réceptions, buffets et créations culinaires à Eyguières.",
        url: `${SITE_URL}/galerie`,
    },
};

export const revalidate = 3600;

export default async function GaleriePage() {
    const siteInfo = await getSiteInfo();
    const galleryPosts = await getGalleryPosts();

    return <RealisationsClient siteInfo={siteInfo} galleryPosts={galleryPosts} />;
}

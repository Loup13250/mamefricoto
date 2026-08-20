import { getGalleryPosts } from '@/lib/data';
import GalleryClient from './GalleryClient';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Nos Réalisations & Coulisses | Admin Mamé Fricoto',
};

export default async function GaleriePage() {
    const posts = await getGalleryPosts();
    return <GalleryClient posts={posts} />;
}

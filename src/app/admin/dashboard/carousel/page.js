import { getCarouselImages } from '@/lib/data';
import CarouselClient from './CarouselClient';

export const dynamic = 'force-dynamic';

export default async function CarouselPage() {
    const images = await getCarouselImages();
    return <CarouselClient images={images} />;
}

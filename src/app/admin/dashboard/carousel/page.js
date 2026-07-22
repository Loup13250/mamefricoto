import { getCarouselImages } from '@/lib/data';
import CarouselClient from './CarouselClient';

export const dynamic = 'force-dynamic';

export default function CarouselPage() {
    const images = getCarouselImages();
    return <CarouselClient images={images} />;
}

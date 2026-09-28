import React from 'react';
import { getSiteInfo, getCarouselImages, getCurrentWeeklyMenu, getServices } from '@/lib/data';
import HomePageClient from './HomePageClient';

export const revalidate = 3600;

export default async function Home() {
    const siteInfo = await getSiteInfo();
    const carousel = await getCarouselImages();
    const weeklyMenu = await getCurrentWeeklyMenu();
    const services = await getServices();

    return (
        <HomePageClient
            siteInfo={siteInfo}
            carousel={carousel}
            weeklyMenu={weeklyMenu}
            services={services}
        />
    );
}

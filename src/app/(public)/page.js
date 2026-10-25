import React from 'react';
import { getSiteInfo, getCarouselImages, getCurrentWeeklyMenu, getServices } from '@/lib/data';
import HomePageClient from './HomePageClient';

export const revalidate = 3600;

export default async function Home() {
    const [siteInfo, carousel, weeklyMenu, services] = await Promise.all([
        getSiteInfo(),
        getCarouselImages(),
        getCurrentWeeklyMenu(),
        getServices(),
    ]);

    return (
        <HomePageClient
            siteInfo={siteInfo}
            carousel={carousel}
            weeklyMenu={weeklyMenu}
            services={services}
        />
    );
}

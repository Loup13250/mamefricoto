import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NotFoundView from '@/components/NotFoundView';
import { getSiteInfo } from '@/lib/data';
import './not-found.css';

export const metadata = {
  title: 'Page non trouvée | Mamé Fricoto',
  description: "Cette page n'est pas au menu ! Retrouvez nos plats faits maison, cartes et formules traiteur chez Mamé Fricoto.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function NotFound() {
  let siteInfo = null;
  try {
    siteInfo = await getSiteInfo();
  } catch (e) {
    console.error('Error loading siteInfo for 404 page:', e);
  }

  return (
    <>
      <Header siteInfo={siteInfo} />
      <div className="public-page-wrapper">
        <NotFoundView siteInfo={siteInfo} />
      </div>
      <Footer siteInfo={siteInfo} />
    </>
  );
}

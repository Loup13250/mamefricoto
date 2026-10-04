import { SITE_URL } from '@/lib/site';
import PolitiqueClient from './PolitiqueClient';

export const metadata = {
    title: 'Politique de Confidentialité',
    description: "Protection de vos données personnelles et conformité RGPD de Mamé Fricoto (Léa Laurent EI) : gestion des données de devis, formulaire de contact et respect de votre vie privée.",
    alternates: {
        canonical: `${SITE_URL}/politique-de-confidentialite`,
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function PolitiqueConfidentialitePage() {
    return <PolitiqueClient />;
}

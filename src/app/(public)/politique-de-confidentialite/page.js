import PolitiqueClient from './PolitiqueClient';

export const metadata = {
    title: 'Politique de Confidentialité & RGPD | Mamé Fricoto — Traiteur à Eyguières',
    description: "Protection de vos données personnelles et conformité RGPD de Mamé Fricoto (Léa Laurent EI) : gestion des données de devis, formulaire de contact et respect de votre vie privée.",
    robots: {
        index: true,
        follow: true,
    },
};

export default function PolitiqueConfidentialitePage() {
    return <PolitiqueClient />;
}

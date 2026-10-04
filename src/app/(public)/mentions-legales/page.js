import { SITE_URL } from '@/lib/site';
import MentionsLegalesClient from './MentionsLegalesClient';

export const metadata = {
    title: 'Mentions Légales',
    description: "Mentions légales officielles de l'entreprise Mamé Fricoto (Léa Laurent EI) à Eyguières : informations juridiques, RCS Tarascon, SIRET, hébergeur et crédits.",
    alternates: {
        canonical: `${SITE_URL}/mentions-legales`,
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function MentionsLegalesPage() {
    return <MentionsLegalesClient />;
}

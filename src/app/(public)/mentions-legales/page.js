import MentionsLegalesClient from './MentionsLegalesClient';

export const metadata = {
    title: 'Mentions Légales | Mamé Fricoto — Traiteur à Eyguières',
    description: "Mentions légales officielles de l'entreprise Mamé Fricoto (Léa Laurent EI) à Eyguières : informations juridiques, RCS Tarascon, SIRET, hébergeur et crédits.",
    robots: {
        index: true,
        follow: true,
    },
};

export default function MentionsLegalesPage() {
    return <MentionsLegalesClient />;
}

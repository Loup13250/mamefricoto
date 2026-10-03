'use client';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import {
    Building2,
    User,
    Server,
    Code,
    ShieldCheck,
    Scale,
    FileText,
    ArrowRight,
    Phone,
    Mail,
    MapPin,
    ExternalLink,
    CheckCircle2
} from 'lucide-react';
import '../home.css';
import '../legal.css';

export default function MentionsLegalesClient() {
    const { lang } = useLanguage();

    const isEn = lang === 'en';

    return (
        <main id="main-content" tabIndex="-1" className="legal-main subpage-main">
            {/* HERO */}
            <section className="subpage-hero">
                <div className="container anim-fade">
                    <span className="label">
                        {isEn ? 'Legal Notice & Compliance' : 'Informations Légales & Réglementaires'}
                    </span>
                    <h1 className="subpage-title">
                        {isEn ? 'Legal' : 'Mentions'}{' '}
                        <em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>
                            {isEn ? 'Notice' : 'Légales'}
                        </em>
                    </h1>
                    <p className="subpage-subtitle">
                        {isEn
                            ? 'Official legal notices in accordance with French Trust in the Digital Economy Act (LCEN n° 2004-575).'
                            : 'Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN).'}
                    </p>
                </div>
            </section>

            {/* CONTENT */}
            <section className="subpage-content-section">
                <div className="legal-container">

                    {/* Quick navigation */}
                    <nav aria-label="Sommaire légal" className="legal-quick-nav anim-up">
                        <span className="legal-quick-nav-label">
                            <FileText size={14} /> Sommaire
                        </span>
                        <a href="#editeur" className="legal-quick-nav-link">1. Éditeur</a>
                        <a href="#publication" className="legal-quick-nav-link">2. Publication</a>
                        <a href="#conception" className="legal-quick-nav-link">3. Conception</a>
                        <a href="#hebergeur" className="legal-quick-nav-link">4. Hébergeur</a>
                        <a href="#propriete" className="legal-quick-nav-link">5. Propriété Intellectuelle</a>
                        <a href="#litiges" className="legal-quick-nav-link">6. Litiges & Médiation</a>
                    </nav>

                    {/* SECTION 1: ÉDITEUR DU SITE */}
                    <article id="editeur" className="legal-card anim-up">
                        <div className="legal-card-header">
                            <div className="legal-card-icon">
                                <Building2 size={22} />
                            </div>
                            <div>
                                <h2 className="legal-card-title">1. Éditeur du Site Internet</h2>
                                <p className="legal-card-subtitle">Identification de l'entreprise exploitante</p>
                            </div>
                        </div>

                        <div className="legal-prose">
                            <p>
                                Le site internet accessible à l’adresse <strong>https://mamefricoto.fr</strong> (ainsi que ses déclinaisons) est édité par l’entreprise individuelle <strong>Léa Laurent</strong>, exerçant sous le nom commercial <strong>Mamé Fricoto</strong>.
                            </p>
                        </div>

                        <div className="legal-def-grid">
                            <div className="legal-def-item">
                                <span className="legal-def-label">Dénomination / Nom</span>
                                <span className="legal-def-value">Léa LAURENT</span>
                            </div>
                            <div className="legal-def-item">
                                <span className="legal-def-label">Nom Commercial</span>
                                <span className="legal-def-value">Mamé Fricoto</span>
                            </div>
                            <div className="legal-def-item">
                                <span className="legal-def-label">Forme Juridique</span>
                                <span className="legal-def-value">Entrepreneur Individuel (Micro-entreprise)</span>
                            </div>
                            <div className="legal-def-item">
                                <span className="legal-def-label">Adresse du Siège</span>
                                <span className="legal-def-value">59 Avenue des Alpilles, 13430 Eyguières, France</span>
                            </div>
                            <div className="legal-def-item">
                                <span className="legal-def-label">Numéro SIREN</span>
                                <span className="legal-def-value">992 096 156</span>
                            </div>
                            <div className="legal-def-item">
                                <span className="legal-def-label">Numéro SIRET (siège)</span>
                                <span className="legal-def-value">992 096 156 00011</span>
                            </div>
                            <div className="legal-def-item">
                                <span className="legal-def-label">Immatriculation RCS</span>
                                <span className="legal-def-value">Inscrit au RCS de Tarascon le 02/10/2025</span>
                            </div>
                            <div className="legal-def-item">
                                <span className="legal-def-label">Numéro RCS</span>
                                <span className="legal-def-value">992 096 156 R.C.S. Tarascon</span>
                            </div>
                            <div className="legal-def-item">
                                <span className="legal-def-label">Registre National des Entreprises (RNE)</span>
                                <span className="legal-def-value">Inscrit au RNE</span>
                            </div>
                            <div className="legal-def-item">
                                <span className="legal-def-label">Code NAF / APE</span>
                                <span className="legal-def-value">56.21Z (Services des traiteurs)</span>
                            </div>
                            <div className="legal-def-item">
                                <span className="legal-def-label">Activité Principale</span>
                                <span className="legal-def-value">Traiteur : préparation et vente de plats cuisinés à emporter ou en livraison, brunchs et buffets pour événements</span>
                            </div>
                            <div className="legal-def-item">
                                <span className="legal-def-label">Numéro de TVA Intracommunautaire</span>
                                <span className="legal-def-value">FR38992096156 (TVA non applicable, art. 293 B du Code Général des Impôts)</span>
                            </div>
                            <div className="legal-def-item">
                                <span className="legal-def-label">Téléphone</span>
                                <span className="legal-def-value">
                                    <a href="tel:0743646411">07 43 64 64 11</a>
                                </span>
                            </div>
                            <div className="legal-def-item">
                                <span className="legal-def-label">Email de Contact</span>
                                <span className="legal-def-value">
                                    <a href="mailto:mamefricoto@gmail.com">mamefricoto@gmail.com</a>
                                </span>
                            </div>
                        </div>
                    </article>

                    {/* SECTION 2: DIRECTION DE LA PUBLICATION */}
                    <article id="publication" className="legal-card anim-up">
                        <div className="legal-card-header">
                            <div className="legal-card-icon">
                                <User size={22} />
                            </div>
                            <div>
                                <h2 className="legal-card-title">2. Direction de la Publication</h2>
                                <p className="legal-card-subtitle">Responsable éditorial du site</p>
                            </div>
                        </div>

                        <div className="legal-prose">
                            <p>
                                <strong>Directrice de la publication :</strong> Madame Léa LAURENT, en sa qualité de fondatrice et exploitante de l'entreprise Mamé Fricoto.
                            </p>
                            <p>
                                <strong>Contact rédaction :</strong><br />
                                Téléphone : <a href="tel:0743646411">07 43 64 64 11</a><br />
                                Courriel : <a href="mailto:mamefricoto@gmail.com">mamefricoto@gmail.com</a>
                            </p>
                        </div>
                    </article>

                    {/* SECTION 3: CRÉATION ET DÉVELOPPEMENT WEB */}
                    <article id="conception" className="legal-card anim-up">
                        <div className="legal-card-header">
                            <div className="legal-card-icon">
                                <Code size={22} />
                            </div>
                            <div>
                                <h2 className="legal-card-title">3. Conception & Développement Web</h2>
                                <p className="legal-card-subtitle">Réalisation technique et design du site internet</p>
                            </div>
                        </div>

                        <div className="legal-prose">
                            <p>
                                Le site internet de <strong>Mamé Fricoto</strong> a été conçu, développé et optimisé sur-mesure par :
                            </p>
                            <div className="legal-callout">
                                <strong>Jean-Loup Ferrigno — JL-Développement</strong><br />
                                Créateur de solutions web modernes, performantes et sur-mesure.<br />
                                Site internet :{' '}
                                <a
                                    href="https://jl-developpement.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontWeight: 600 }}
                                >
                                    https://jl-developpement.com/ <ExternalLink size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
                                </a>
                            </div>
                        </div>
                    </article>

                    {/* SECTION 4: HÉBERGEMENT DU SITE */}
                    <article id="hebergeur" className="legal-card anim-up">
                        <div className="legal-card-header">
                            <div className="legal-card-icon">
                                <Server size={22} />
                            </div>
                            <div>
                                <h2 className="legal-card-title">4. Hébergement du Site Internet</h2>
                                <p className="legal-card-subtitle">Infrastructures et serveurs sécurisés</p>
                            </div>
                        </div>

                        <div className="legal-prose">
                            <p>
                                Le site internet est hébergé sur les infrastructures de cloud sécurisées de la société :
                            </p>
                            <div className="legal-def-grid">
                                <div className="legal-def-item">
                                    <span className="legal-def-label">Hébergeur</span>
                                    <span className="legal-def-value">Vercel Inc.</span>
                                </div>
                                <div className="legal-def-item">
                                    <span className="legal-def-label">Adresse du Siège</span>
                                    <span className="legal-def-value">440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</span>
                                </div>
                                <div className="legal-def-item">
                                    <span className="legal-def-label">Site Web</span>
                                    <span className="legal-def-value">
                                        <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
                                            https://vercel.com
                                        </a>
                                    </span>
                                </div>
                                <div className="legal-def-item">
                                    <span className="legal-def-label">Contact Support</span>
                                    <span className="legal-def-value">
                                        <a href="https://vercel.com/contact" target="_blank" rel="noopener noreferrer">
                                            vercel.com/contact
                                        </a>
                                    </span>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-3)', marginTop: '0.5rem' }}>
                                L'ensemble des flux de données transite sous protocole chiffré HTTPS (certificat SSL/TLS valide) garantissant l'intégrité et la confidentialité des échanges entre le terminal de l'internaute et nos serveurs.
                            </p>
                        </div>
                    </article>

                    {/* SECTION 5: PROPRIÉTÉ INTELLECTUELLE */}
                    <article id="propriete" className="legal-card anim-up">
                        <div className="legal-card-header">
                            <div className="legal-card-icon">
                                <ShieldCheck size={22} />
                            </div>
                            <div>
                                <h2 className="legal-card-title">5. Propriété Intellectuelle et Droits d'Auteur</h2>
                                <p className="legal-card-subtitle">Protection des créations culinaires, textes et photographies</p>
                            </div>
                        </div>

                        <div className="legal-prose">
                            <p>
                                L'intégralité du contenu présent sur le site internet <strong>Mamé Fricoto</strong> — incluant, sans limitation, les marques, logotypes, photographies des plats et buffets, illustrations, textes, recettes, chartes graphiques, vidéos, structures et agencements du site — relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle.
                            </p>
                            <p>
                                <strong>Léa Laurent (Mamé Fricoto)</strong> est titulaire exclusive de l'ensemble des droits de propriété intellectuelle afférents aux éléments originaux du site, ou bénéficie des autorisations expresses d'utilisation des tiers.
                            </p>
                            <div className="legal-callout">
                                <strong>Avertissement légal :</strong> Toute reproduction, représentation, modification, publication, transmission ou adaptation intégrale ou partielle d'un quelconque élément du site, quel que soit le moyen ou le procédé utilisé, est formellement interdite sans l'autorisation écrite préalable de Léa Laurent. Tout acte non autorisé constitue une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la Propriété Intellectuelle.
                            </div>
                        </div>
                    </article>

                    {/* SECTION 6: RESPONSABILITÉ ET RÈGLEMENT DES LITIGES */}
                    <article id="litiges" className="legal-card anim-up">
                        <div className="legal-card-header">
                            <div className="legal-card-icon">
                                <Scale size={22} />
                            </div>
                            <div>
                                <h2 className="legal-card-title">6. Responsabilité & Droit Applicable</h2>
                                <p className="legal-card-subtitle">Cadre légal, médiation de la consommation et juridiction</p>
                            </div>
                        </div>

                        <div className="legal-prose">
                            <p>
                                <strong>Exactitude des informations :</strong> Mamé Fricoto apporte le plus grand soin à la mise à jour des informations présentées sur le site (plats de saison, descriptions, tarifs indicatifs). Les cartes et menus sont donnés à titre indicatif et restent tributaires des arrivages de nos producteurs locaux et de la fraîcheur des produits de saison.
                            </p>
                            <p>
                                <strong>Liens externes :</strong> Le site peut comporter des liens hypertextes renvoyant vers des pages externes (réseaux sociaux tels qu'Instagram ou Facebook). Mamé Fricoto ne dispose d'aucun contrôle sur ces services tiers et décline toute responsabilité quant à leurs contenus ou règles de confidentialité.
                            </p>
                            <p>
                                <strong>Médiation de la consommation :</strong> Conformément à l'article L. 612-1 du Code de la consommation, en cas de litige n'ayant pu être résolu amiablement avec notre service client, le consommateur a le droit de recourir gratuitement à un médiateur de la consommation. Vous pouvez solliciter le service de médiation compétent pour les métiers de l'artisanat et de la restauration.
                            </p>
                            <p>
                                <strong>Loi applicable et juridiction compétente :</strong> Les présentes mentions légales sont régies par le droit français. En cas de contestation ou de litige persistant, et à défaut d'accord amiable, compétence expresse est attribuée aux tribunaux compétents dans le ressort du tribunal de Tarascon (13).
                            </p>
                        </div>
                    </article>

                    {/* SWITCHER BANNER */}
                    <div className="legal-switcher anim-up">
                        <div className="legal-switcher-text">
                            <strong>Vos données personnelles sont protégées.</strong><br />
                            Consultez notre politique de confidentialité pour comprendre la gestion de vos données (RGPD).
                        </div>
                        <Link href="/politique-de-confidentialite" className="legal-switcher-btn">
                            Politique de Confidentialité <ArrowRight size={16} />
                        </Link>
                    </div>

                </div>
            </section>
        </main>
    );
}

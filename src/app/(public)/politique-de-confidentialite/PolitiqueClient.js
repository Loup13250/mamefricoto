'use client';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import {
    Shield,
    Lock,
    Database,
    UserCheck,
    Cookie,
    Clock,
    Mail,
    FileCheck,
    ArrowRight,
    ExternalLink,
    CheckCircle2,
    Eye,
    RefreshCw,
    Trash2,
    HelpCircle
} from 'lucide-react';
import '../home.css';
import '../legal.css';

export default function PolitiqueClient() {
    const { lang } = useLanguage();
    const isEn = lang === 'en';

    return (
        <main id="main-content" tabIndex="-1" className="legal-main subpage-main">
            {/* HERO */}
            <section className="subpage-hero">
                <div className="container anim-fade">
                    <span className="label">
                        {isEn ? 'GDPR & Privacy Protection' : 'Protection de la Vie Privée & RGPD'}
                    </span>
                    <h1 className="subpage-title">
                        {isEn ? 'Privacy' : 'Politique de'}{' '}
                        <em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>
                            {isEn ? 'Policy' : 'Confidentialité'}
                        </em>
                    </h1>
                    <p className="subpage-subtitle">
                        {isEn
                            ? 'Our commitments regarding the collection, protection, and processing of your personal data in compliance with EU Regulation 2016/679 (GDPR).'
                            : 'Nos engagements relatifs à la collecte, au traitement et à la protection de vos données personnelles conformément au RGPD et à la loi Informatique et Libertés.'}
                    </p>
                </div>
            </section>

            {/* CONTENT */}
            <section className="subpage-content-section">
                <div className="legal-container">

                    {/* Quick navigation */}
                    <nav aria-label="Sommaire de la politique" className="legal-quick-nav anim-up">
                        <span className="legal-quick-nav-label">
                            <FileCheck size={14} /> Sommaire
                        </span>
                        <a href="#responsable" className="legal-quick-nav-link">1. Responsable</a>
                        <a href="#collecte" className="legal-quick-nav-link">2. Données Collectées</a>
                        <a href="#finalites" className="legal-quick-nav-link">3. Finalités</a>
                        <a href="#conservation" className="legal-quick-nav-link">4. Durée de Conservation</a>
                        <a href="#cookies" className="legal-quick-nav-link">5. Cookies & Traceurs</a>
                        <a href="#droits" className="legal-quick-nav-link">6. Vos Droits</a>
                    </nav>

                    {/* INTRO CALLOUT */}
                    <div className="legal-callout legal-callout-success anim-up" style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                            <CheckCircle2 size={18} color="#2E7D32" />
                            <strong style={{ color: '#2E7D32' }}>Engagement Éthique & Respect de votre Vie Privée</strong>
                        </div>
                        Chez <strong>Mamé Fricoto</strong>, la confiance est aussi fondamentale dans nos assiettes que sur notre site web. Nous ne vendons, ne louons et ne transmettons jamais vos coordonnées à des fins de prospection commerciale ou publicitaire. Vos informations sont uniquement utilisées pour préparer avec soin vos repas et répondre à vos demandes de devis.
                    </div>

                    {/* SECTION 1: RESPONSABLE DU TRAITEMENT */}
                    <article id="responsable" className="legal-card anim-up">
                        <div className="legal-card-header">
                            <div className="legal-card-icon">
                                <Shield size={22} />
                            </div>
                            <div>
                                <h2 className="legal-card-title">1. Responsable du Traitement des Données</h2>
                                <p className="legal-card-subtitle">Entité juridique en charge de la gestion des données</p>
                            </div>
                        </div>

                        <div className="legal-prose">
                            <p>
                                Le responsable du traitement des données personnelles collectées sur le site <strong>https://mamefricoto.fr</strong> au sens du Règlement Général sur la Protection des Données (RGPD - Règlement UE 2016/679) est :
                            </p>
                        </div>

                        <div className="legal-def-grid">
                            <div className="legal-def-item">
                                <span className="legal-def-label">Identité</span>
                                <span className="legal-def-value">Léa LAURENT (Mamé Fricoto)</span>
                            </div>
                            <div className="legal-def-item">
                                <span className="legal-def-label">Statut Juridique</span>
                                <span className="legal-def-value">Entrepreneur Individuel (Micro-entreprise)</span>
                            </div>
                            <div className="legal-def-item">
                                <span className="legal-def-label">Adresse Postale</span>
                                <span className="legal-def-value">59 Avenue des Alpilles, 13430 Eyguières, France</span>
                            </div>
                            <div className="legal-def-item">
                                <span className="legal-def-label">SIREN / RCS</span>
                                <span className="legal-def-value">992 096 156 (RCS Tarascon)</span>
                            </div>
                            <div className="legal-def-item">
                                <span className="legal-def-label">Courriel de Contact RGPD</span>
                                <span className="legal-def-value">
                                    <a href="mailto:mamefricoto@gmail.com">mamefricoto@gmail.com</a>
                                </span>
                            </div>
                            <div className="legal-def-item">
                                <span className="legal-def-label">Téléphone</span>
                                <span className="legal-def-value">
                                    <a href="tel:0743646411">07 43 64 64 11</a>
                                </span>
                            </div>
                        </div>
                    </article>

                    {/* SECTION 2: DONNÉES PERSONNELLES COLLECTÉES */}
                    <article id="collecte" className="legal-card anim-up">
                        <div className="legal-card-header">
                            <div className="legal-card-icon">
                                <Database size={22} />
                            </div>
                            <div>
                                <h2 className="legal-card-title">2. Données Personnelles Collectées</h2>
                                <p className="legal-card-subtitle">Quelles données sont recueillies et par quel moyen</p>
                            </div>
                        </div>

                        <div className="legal-prose">
                            <p>
                                Dans le cadre de l'utilisation du site, nous veillons au principe de <strong>minimisation des données</strong> : seules les informations strictement nécessaires à la bonne exécution de nos prestations sont demandées.
                            </p>
                            <p>
                                <strong>Via le formulaire de contact et de demande de devis :</strong>
                            </p>
                            <ul>
                                <li><strong>Nom complet</strong> : afin de pouvoir vous identifier et personnaliser nos échanges ;</li>
                                <li><strong>Adresse email</strong> : pour vous adresser notre proposition tarifaire, devis personnalisé ou réponse ;</li>
                                <li><strong>Numéro de téléphone</strong> : indispensable pour vous joindre rapidement afin d'affiner le menu, confirmer les détails logistiques ou coordonner la livraison / le retrait ;</li>
                                <li><strong>Détails du projet traiteur</strong> : type d'événement (repas de famille, mariage, séminaire d'entreprise), date envisagée, nombre estimé de convives et message libre (allergies éventuelles, souhaits de recettes).</li>
                            </ul>
                            <p>
                                Le caractère obligatoire ou facultatif des informations est indiqué lors de la saisie (champs signalés par une mention claire).
                            </p>
                        </div>
                    </article>

                    {/* SECTION 3: FINALITÉS ET BASES LÉGALES */}
                    <article id="finalites" className="legal-card anim-up">
                        <div className="legal-card-header">
                            <div className="legal-card-icon">
                                <FileCheck size={22} />
                            </div>
                            <div>
                                <h2 className="legal-card-title">3. Finalités & Bases Légales des Traitements</h2>
                                <p className="legal-card-subtitle">Pourquoi nous traitons vos données et sur quel fondement légal</p>
                            </div>
                        </div>

                        <div className="legal-prose">
                            <p>
                                Les données collectées par Mamé Fricoto sont traitées pour les finalités suivantes :
                            </p>
                            <ul>
                                <li>
                                    <strong>Établissement des devis & gestion des demandes :</strong> répondre à vos questions, calculer les propositions de menus sur-mesure et organiser la logistique.
                                    <br /><em>Base légale : Exécution de mesures précontractuelles prises à votre demande (art. 6.1.b du RGPD).</em>
                                </li>
                                <li>
                                    <strong>Exécution de la commande traiteur :</strong> réalisation des plats, préparation des buffets, livraison ou mise à disposition au laboratoire culinaire à Eyguières.
                                    <br /><em>Base légale : Exécution d'un contrat de prestation de services (art. 6.1.b du RGPD).</em>
                                </li>
                                <li>
                                    <strong>Facturation et tenue de la comptabilité :</strong> respect des obligations fiscales et légales françaises imposées à toute entreprise.
                                    <br /><em>Base légale : Respect d'obligations légales (art. 6.1.c du RGPD).</em>
                                </li>
                                <li>
                                    <strong>Sécurité et bon fonctionnement du site :</strong> prévention des abus, lutte contre le spam et sécurisation des échanges.
                                    <br /><em>Base légale : Intérêt légitime de l'entreprise à sécuriser son activité numérique (art. 6.1.f du RGPD).</em>
                                </li>
                            </ul>
                        </div>
                    </article>

                    {/* SECTION 4: DURÉE DE CONSERVATION */}
                    <article id="conservation" className="legal-card anim-up">
                        <div className="legal-card-header">
                            <div className="legal-card-icon">
                                <Clock size={22} />
                            </div>
                            <div>
                                <h2 className="legal-card-title">4. Durées de Conservation des Données</h2>
                                <p className="legal-card-subtitle">Combien de temps conservons-nous vos informations</p>
                            </div>
                        </div>

                        <div className="legal-prose">
                            <p>
                                Vos données personnelles sont conservées uniquement pendant la durée strictement nécessaire à la réalisation des finalités pour lesquelles elles ont été collectées :
                            </p>
                            <div className="legal-def-grid">
                                <div className="legal-def-item">
                                    <span className="legal-def-label">Demandes de devis & contacts sans suite</span>
                                    <span className="legal-def-value">3 ans maximum à compter du dernier contact émanant de votre part (recommandation CNIL).</span>
                                </div>
                                <div className="legal-def-item">
                                    <span className="legal-def-label">Clients ayant validé une prestation</span>
                                    <span className="legal-def-value">Durée de la relation contractuelle, puis archivage pour la durée légale applicable.</span>
                                </div>
                                <div className="legal-def-item">
                                    <span className="legal-def-label">Factures & pièces comptables</span>
                                    <span className="legal-def-value">10 ans (obligation légale selon l'article L. 123-22 du Code de commerce).</span>
                                </div>
                                <div className="legal-def-item">
                                    <span className="legal-def-label">Logs et préférences de session</span>
                                    <span className="legal-def-value">Effacées régulièrement, conservation locale modifiable à tout moment dans votre navigateur.</span>
                                </div>
                            </div>
                            <p>
                                À l'issue de ces délais, vos données sont soit totalement effacées de manière sécurisée, soit anonymisées à des fins purement statistiques.
                            </p>
                        </div>
                    </article>

                    {/* SECTION 5: COOKIES ET TRACEURS */}
                    <article id="cookies" className="legal-card anim-up">
                        <div className="legal-card-header">
                            <div className="legal-card-icon">
                                <Cookie size={22} />
                            </div>
                            <div>
                                <h2 className="legal-card-title">5. Cookies & Traceurs</h2>
                                <p className="legal-card-subtitle">Politique relative aux cookies de navigation</p>
                            </div>
                        </div>

                        <div className="legal-prose">
                            <div className="legal-callout legal-callout-success">
                                <strong>Information importante :</strong> Le site internet <strong>Mamé Fricoto n'utilise aucun cookie publicitaire, aucun outil de pistage invasif ni aucun traceur tiers de réseaux sociaux</strong> (aucun tag Google Analytics, Facebook Pixel, TikTok ou régie publicitaire).
                            </div>
                            <p>
                                Les seuls éléments stockés sur votre terminal sont des éléments <strong>strictement techniques et fonctionnels</strong> nécessaires à votre navigation :
                            </p>
                            <ul>
                                <li>
                                    <strong>Préférence de langue (stockage local du navigateur) :</strong> clé <code>mamefricoto-lang</code> permettant de conserver votre choix d'affichage (Français ou Anglais) lors de vos visites. Elle ne contient aucune donnée nominative.
                                </li>
                                <li>
                                    <strong>Cookie d'administration sécurisé :</strong> réservé exclusivement au gestionnaire du site pour l'accès authentifié à l'espace de gestion des menus et cartes (cookie chiffré HTTPOnly).
                                </li>
                            </ul>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-3)' }}>
                                En vertu des lignes directrices de la CNIL (Commission Nationale de l’Informatique et des Libertés), ces traceurs strictement nécessaires au fonctionnement du service sont dispensés du recueil préalable de votre consentement.
                            </p>
                        </div>
                    </article>

                    {/* SECTION 6: SÉCURITÉ ET DESTINATAIRES */}
                    <article id="securite" className="legal-card anim-up">
                        <div className="legal-card-header">
                            <div className="legal-card-icon">
                                <Lock size={22} />
                            </div>
                            <div>
                                <h2 className="legal-card-title">6. Sécurité & Destinataires des Données</h2>
                                <p className="legal-card-subtitle">Protection technique et transferts restreints</p>
                            </div>
                        </div>

                        <div className="legal-prose">
                            <p>
                                <strong>Destinataire exclusif :</strong> Les données collectées sont destinées de façon exclusive et confidentielle à <strong>Léa Laurent</strong> pour l'exploitation de Mamé Fricoto.
                            </p>
                            <p>
                                <strong>Sous-traitants techniques :</strong> Pour assurer le fonctionnement fiable et sécurisé du site, nous faisons appel à des prestataires d'infrastructure reconnus qui respectent les exigences du RGPD :
                            </p>
                            <ul>
                                <li><strong>Hébergement web :</strong> Vercel Inc. (infrastructures cloud hautement sécurisées bénéficiant des certifications ISO 27001 et SOC 2 Type II).</li>
                                <li><strong>Acheminement des courriels :</strong> Protocoles d'envoi d'emails transactionnels sécurisés (SMTP sécurisé / serveurs chiffrés) garantissant que vos demandes arrivent directement dans notre boîte email professionnelle.</li>
                            </ul>
                            <p>
                                <strong>Mesures de sécurité déployées :</strong> Chiffrement TLS/SSL de bout en bout de l'ensemble du trafic web (HTTPS), protection renforcée de l'administration du site et sauvegardes régulières.
                            </p>
                        </div>
                    </article>

                    {/* SECTION 7: VOS DROITS */}
                    <article id="droits" className="legal-card anim-up">
                        <div className="legal-card-header">
                            <div className="legal-card-icon">
                                <UserCheck size={22} />
                            </div>
                            <div>
                                <h2 className="legal-card-title">7. Vos Droits Concernant Vos Données (RGPD)</h2>
                                <p className="legal-card-subtitle">Comment exercer vos droits d'accès, de modification et d'effacement</p>
                            </div>
                        </div>

                        <div className="legal-prose">
                            <p>
                                Conformément aux articles 15 à 22 du Règlement (UE) 2016/679 (RGPD), vous disposez à tout moment des droits suivants sur vos données personnelles :
                            </p>
                            <div className="legal-def-grid">
                                <div className="legal-def-item">
                                    <span className="legal-def-label">Droit d'accès (Art. 15)</span>
                                    <span className="legal-def-value">Obtenir la confirmation que des données vous concernant sont traitées et en recevoir une copie.</span>
                                </div>
                                <div className="legal-def-item">
                                    <span className="legal-def-label">Droit de rectification (Art. 16)</span>
                                    <span className="legal-def-value">Faire rectifier ou actualiser toute donnée inexacte ou incomplète.</span>
                                </div>
                                <div className="legal-def-item">
                                    <span className="legal-def-label">Droit à l'effacement / oubli (Art. 17)</span>
                                    <span className="legal-def-value">Demander la suppression complète de vos données personnelles sous réserve des obligations légales comptables.</span>
                                </div>
                                <div className="legal-def-item">
                                    <span className="legal-def-label">Droit à la limitation (Art. 18)</span>
                                    <span className="legal-def-value">Demander le gel temporaire du traitement de vos données dans certaines situations.</span>
                                </div>
                                <div className="legal-def-item">
                                    <span className="legal-def-label">Droit d'opposition (Art. 21)</span>
                                    <span className="legal-def-value">Vous opposer à tout moment, pour des motifs légitimes, au traitement de vos données.</span>
                                </div>
                                <div className="legal-def-item">
                                    <span className="legal-def-label">Droit à la portabilité (Art. 20)</span>
                                    <span className="legal-def-value">Recevoir vos données dans un format structuré et lisible par machine.</span>
                                </div>
                            </div>

                            <p style={{ marginTop: '1.5rem' }}>
                                <strong>Comment exercer vos droits ?</strong><br />
                                L'exercice de ces droits est entièrement gratuit. Il vous suffit de nous adresser une demande claire précisant votre identité par l'un des moyens suivants :
                            </p>
                            <ul>
                                <li>Par courriel : <a href="mailto:mamefricoto@gmail.com" style={{ fontWeight: 600 }}>mamefricoto@gmail.com</a></li>
                                <li>Par courrier postal : <strong>Mamé Fricoto — À l'attention de Léa Laurent</strong>, 59 Avenue des Alpilles, 13430 Eyguières, France.</li>
                                <li>Par téléphone : <a href="tel:0743646411">07 43 64 64 11</a></li>
                            </ul>
                            <p>
                                Une réponse vous sera apportée dans un délai maximum de <strong>30 jours</strong> suivant la réception de votre demande.
                            </p>
                            <p style={{ marginTop: '1rem' }}>
                                <strong>Réclamation auprès de l'autorité de contrôle :</strong><br />
                                Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous avez la possibilité d'introduire une réclamation auprès de la <strong>CNIL</strong> (Commission Nationale de l’Informatique et des Libertés) :<br />
                                En ligne sur le site : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">https://www.cnil.fr</a> ou par courrier : CNIL — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.
                            </p>
                        </div>
                    </article>

                    {/* SECTION 8: MISE À JOUR */}
                    <article className="legal-card anim-up">
                        <div className="legal-card-header">
                            <div className="legal-card-icon">
                                <RefreshCw size={22} />
                            </div>
                            <div>
                                <h2 className="legal-card-title">8. Modification de la Politique de Confidentialité</h2>
                                <p className="legal-card-subtitle">Évolution des fonctionnalités et de la réglementation</p>
                            </div>
                        </div>

                        <div className="legal-prose">
                            <p>
                                Mamé Fricoto se réserve le droit de faire évoluer la présente politique à tout moment pour refléter les évolutions légales, réglementaires ou jurisprudentielles, ou lors de l'intégration de nouvelles fonctionnalités sur le site.
                            </p>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-3)' }}>
                                <em>Dernière mise à jour : Octobre 2026.</em>
                            </p>
                        </div>
                    </article>

                    {/* SWITCHER BANNER */}
                    <div className="legal-switcher anim-up">
                        <div className="legal-switcher-text">
                            <strong>Consulter l'identification de l'entreprise.</strong><br />
                            Retrouvez le SIRET, l'immatriculation au RCS de Tarascon et l'hébergeur sur notre page Mentions Légales.
                        </div>
                        <Link href="/mentions-legales" className="legal-switcher-btn">
                            Mentions Légales <ArrowRight size={16} />
                        </Link>
                    </div>

                </div>
            </section>
        </main>
    );
}

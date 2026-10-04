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
                            ? 'Our commitments regarding the collection, protection, and processing of your personal data in strict compliance with EU Regulation 2016/679 (GDPR).'
                            : 'Nos engagements relatifs à la collecte, au traitement et à la protection de vos données personnelles conformément au RGPD et à la loi Informatique et Libertés.'}
                    </p>
                </div>
            </section>

            {/* CONTENT */}
            <section className="subpage-content-section">
                <div className="legal-container">

                    {/* Quick navigation */}
                    <nav aria-label={isEn ? 'Privacy summary' : 'Sommaire de la politique'} className="legal-quick-nav anim-up">
                        <span className="legal-quick-nav-label">
                            <FileCheck size={14} /> {isEn ? 'Contents' : 'Sommaire'}
                        </span>
                        <a href="#responsable" className="legal-quick-nav-link">
                            1. {isEn ? 'Data Controller' : 'Responsable'}
                        </a>
                        <a href="#collecte" className="legal-quick-nav-link">
                            2. {isEn ? 'Collected Data' : 'Données Collectées'}
                        </a>
                        <a href="#finalites" className="legal-quick-nav-link">
                            3. {isEn ? 'Purposes & Bases' : 'Finalités'}
                        </a>
                        <a href="#conservation" className="legal-quick-nav-link">
                            4. {isEn ? 'Data Retention' : 'Conservation'}
                        </a>
                        <a href="#cookies" className="legal-quick-nav-link">
                            5. {isEn ? 'Cookies Policy' : 'Cookies & Traceurs'}
                        </a>
                        <a href="#securite" className="legal-quick-nav-link">
                            6. {isEn ? 'Security' : 'Sécurité'}
                        </a>
                        <a href="#droits" className="legal-quick-nav-link">
                            7. {isEn ? 'Your Rights' : 'Vos Droits'}
                        </a>
                    </nav>

                    {/* INTRO CALLOUT */}
                    <div className="legal-callout legal-callout-success anim-up" style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                            <CheckCircle2 size={18} color="#2E7D32" />
                            <strong style={{ color: '#2E7D32' }}>
                                {isEn ? 'Ethical Commitment & Total Privacy Respect' : 'Engagement Éthique & Respect de votre Vie Privée'}
                            </strong>
                        </div>
                        {isEn ? (
                            <>
                                At <strong>Mamé Fricoto</strong>, trust is just as fundamental in our kitchen as on our website. We never sell, rent, or trade your contact information for commercial prospecting or advertising. Your information is solely used to prepare your dishes with care, answer your inquiries, and fulfill your catering quote requests.
                            </>
                        ) : (
                            <>
                                Chez <strong>Mamé Fricoto</strong>, la confiance est aussi fondamentale dans nos assiettes que sur notre site web. Nous ne vendons, ne louons et ne transmettons jamais vos coordonnées à des fins de prospection commerciale ou publicitaire. Vos informations sont uniquement utilisées pour préparer avec soin vos repas et répondre à vos demandes de devis.
                            </>
                        )}
                    </div>

                    {/* SECTION 1: RESPONSABLE DU TRAITEMENT */}
                    <article id="responsable" className="legal-card anim-up">
                        <div className="legal-card-header">
                            <div className="legal-card-icon">
                                <Shield size={22} />
                            </div>
                            <div>
                                <h2 className="legal-card-title">
                                    {isEn ? '1. Personal Data Controller' : '1. Responsable du Traitement des Données'}
                                </h2>
                                <p className="legal-card-subtitle">
                                    {isEn ? 'Legal entity responsible for personal data management' : 'Entité juridique en charge de la gestion des données'}
                                </p>
                            </div>
                        </div>

                        <div className="legal-prose">
                            <p>
                                {isEn ? (
                                    <>
                                        The data controller for personal data collected on <strong>https://mamefricoto.fr</strong> pursuant to the General Data Protection Regulation (EU GDPR 2016/679) is:
                                    </>
                                ) : (
                                    <>
                                        Le responsable du traitement des données personnelles collectées sur le site <strong>https://mamefricoto.fr</strong> au sens du Règlement Général sur la Protection des Données (RGPD - Règlement UE 2016/679) est :
                                    </>
                                )}
                            </p>
                        </div>

                        <div className="legal-def-grid">
                            <div className="legal-def-item">
                                <span className="legal-def-label">{isEn ? 'Identity' : 'Identité'}</span>
                                <span className="legal-def-value">Léa LAURENT (Mamé Fricoto)</span>
                            </div>
                            <div className="legal-def-item">
                                <span className="legal-def-label">{isEn ? 'Legal Form' : 'Statut Juridique'}</span>
                                <span className="legal-def-value">
                                    {isEn ? 'Sole Proprietorship / Micro-Enterprise' : 'Entrepreneur Individuel (Micro-entreprise)'}
                                </span>
                            </div>
                            <div className="legal-def-item">
                                <span className="legal-def-label">{isEn ? 'Postal Address' : 'Adresse Postale'}</span>
                                <span className="legal-def-value">59 Avenue des Alpilles, 13430 Eyguières, France</span>
                            </div>
                            <div className="legal-def-item">
                                <span className="legal-def-label">{isEn ? 'SIREN / RCS' : 'SIREN / RCS'}</span>
                                <span className="legal-def-value">992 096 156 (RCS Tarascon)</span>
                            </div>
                            <div className="legal-def-item">
                                <span className="legal-def-label">{isEn ? 'GDPR Contact Email' : 'Courriel de Contact RGPD'}</span>
                                <span className="legal-def-value">
                                    <a href="mailto:mamefricoto@gmail.com">mamefricoto@gmail.com</a>
                                </span>
                            </div>
                            <div className="legal-def-item">
                                <span className="legal-def-label">{isEn ? 'Phone' : 'Téléphone'}</span>
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
                                <h2 className="legal-card-title">
                                    {isEn ? '2. Collected Personal Data' : '2. Données Personnelles Collectées'}
                                </h2>
                                <p className="legal-card-subtitle">
                                    {isEn ? 'What data is gathered and how' : 'Quelles données sont recueillies et par quel moyen'}
                                </p>
                            </div>
                        </div>

                        <div className="legal-prose">
                            {isEn ? (
                                <>
                                    <p>
                                        In using our website, we strictly abide by the <strong>data minimization principle</strong>: only the data strictly necessary for fulfilling your requests and organizing catering events is collected.
                                    </p>
                                    <p>
                                        <strong>Via our contact and quotation request form:</strong>
                                    </p>
                                    <ul>
                                        <li><strong>Full Name:</strong> to identify you and personalize our communications;</li>
                                        <li><strong>Email Address:</strong> to send your bespoke catering quote, menu proposals, or answers;</li>
                                        <li><strong>Phone Number:</strong> essential to reach you directly to discuss recipes, confirm guest numbers, or coordinate delivery and lab pick-up;</li>
                                        <li><strong>Event Details:</strong> event category (private gathering, wedding, corporate seminar), desired date, guest headcount, and custom message (dietary restrictions, preferred flavors).</li>
                                    </ul>
                                    <p>
                                        Mandatory fields are clearly indicated with indicators on the form.
                                    </p>
                                </>
                            ) : (
                                <>
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
                                        Le caractère obligatoire des informations est indiqué lors de la saisie sur le formulaire.
                                    </p>
                                </>
                            )}
                        </div>
                    </article>

                    {/* SECTION 3: FINALITÉS ET BASES LÉGALES */}
                    <article id="finalites" className="legal-card anim-up">
                        <div className="legal-card-header">
                            <div className="legal-card-icon">
                                <FileCheck size={22} />
                            </div>
                            <div>
                                <h2 className="legal-card-title">
                                    {isEn ? '3. Purposes & Legal Bases of Processing' : '3. Finalités & Bases Légales des Traitements'}
                                </h2>
                                <p className="legal-card-subtitle">
                                    {isEn ? 'Why we process your data and our lawful basis' : 'Pourquoi nous traitons vos données et sur quel fondement légal'}
                                </p>
                            </div>
                        </div>

                        <div className="legal-prose">
                            <p>
                                {isEn
                                    ? 'Personal data gathered by Mamé Fricoto is processed exclusively for the following purposes:'
                                    : 'Les données collectées par Mamé Fricoto sont traitées pour les finalités suivantes :'}
                            </p>
                            {isEn ? (
                                <ul>
                                    <li>
                                        <strong>Quotes & Customer Inquiries:</strong> answering questions, calculating tailored menu pricing, and coordinating logistics.
                                        <br /><em>Lawful basis: Pre-contractual measures taken at your request (Art. 6.1.b GDPR).</em>
                                    </li>
                                    <li>
                                        <strong>Catering Service Execution:</strong> cooking meals, buffet preparation, delivery, or collection at our culinary workshop in Eyguières.
                                        <br /><em>Lawful basis: Performance of a service contract (Art. 6.1.b GDPR).</em>
                                    </li>
                                    <li>
                                        <strong>Invoicing & Statutory Bookkeeping:</strong> compliance with French tax and commercial obligations.
                                        <br /><em>Lawful basis: Legal obligation compliance (Art. 6.1.c GDPR).</em>
                                    </li>
                                    <li>
                                        <strong>Site Security & Spam Prevention:</strong> technical protection against fraud and abuse.
                                        <br /><em>Lawful basis: Legitimate interest of the publisher (Art. 6.1.f GDPR).</em>
                                    </li>
                                </ul>
                            ) : (
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
                            )}
                        </div>
                    </article>

                    {/* SECTION 4: DURÉE DE CONSERVATION */}
                    <article id="conservation" className="legal-card anim-up">
                        <div className="legal-card-header">
                            <div className="legal-card-icon">
                                <Clock size={22} />
                            </div>
                            <div>
                                <h2 className="legal-card-title">
                                    {isEn ? '4. Data Retention Periods' : '4. Durées de Conservation des Données'}
                                </h2>
                                <p className="legal-card-subtitle">
                                    {isEn ? 'How long your personal data is retained' : 'Combien de temps conservons-nous vos informations'}
                                </p>
                            </div>
                        </div>

                        <div className="legal-prose">
                            <p>
                                {isEn
                                    ? 'Your personal data is retained only for the duration strictly necessary for the purposes for which it was gathered:'
                                    : 'Vos données personnelles sont conservées uniquement pendant la durée strictement nécessaire à la réalisation des finalités pour lesquelles elles ont été collectées :'}
                            </p>
                            <div className="legal-def-grid">
                                <div className="legal-def-item">
                                    <span className="legal-def-label">
                                        {isEn ? 'Prospect inquiries without follow-up' : 'Demandes de devis sans suite'}
                                    </span>
                                    <span className="legal-def-value">
                                        {isEn
                                            ? 'Maximum 3 years from the date of the last active contact (French CNIL guidance).'
                                            : '3 ans maximum à compter du dernier contact émanant de votre part (recommandation CNIL).'}
                                    </span>
                                </div>
                                <div className="legal-def-item">
                                    <span className="legal-def-label">
                                        {isEn ? 'Clients with confirmed orders' : 'Clients ayant validé une prestation'}
                                    </span>
                                    <span className="legal-def-value">
                                        {isEn
                                            ? 'Duration of commercial relationship, followed by statutory legal archiving.'
                                            : 'Durée de la relation contractuelle, puis archivage pour la durée légale applicable.'}
                                    </span>
                                </div>
                                <div className="legal-def-item">
                                    <span className="legal-def-label">
                                        {isEn ? 'Invoices & accounting records' : 'Factures & pièces comptables'}
                                    </span>
                                    <span className="legal-def-value">
                                        {isEn
                                            ? '10 years (mandatory statutory obligation under Article L.123-22 of French Commercial Code).'
                                            : '10 ans (obligation légale selon l’article L. 123-22 du Code de commerce).'}
                                    </span>
                                </div>
                                <div className="legal-def-item">
                                    <span className="legal-def-label">
                                        {isEn ? 'Session & display preferences' : 'Logs et préférences de session'}
                                    </span>
                                    <span className="legal-def-value">
                                        {isEn
                                            ? 'Local browser storage, erasable at any time by clearing your browser cache.'
                                            : 'Effacées régulièrement, conservation locale modifiable à tout moment dans votre navigateur.'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </article>

                    {/* SECTION 5: COOKIES ET TRACEURS */}
                    <article id="cookies" className="legal-card anim-up">
                        <div className="legal-card-header">
                            <div className="legal-card-icon">
                                <Cookie size={22} />
                            </div>
                            <div>
                                <h2 className="legal-card-title">
                                    {isEn ? '5. Cookies & Tracking Technologies' : '5. Cookies & Traceurs'}
                                </h2>
                                <p className="legal-card-subtitle">
                                    {isEn ? 'Clear and transparent cookie policy' : 'Politique relative aux cookies de navigation'}
                                </p>
                            </div>
                        </div>

                        <div className="legal-prose">
                            <div className="legal-callout legal-callout-success">
                                <strong>{isEn ? 'Zero Invasive Trackers Guarantee:' : 'Information importante :'}</strong>{' '}
                                {isEn
                                    ? 'The Mamé Fricoto website uses NO advertising cookies, NO invasive profiling scripts, and NO third-party social tracking pixels (no Google Analytics, Facebook Pixel, TikTok, or advertising networks).'
                                    : "Le site internet Mamé Fricoto n'utilise aucun cookie publicitaire, aucun outil de pistage invasif ni aucun traceur tiers de réseaux sociaux (aucun tag Google Analytics, Facebook Pixel, TikTok ou régie publicitaire)."}
                            </div>
                            <p>
                                {isEn
                                    ? 'The only elements stored in your browser are strictly functional technical items:'
                                    : 'Les seuls éléments stockés sur votre terminal sont des éléments strictement techniques et fonctionnels nécessaires à votre navigation :'}
                            </p>
                            {isEn ? (
                                <ul>
                                    <li>
                                        <strong>Language Preference (local browser storage):</strong> the <code>mamefricoto-lang</code> key stores your display choice (French or English) for browsing comfort. It contains no personal or identifying information.
                                    </li>
                                    <li>
                                        <strong>Secure Admin Cookie:</strong> strictly reserved for the website administrator for authenticated management of menus and pricing (encrypted HTTPOnly session cookie).
                                    </li>
                                </ul>
                            ) : (
                                <ul>
                                    <li>
                                        <strong>Préférence de langue (stockage local du navigateur) :</strong> clé <code>mamefricoto-lang</code> permettant de conserver votre choix d'affichage (Français ou Anglais) lors de vos visites. Elle ne contient aucune donnée nominative.
                                    </li>
                                    <li>
                                        <strong>Cookie d'administration sécurisé :</strong> réservé exclusivement au gestionnaire du site pour l'accès authentifié à l'espace de gestion des menus et cartes (cookie chiffré HTTPOnly).
                                    </li>
                                </ul>
                            )}
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-3)' }}>
                                {isEn
                                    ? 'Under CNIL (French Data Protection Authority) regulations, strictly necessary technical cookies are exempt from prior consent banners.'
                                    : 'En vertu des lignes directrices de la CNIL, ces traceurs strictement nécessaires au fonctionnement du service sont dispensés du recueil préalable de votre consentement.'}
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
                                <h2 className="legal-card-title">
                                    {isEn ? '6. Security & Data Recipients' : '6. Sécurité & Destinataires des Données'}
                                </h2>
                                <p className="legal-card-subtitle">
                                    {isEn ? 'Technical safeguards and confidential transmission' : 'Protection technique et transferts restreints'}
                                </p>
                            </div>
                        </div>

                        <div className="legal-prose">
                            {isEn ? (
                                <>
                                    <p>
                                        <strong>Sole Recipient:</strong> All data collected through this website is exclusively and confidentially received by <strong>Léa Laurent</strong> for catering operations at Mamé Fricoto.
                                    </p>
                                    <p>
                                        <strong>Technical Infrastructure Partners:</strong> To maintain high availability, performance, and security, we partner with industry-standard providers compliant with GDPR:
                                    </p>
                                    <ul>
                                        <li><strong>Web Hosting:</strong> Vercel Inc. (cloud infrastructure with ISO 27001 and SOC 2 Type II certifications).</li>
                                        <li><strong>Email Notifications:</strong> Secure transactional SMTP transmission delivering inquiry forms directly into our professional inbox.</li>
                                    </ul>
                                    <p>
                                        <strong>Security Measures:</strong> Full TLS/SSL encryption across all pages (HTTPS), restricted admin access, and regular database integrity checks.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p>
                                        <strong>Destinataire exclusif :</strong> Les données collectées sont destinées de façon exclusive et confidentielle à <strong>Léa Laurent</strong> pour l'exploitation de Mamé Fricoto.
                                    </p>
                                    <p>
                                        <strong>Sous-traitants techniques :</strong> Pour assurer le fonctionnement fiable et sécurisé du site, nous faisons appel à des prestataires d'infrastructure reconnus qui respectent les exigences du RGPD :
                                    </p>
                                    <ul>
                                        <li><strong>Hébergement web :</strong> Vercel Inc. (infrastructures cloud hautement sécurisées bénéficiant des certifications ISO 27001 et SOC 2 Type II).</li>
                                        <li><strong>Acheminement des courriels :</strong> Protocoles d'envoi d'emails transactionnels sécurisés garantissant que vos demandes arrivent directement dans notre boîte email professionnelle.</li>
                                    </ul>
                                    <p>
                                        <strong>Mesures de sécurité déployées :</strong> Chiffrement TLS/SSL de bout en bout de l'ensemble du trafic web (HTTPS), protection renforcée de l'administration du site et sauvegardes régulières.
                                    </p>
                                </>
                            )}
                        </div>
                    </article>

                    {/* SECTION 7: VOS DROITS */}
                    <article id="droits" className="legal-card anim-up">
                        <div className="legal-card-header">
                            <div className="legal-card-icon">
                                <UserCheck size={22} />
                            </div>
                            <div>
                                <h2 className="legal-card-title">
                                    {isEn ? '7. Your GDPR Rights' : '7. Vos Droits Concernant Vos Données (RGPD)'}
                                </h2>
                                <p className="legal-card-subtitle">
                                    {isEn
                                        ? 'How to exercise your rights of access, rectification, and erasure'
                                        : "Comment exercer vos droits d'accès, de modification et d'effacement"}
                                </p>
                            </div>
                        </div>

                        <div className="legal-prose">
                            <p>
                                {isEn
                                    ? 'Under Articles 15 to 22 of Regulation (EU) 2016/679 (GDPR), you hold the following rights regarding your personal data at all times:'
                                    : 'Conformément aux articles 15 à 22 du Règlement (UE) 2016/679 (RGPD), vous disposez à tout moment des droits suivants sur vos données personnelles :'}
                            </p>
                            <div className="legal-def-grid">
                                <div className="legal-def-item">
                                    <span className="legal-def-label">
                                        {isEn ? 'Right of Access (Art. 15)' : "Droit d'accès (Art. 15)"}
                                    </span>
                                    <span className="legal-def-value">
                                        {isEn
                                            ? 'Confirm whether your data is being processed and obtain a copy.'
                                            : 'Obtenir la confirmation que des données vous concernant sont traitées et en recevoir une copie.'}
                                    </span>
                                </div>
                                <div className="legal-def-item">
                                    <span className="legal-def-label">
                                        {isEn ? 'Right to Rectification (Art. 16)' : 'Droit de rectification (Art. 16)'}
                                    </span>
                                    <span className="legal-def-value">
                                        {isEn
                                            ? 'Update or correct any inaccurate or incomplete personal information.'
                                            : 'Faire rectifier ou actualiser toute donnée inexacte ou incomplète.'}
                                    </span>
                                </div>
                                <div className="legal-def-item">
                                    <span className="legal-def-label">
                                        {isEn ? 'Right to Erasure (Art. 17)' : "Droit à l'effacement / oubli (Art. 17)"}
                                    </span>
                                    <span className="legal-def-value">
                                        {isEn
                                            ? 'Request the full deletion of your personal data, subject to legal accounting duties.'
                                            : 'Demander la suppression complète de vos données personnelles sous réserve des obligations comptables.'}
                                    </span>
                                </div>
                                <div className="legal-def-item">
                                    <span className="legal-def-label">
                                        {isEn ? 'Right to Restriction (Art. 18)' : 'Droit à la limitation (Art. 18)'}
                                    </span>
                                    <span className="legal-def-value">
                                        {isEn
                                            ? 'Request the temporary restriction of processing in specific cases.'
                                            : 'Demander le gel temporaire du traitement de vos données dans certaines situations.'}
                                    </span>
                                </div>
                                <div className="legal-def-item">
                                    <span className="legal-def-label">
                                        {isEn ? 'Right to Object (Art. 21)' : "Droit d'opposition (Art. 21)"}
                                    </span>
                                    <span className="legal-def-value">
                                        {isEn
                                            ? 'Object at any time to the processing of your personal information.'
                                            : 'Vous opposer à tout moment, pour des motifs légitimes, au traitement de vos données.'}
                                    </span>
                                </div>
                                <div className="legal-def-item">
                                    <span className="legal-def-label">
                                        {isEn ? 'Right to Portability (Art. 20)' : 'Droit à la portabilité (Art. 20)'}
                                    </span>
                                    <span className="legal-def-value">
                                        {isEn
                                            ? 'Receive your data in a structured, commonly used, machine-readable format.'
                                            : 'Recevoir vos données dans un format structuré et lisible par machine.'}
                                    </span>
                                </div>
                            </div>

                            <p style={{ marginTop: '1.5rem' }}>
                                <strong>{isEn ? 'How to exercise your rights?' : 'Comment exercer vos droits ?'}</strong><br />
                                {isEn
                                    ? 'Exercising your rights is entirely free. Simply submit a clear request specifying your identity to:'
                                    : 'L’exercice de ces droits est entièrement gratuit. Il vous suffit de nous adresser une demande claire précisant votre identité par l’un des moyens suivants :'}
                            </p>
                            <ul>
                                <li>
                                    {isEn ? 'By Email: ' : 'Par courriel : '}
                                    <a href="mailto:mamefricoto@gmail.com" style={{ fontWeight: 600 }}>
                                        mamefricoto@gmail.com
                                    </a>
                                </li>
                                <li>
                                    {isEn ? 'By Postal Mail: ' : 'Par courrier postal : '}
                                    <strong>Mamé Fricoto (Attn: Léa Laurent)</strong>, 59 Avenue des Alpilles, 13430 Eyguières, France.
                                </li>
                                <li>
                                    {isEn ? 'By Phone: ' : 'Par téléphone : '}
                                    <a href="tel:0743646411">07 43 64 64 11</a>
                                </li>
                            </ul>
                            <p>
                                {isEn
                                    ? 'You will receive a response within a maximum of 30 days following receipt of your request.'
                                    : 'Une réponse vous sera apportée dans un délai maximum de 30 jours suivant la réception de votre demande.'}
                            </p>
                            <p style={{ marginTop: '1rem' }}>
                                <strong>{isEn ? 'Filing a complaint with the Supervisory Authority:' : "Réclamation auprès de l'autorité de contrôle :"}</strong><br />
                                {isEn ? (
                                    <>
                                        If, after contacting us, you believe your rights have not been respected, you have the right to lodge a complaint with the French Data Protection Authority (<strong>CNIL</strong>):<br />
                                        Online at: <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">https://www.cnil.fr</a> or by post: CNIL, 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, France.
                                    </>
                                ) : (
                                    <>
                                        Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous avez la possibilité d’introduire une réclamation auprès de la <strong>CNIL</strong> (Commission Nationale de l’Informatique et des Libertés) :<br />
                                        En ligne sur le site : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">https://www.cnil.fr</a> ou par courrier : CNIL, 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.
                                    </>
                                )}
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
                                <h2 className="legal-card-title">
                                    {isEn ? '8. Policy Revisions & Updates' : '8. Modification de la Politique de Confidentialité'}
                                </h2>
                                <p className="legal-card-subtitle">
                                    {isEn ? 'Regulatory developments and site enhancements' : 'Évolution des fonctionnalités et de la réglementation'}
                                </p>
                            </div>
                        </div>

                        <div className="legal-prose">
                            <p>
                                {isEn
                                    ? 'Mamé Fricoto reserves the right to adapt this privacy policy at any time to reflect legal and technical changes or new site features.'
                                    : 'Mamé Fricoto se réserve le droit de faire évoluer la présente politique à tout moment pour refléter les évolutions légales, réglementaires ou jurisprudentielles, ou lors de l’intégration de nouvelles fonctionnalités sur le site.'}
                            </p>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-3)' }}>
                                <em>{isEn ? 'Last updated: October 2026.' : 'Dernière mise à jour : Octobre 2026.'}</em>
                            </p>
                        </div>
                    </article>

                    {/* SWITCHER BANNER */}
                    <div className="legal-switcher anim-up">
                        <div className="legal-switcher-text">
                            <strong>{isEn ? 'View Company Legal Information.' : "Consulter l'identification de l'entreprise."}</strong><br />
                            {isEn
                                ? 'Find SIRET, Tarascon Commercial Court registration, and hosting provider details on our Legal Notice page.'
                                : "Retrouvez le SIRET, l'immatriculation au RCS de Tarascon et l'hébergeur sur notre page Mentions Légales."}
                        </div>
                        <Link href="/mentions-legales" className="legal-switcher-btn">
                            {isEn ? 'Legal Notice' : 'Mentions Légales'} <ArrowRight size={16} />
                        </Link>
                    </div>

                </div>
            </section>
        </main>
    );
}

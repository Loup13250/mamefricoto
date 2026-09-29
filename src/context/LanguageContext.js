'use client';
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const DICTIONARY = {
    fr: {
        // Navigation & Header
        'nav.home': 'Accueil',
        'nav.tarifs': 'Tarifs',
        'nav.creations': 'Galerie',
        'nav.about': 'À Propos',
        'nav.contact': 'Contact & Devis',
        'nav.brandSubtitle': 'Cuisine Familiale & Fait Maison',
        'nav.callUs': 'Appelez-nous',
        'nav.openMenu': 'Ouvrir le menu',
        'nav.closeMenu': 'Fermer le menu',
        'nav.skipContent': 'Aller au contenu principal',

        // Info strip
        'strip.delivery': 'Livraison à domicile',
        'strip.pickup': 'Retrait au labo · Eyguières',
        'strip.hours': 'Commandes avant 10h',

        // Hero
        'hero.eyebrow': 'Traiteur Maison · Eyguières',
        'hero.viewMenu': 'Voir le menu',
        'hero.call': 'Appeler',
        'hero.prev': 'Diapositive précédente',
        'hero.next': 'Diapositive suivante',
        'hero.defaultTitle': 'Mamé Fricoto',
        'hero.defaultSubtitle': 'Cuisine Maison & Produits Frais',

        // Menu section
        'menu.badge': 'Du mardi au samedi',
        'menu.title': 'Le Menu',
        'menu.titleItalic': 'de la Semaine',
        'menu.orderPhone': 'Commandes par téléphone au {phone}.',
        'menu.orderHint': 'Livraison ou retrait au labo à Eyguières.',
        'menu.orderBtn': 'Commander par téléphone',
        'menu.quoteBtn': 'Demander un devis',
        'menu.tarifsBtn': 'Consulter les tarifs',
        'menu.emptyTitle': 'Le menu arrive très bientôt',
        'menu.emptyDesc': 'Suivez Mamé Fricoto sur Instagram pour découvrir les prochains plats faits maison.',
        'menu.followInsta': 'Suivre @mamefricoto',
        'menu.label': 'Menu de la semaine',
        'menu.prevDish': 'Plat précédent',
        'menu.nextDish': 'Plat suivant',

        // Services section
        'services.badge': 'Votre traiteur à Eyguières',
        'services.title': 'Nos Prestations',
        'services.aboutTitle': 'Ce que Nous Proposons',

        // Tarifs page
        'tarifs.badge': 'Nos Tarifs & Menus',
        'tarifs.title': 'Cartes &',
        'tarifs.titleItalic': 'Tarifs',
        'tarifs.desc': 'Consultez nos cartes et grilles tarifaires en haute définition ou format PDF pour vos déjeuners, dîners et évènements.',
        'tarifs.tabAll': 'Tout afficher',
        'tarifs.tabPrices': 'Tarifs Repas',
        'tarifs.tabDocs': 'Cartes & Menus (PDF / Images)',
        'tarifs.tabServices': 'Nos Prestations',
        'tarifs.fixedPricesTitle': 'Tarifs Fixes des Repas',
        'tarifs.fixedPricesDesc': 'Nos formules et plats préparés au jour le jour avec amour et produits frais.',
        'tarifs.docsTitle': 'Cartes & Menus à Consulter',
        'tarifs.docsDesc': 'Téléchargez ou visualisez en haute résolution nos grilles de prix, cartes de cocktails et menus complets.',
        'tarifs.openPdf': 'Ouvrir le PDF',
        'tarifs.downloadPdf': 'Télécharger le PDF',
        'tarifs.viewFullscreen': 'Agrandir',
        'tarifs.zoomClose': 'Fermer',
        'tarifs.servicesTitle': 'Nos Prestations Traiteur',
        'tarifs.servicesDesc': 'Pour vos réceptions, cocktails, mariages et repas d’entreprise sur mesure.',
        'tarifs.ctaTitle': 'Une demande particulière ou un devis ?',
        'tarifs.ctaDesc': 'Nous adaptons nos recettes et propositions à votre budget et au nombre de convives.',
        'tarifs.orderPhone': 'Commander par téléphone',
        'tarifs.quoteBtn': 'Demander un devis personnalisé',

        // About section
        'about.badge': 'Cuisine familiale & passionnée',
        'about.spirit': "L'Esprit",
        'about.spiritItalic': 'Mamé Fricoto',
        'about.learnMore': 'En savoir plus',
        'about.locationLabel': 'Localisation',
        'about.contactLabel': 'Contact',
        'about.pageBadge': 'Notre histoire',
        'about.pageTitle': 'À Propos de',
        'about.pageTagline': 'cuisine · maison · partage',
        'about.passionBadge': 'La passion de la cuisine',
        'about.authTitle': 'Une Cuisine Authentique,',
        'about.authTitleItalic': 'Préparée avec le Cœur',
        'about.method': 'Méthode',
        'about.methodVal': '100% fait maison',
        'about.sourcing': 'Approvisionnement',
        'about.sourcingVal': 'Producteurs locaux',
        'about.avail': 'Disponibilité',
        'about.availVal': 'Mardi au Samedi',
        'about.loc': 'Localisation',
        'about.locVal': 'Eyguières, 13',
        'about.tasteTitle': 'Envie de goûter ?',
        'about.tasteDesc': 'Appelez-nous pour commander votre repas du jour ou demander un devis pour vos réceptions.',

        // Google reviews strip & section
        'reviews.stars': 'Consultez les avis de nos clients sur Google',
        'reviews.btn': 'Voir les avis Google',
        'reviews.badge': 'Avis Clients Vérifiés',
        'reviews.title': 'Ce que nos clients',
        'reviews.titleItalic': 'aiment chez nous',
        'reviews.subtitle': 'Retrouvez les retours authentiques de nos convives et habitués à Eyguières et en Provence.',
        'reviews.starsNote': '5.0 ★ sur Google (51 avis vérifiés)',
        'reviews.viewAll': 'Voir tous les avis sur Google',

        // Final CTA
        'cta.badge': 'Commander',
        'cta.title': 'Une envie gourmande ?',
        'cta.desc': 'Commandez votre repas maison par téléphone. Livraison ou retrait au labo à Eyguières.',
        'cta.callBtn': 'Appeler pour commander',
        'cta.quoteBtn': 'Demander un devis',

        // Realisations / Gallery page
        'gallery.badge': 'Galerie Photos & Vidéos',
        'gallery.title': 'Galerie',
        'gallery.titleItalic': 'Les Coulisses de la Cuisine',
        'gallery.desc': 'Découvrez en images nos buffets gourmands, réceptions sur mesure, plats mijotés et nos préparations quotidiennes au labo à Eyguières.',
        'gallery.empty': 'Les photos et vidéos de la galerie seront publiées très prochainement.',
        'gallery.follow': 'Suivre @mamefricoto sur Instagram',
        'gallery.ctaBadge': 'Votre projet traiteur',
        'gallery.ctaTitle': 'Un événement à organiser ?',
        'gallery.ctaDesc': "Buffet dînatoire, anniversaire, repas d'entreprise ou menu sur mesure : contactez-nous pour échanger sur vos envies.",

        // Contact page & Form
        'contact.badge': 'Nous contacter',
        'contact.title': 'Contact &',
        'contact.titleItalic': 'Demande de Devis',
        'contact.desc': 'Pour commander vos plats de la semaine, organiser un buffet dînatoire ou réserver pour un événement.',
        'contact.formBadge': 'Discutons de votre projet',
        'contact.formTitle': 'Demande de Devis & Réservation',
        'contact.formDesc': 'Remplissez les détails ci-dessous. Mamé Fricoto vous répondra très rapidement.',
        'contact.successTitle': 'Message transmis',
        'contact.successDesc': 'Merci, nous vous recontacterons dans les plus brefs délais.',
        'contact.typeLabel': 'Type de prestation',
        'contact.nameLabel': 'Nom & Prénom *',
        'contact.namePlaceholder': 'Marie Dupont',
        'contact.directPhoneLabel': 'Téléphone',
        'contact.phoneLabel': 'Téléphone',
        'contact.optionalBadge': '(facultatif)',
        'contact.phonePlaceholder': '06 00 00 00 00',
        'contact.emailLabel': 'Adresse Email *',
        'contact.emailPlaceholder': 'marie@exemple.fr',
        'contact.dateLabel': 'Date souhaitée',
        'contact.guestsLabel': 'Nombre de convives',
        'contact.guestsPlaceholder': 'Ex : 20 personnes',
        'contact.messageLabel': 'Votre message *',
        'contact.messagePlaceholder': 'Décrivez votre projet (lieu, menu souhaité, allergies, contraintes)...',
        'contact.submitBtn': 'Envoyer ma demande',
        'contact.submitting': 'Envoi en cours...',
        'contact.directTitle': 'Coordonnées directes',
        'contact.labLabel': 'Labo',
        'contact.hoursLabel': 'Commandes',
        'contact.hoursVal': 'Avant 10h le matin',
        'contact.socialTitle': 'Mamé Fricoto sur Google',
        'contact.socialDesc': 'Consultez les avis de nos clients ou suivez nos actualités sur les réseaux.',

        // Prestation types in form
        'type.private': 'Événement Privé',
        'type.pro': 'Entreprise',
        'type.other': 'Autre',

        // Footer
        'footer.tagline': 'cuisine · maison · partage',
        'footer.desc': 'Traiteur maison basée à Eyguières. Des plats préparés avec soin, des produits frais et locaux, livrés chez vous ou à retirer au labo.',
        'footer.navTitle': 'Navigation',
        'footer.servicesTitle': 'Prestations',
        'footer.contactTitle': 'Contact',
        'footer.copyright': 'Mamé Fricoto. Tous droits réservés.',
        'footer.madeIn': 'Fait à Eyguières, Bouches-du-Rhône',
    },
    en: {
        // Navigation & Header
        'nav.home': 'Home',
        'nav.tarifs': 'Tariffs',
        'nav.creations': 'Gallery',
        'nav.about': 'About Us',
        'nav.contact': 'Contact & Quote',
        'nav.brandSubtitle': 'Homemade & Family Cuisine',
        'nav.callUs': 'Call us',
        'nav.openMenu': 'Open menu',
        'nav.closeMenu': 'Close menu',
        'nav.skipContent': 'Skip to main content',

        // Info strip
        'strip.delivery': 'Home delivery',
        'strip.pickup': 'Workshop pick-up · Eyguières',
        'strip.hours': 'Orders before 10 AM',

        // Hero
        'hero.eyebrow': 'Homemade Caterer · Eyguières, Provence',
        'hero.viewMenu': 'View Weekly Menu',
        'hero.call': 'Call',
        'hero.prev': 'Previous slide',
        'hero.next': 'Next slide',
        'hero.defaultTitle': 'Mamé Fricoto',
        'hero.defaultSubtitle': 'Homemade Cuisine & Fresh Ingredients',

        // Menu section
        'menu.badge': 'Tuesday to Saturday',
        'menu.title': 'Weekly',
        'menu.titleItalic': 'Menu',
        'menu.orderPhone': 'Phone orders at {phone}.',
        'menu.orderHint': 'Delivery or workshop pick-up in Eyguières.',
        'menu.orderBtn': 'Order by phone',
        'menu.quoteBtn': 'Request a quote',
        'menu.tarifsBtn': 'View Rates & Menus',
        'menu.emptyTitle': 'The menu is coming very soon',
        'menu.emptyDesc': 'Follow Mamé Fricoto on Instagram to discover upcoming homemade dishes.',
        'menu.followInsta': 'Follow @mamefricoto',
        'menu.label': 'Weekly Menu',
        'menu.prevDish': 'Previous dish',
        'menu.nextDish': 'Next dish',

        // Services section
        'services.badge': 'Your Caterer in Eyguières & Provence',
        'services.title': 'Our Catering Services',
        'services.aboutTitle': 'What We Offer',

        // Tarifs page
        'tarifs.badge': 'Rates & Menus',
        'tarifs.title': 'Menus &',
        'tarifs.titleItalic': 'Rates',
        'tarifs.desc': 'Browse our menus and pricing sheets in high definition image or PDF format for your daily meals, celebrations and events.',
        'tarifs.tabAll': 'All',
        'tarifs.tabPrices': 'Meal Rates',
        'tarifs.tabDocs': 'Menus & Pricing Sheets (PDF / Images)',
        'tarifs.tabServices': 'Our Catering Services',
        'tarifs.fixedPricesTitle': 'Fixed Meal Rates',
        'tarifs.fixedPricesDesc': 'Daily homemade specials and lunch formulas prepared with passion and seasonal ingredients.',
        'tarifs.docsTitle': 'Menus & Detailed Pricing Sheets',
        'tarifs.docsDesc': 'Download or view our pricing documents, cocktail selections, and seasonal menus in high definition.',
        'tarifs.openPdf': 'Open PDF',
        'tarifs.downloadPdf': 'Download PDF',
        'tarifs.viewFullscreen': 'Enlarge',
        'tarifs.zoomClose': 'Close',
        'tarifs.servicesTitle': 'Our Catering Services',
        'tarifs.servicesDesc': 'For bespoke cocktail receptions, private celebrations, weddings, and corporate seminars.',
        'tarifs.ctaTitle': 'Need a bespoke quote or special request?',
        'tarifs.ctaDesc': 'We adapt our creations and proposals to your budget and guest expectations.',
        'tarifs.orderPhone': 'Call to Order',
        'tarifs.quoteBtn': 'Request a Custom Quote',

        // About section
        'about.badge': 'Passionate & generous family cooking',
        'about.spirit': 'The Spirit of',
        'about.spiritItalic': 'Mamé Fricoto',
        'about.learnMore': 'Discover Our Story',
        'about.locationLabel': 'Location',
        'about.contactLabel': 'Contact',
        'about.pageBadge': 'Our Story',
        'about.pageTitle': 'About',
        'about.pageTagline': 'cuisine · homemade · sharing',
        'about.passionBadge': 'Passion for Authentic Cooking',
        'about.authTitle': 'Authentic Cuisine,',
        'about.authTitleItalic': 'Prepared with Heart',
        'about.method': 'Method',
        'about.methodVal': '100% Homemade',
        'about.sourcing': 'Sourcing',
        'about.sourcingVal': 'Local producers',
        'about.avail': 'Availability',
        'about.availVal': 'Tuesday to Saturday',
        'about.loc': 'Location',
        'about.locVal': 'Eyguières, Provence',
        'about.tasteTitle': 'Fancy a taste?',
        'about.tasteDesc': 'Call us to order your daily homemade meal or request a tailored quote for your receptions.',

        // Google reviews strip & section
        'reviews.stars': 'Read our customer reviews on Google',
        'reviews.btn': 'View Google Reviews',
        'reviews.badge': 'Verified Customer Reviews',
        'reviews.title': 'What our clients',
        'reviews.titleItalic': 'say about us',
        'reviews.subtitle': 'Authentic feedback from our customers regarding our homemade cuisine and catering in Provence.',
        'reviews.starsNote': '5.0 ★ on Google (51 verified reviews)',
        'reviews.viewAll': 'Read all 51 reviews on Google',

        // Final CTA
        'cta.badge': 'Order Now',
        'cta.title': 'Craving something delicious?',
        'cta.desc': 'Order your homemade meal by phone. Delivery or pickup at our culinary workshop in Eyguières.',
        'cta.callBtn': 'Call to order',
        'cta.quoteBtn': 'Request a quote',

        // Realisations / Gallery page
        'gallery.badge': 'Photo & Video Gallery',
        'gallery.title': 'Gallery',
        'gallery.titleItalic': 'Behind the Scenes in the Kitchen',
        'gallery.desc': 'Discover our gourmet cocktail buffets, bespoke wedding receptions, homemade stews, and daily culinary craft in Eyguières.',
        'gallery.empty': 'Gallery photos and videos will be published very soon.',
        'gallery.follow': 'Follow @mamefricoto on Instagram',
        'gallery.ctaBadge': 'Your Catering Project',
        'gallery.ctaTitle': 'Planning an event?',
        'gallery.ctaDesc': 'Cocktail buffet, birthday party, corporate seminar, or tailored dinner: contact us to bring your culinary wishes to life.',

        // Contact page & Form
        'contact.badge': 'Get in touch',
        'contact.title': 'Contact &',
        'contact.titleItalic': 'Quote Request',
        'contact.desc': 'To order your weekly meals, organize a cocktail buffet, or book catering for a private event.',
        'contact.formBadge': "Let's discuss your project",
        'contact.formTitle': 'Quote Request & Reservation',
        'contact.formDesc': 'Fill in the details below. Mamé Fricoto will get back to you promptly.',
        'contact.successTitle': 'Message sent',
        'contact.successDesc': 'Thank you! We will get in touch with you as soon as possible.',
        'contact.typeLabel': 'Type of service',
        'contact.nameLabel': 'Full Name *',
        'contact.namePlaceholder': 'Jane Doe',
        'contact.directPhoneLabel': 'Phone',
        'contact.phoneLabel': 'Phone Number',
        'contact.optionalBadge': '(optional)',
        'contact.phonePlaceholder': '+33 6 00 00 00 00',
        'contact.emailLabel': 'Email Address *',
        'contact.emailPlaceholder': 'jane@example.com',
        'contact.dateLabel': 'Desired date',
        'contact.guestsLabel': 'Number of guests',
        'contact.guestsPlaceholder': 'e.g. 20 guests',
        'contact.messageLabel': 'Your message *',
        'contact.messagePlaceholder': 'Describe your event (location, desired menu, dietary restrictions, timeline)...',
        'contact.submitBtn': 'Send Request',
        'contact.submitting': 'Sending...',
        'contact.directTitle': 'Direct Contact Info',
        'contact.labLabel': 'Workshop',
        'contact.hoursLabel': 'Orders',
        'contact.hoursVal': 'Before 10 AM',
        'contact.socialTitle': 'Mamé Fricoto on Google',
        'contact.socialDesc': 'Read verified reviews from our clients or follow our culinary journey on social media.',

        // Prestation types in form
        'type.private': 'Private Event',
        'type.pro': 'Corporate / Business',
        'type.other': 'Other',

        // Footer
        'footer.tagline': 'cuisine · homemade · sharing',
        'footer.desc': 'Homemade caterer based in Eyguières, Provence. Carefully prepared meals crafted with fresh, local ingredients, delivered to you or picked up at our workshop.',
        'footer.navTitle': 'Navigation',
        'footer.servicesTitle': 'Services',
        'footer.contactTitle': 'Contact',
        'footer.copyright': 'Mamé Fricoto. All rights reserved.',
        'footer.madeIn': 'Handcrafted in Eyguières, Provence',
    }
};

const LanguageContext = createContext({
    lang: 'fr',
    setLang: () => {},
    toggleLang: () => {},
    t: (key) => key,
    trans: (obj, field) => obj?.[field] || '',
});

export function LanguageProvider({ children, initialLang = 'fr' }) {
    // Always start with 'fr' to prevent SSR/client hydration mismatch.
    // The useEffect below will immediately correct the lang after mount
    // based on localStorage and browser language preferences.
    const [lang, setLangState] = useState(initialLang);
    const [mounted, setMounted] = useState(false);

    // Run once after mount: detect language from storage or browser prefs
    useEffect(() => {
        setMounted(true);
        try {
            const saved = localStorage.getItem('mamefricoto-lang');
            if (saved === 'en' || saved === 'fr') {
                setLangState(saved);
                document.documentElement.lang = saved;
                return;
            }

            // Premier accès sans choix manuel enregistré
            const navLangs = navigator.languages || [navigator.language || ''];
            const firstLang = (navLangs[0] || '').toLowerCase();
            const autoLang = firstLang.startsWith('fr') ? 'fr' : 'en';

            setLangState(autoLang);
            document.documentElement.lang = autoLang;
            document.cookie = `mamefricoto-lang=${autoLang}; path=/; max-age=31536000; SameSite=Lax`;
        } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync document.documentElement.lang whenever lang changes after mount
    useEffect(() => {
        if (!mounted) return;
        try {
            document.documentElement.lang = lang;
        } catch {}
    }, [lang, mounted]);

    const setLang = useCallback((newLang) => {
        const validLang = newLang === 'en' ? 'en' : 'fr';
        setLangState(validLang);
        try {
            localStorage.setItem('mamefricoto-lang', validLang);
            document.cookie = `mamefricoto-lang=${validLang}; path=/; max-age=31536000; SameSite=Lax`;
            document.documentElement.lang = validLang;
        } catch {}
    }, []);

    const toggleLang = useCallback(() => {
        setLang(lang === 'fr' ? 'en' : 'fr');
    }, [lang, setLang]);

    const t = useCallback((key, params = {}) => {
        const dict = DICTIONARY[lang] || DICTIONARY.fr;
        let str = dict[key] || DICTIONARY.fr[key] || key;
        if (params && typeof params === 'object') {
            for (const [pKey, pVal] of Object.entries(params)) {
                str = str.replace(new RegExp(`\\{${pKey}\\}`, 'g'), pVal);
            }
        }
        return str;
    }, [lang]);

    const trans = useCallback((obj, field) => {
        if (!obj) return '';
        if (lang === 'en') {
            const enVal = obj[field + '_en'];
            if (enVal && typeof enVal === 'string' && enVal.trim() !== '') {
                return enVal;
            }
        }
        return obj[field] || '';
    }, [lang]);

    const value = useMemo(() => ({
        lang,
        setLang,
        toggleLang,
        t,
        trans,
    }), [lang, setLang, toggleLang, t, trans]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}

import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import { getSiteInfo } from "@/lib/data";
import { LanguageProvider } from "@/context/LanguageContext";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const momerkz = localFont({
  src: [
    {
      path: "./fonts/Momerkz-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Momerkz-Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Momerkz-Regular.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-momerkz",
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://mamefricoto.vercel.app');

export const viewport = {
  themeColor: '#FAF7F2',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export async function generateMetadata() {
  const siteInfo = await getSiteInfo();
  const iconUrl = siteInfo?.site_icon || '/icon.svg';
  const isSvg = iconUrl.endsWith('.svg') || iconUrl.includes('.svg') || iconUrl.includes('image%2Fsvg');

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: "Mamé Fricoto | Traiteur & Cuisine Maison à Eyguières",
      template: "%s | Mamé Fricoto"
    },
    description: "Mamé Fricoto : Traiteur artisanal & cuisine familiale préparée avec amour à Eyguières. Menus de la semaine, plats du jour mijotés, buffets et réceptions en Provence.",
    keywords: ["traiteur Eyguières", "cuisine maison Eyguières", "plat du jour Provence", "buffet dînatoire Salon-de-Provence", "traiteur mariage Eyguières", "repas entreprise"],
    authors: [{ name: "Mamé Fricoto" }],
    creator: "Mamé Fricoto",
    publisher: "Mamé Fricoto",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      url: baseUrl,
      siteName: "Mamé Fricoto",
      title: "Mamé Fricoto | Traiteur & Cuisine Maison à Eyguières",
      description: "Cuisine familiale généreuse et de saison à Eyguières. Menus hebdomadaires et réceptions sur mesure.",
      images: [
        {
          url: "/logo.png",
          width: 500,
          height: 500,
          alt: "Mamé Fricoto - Traiteur & Cuisine Maison",
        },
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "Mamé Fricoto - Traiteur & Cuisine Maison",
        },
      ],
    },
    twitter: {
      card: "summary",
      title: "Mamé Fricoto | Traiteur & Cuisine Maison à Eyguières",
      description: "Cuisine maison et événements à Eyguières et en Provence.",
      images: ["/logo.png", "/og-image.png"],
    },
    icons: {
      icon: [
        { url: iconUrl, type: isSvg ? 'image/svg+xml' : 'image/png' },
        { url: "/favicon.ico", sizes: "any" },
      ],
      shortcut: iconUrl,
      apple: iconUrl,
    },
  };
}

export default async function RootLayout({ children }) {
  const siteInfo = await getSiteInfo();
  const iconUrl = siteInfo?.site_icon || '/icon.svg';

  return (
    <html lang="fr" suppressHydrationWarning data-theme="light" data-scroll-behavior="smooth" className={`${dmSans.variable} ${cormorant.variable} ${momerkz.variable}`}>
      <head>
        <link rel="icon" type="image/svg+xml" href={iconUrl} />
        <Script
          id="json-ld-schema"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FoodEstablishment',
              'name': 'Mamé Fricoto',
              'image': 'https://mamefricoto.fr/logo.png',
              '@id': 'https://mamefricoto.fr',
              'url': 'https://mamefricoto.fr',
              'telephone': '+33743646411',
              'address': {
                '@type': 'PostalAddress',
                'streetAddress': 'Eyguières',
                'addressLocality': 'Eyguières',
                'postalCode': '13820',
                'addressRegion': 'Bouches-du-Rhône',
                'addressCountry': 'FR',
              },
              'geo': {
                '@type': 'GeoCoordinates',
                'latitude': 43.6958,
                'longitude': 5.0319,
              },
              'servesCuisine': 'Cuisine provençale, Fait maison, Traiteur',
              'priceRange': '€€',
              'openingHoursSpecification': [
                {
                  '@type': 'OpeningHoursSpecification',
                  'dayOfWeek': ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                  'opens': '08:00',
                  'closes': '19:00',
                },
              ],
            }),
          }}
        />
        <Script
          id="theme-cleanup"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  localStorage.removeItem('mamefricoto-theme');
                  localStorage.removeItem('mamefricoto-da');
                  document.documentElement.removeAttribute('data-da');
                  document.documentElement.setAttribute('data-theme', 'light');
                } catch (e) {}
              })();
            `,
          }}
        />
        <Script
          id="language-detect"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('mamefricoto-lang');
                  var lang = saved;
                  if (!lang || (lang !== 'fr' && lang !== 'en')) {
                    var navLangs = navigator.languages || [navigator.language || ''];
                    var firstLang = (navLangs[0] || '').toLowerCase();
                    lang = firstLang.indexOf('fr') === 0 ? 'fr' : 'en';
                  }
                  document.documentElement.lang = lang;
                } catch (e) {}
              })();
            `,
          }}
        />
        <Script
          id="dev-console-signature"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  console.log(
                    "%c  Mamé Fricoto  %c\\n\\n%cSi vous observez un bug ou souhaitez me contacter :\\nEmail : loupferri@gmail.com\\n\\nSite conçu et développé par Loup - JL-Développement\\nSite web : https://jl-developpement.com/\\n",
                    "background: #C2572D; color: #FFFFFF; font-size: 14px; font-weight: bold; padding: 5px 12px; border-radius: 4px;",
                    "",
                    "font-size: 12px; color: #2A1E17; line-height: 1.6; font-family: system-ui, -apple-system, sans-serif;"
                  );
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <a href="#main-content" className="sr-only focus:not-sr-only">
          Aller au contenu principal
        </a>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}

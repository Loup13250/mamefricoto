import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import Script from "next/script";
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

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://mamefricoto.vercel.app');

export const metadata = {
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
        alt: "Mamé Fricoto — Traiteur & Cuisine Maison",
      },
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Mamé Fricoto — Traiteur & Cuisine Maison",
      },
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Mamé Fricoto — Traiteur & Cuisine Maison",
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
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning data-theme="light" className={`${dmSans.variable} ${cormorant.variable}`} data-scroll-behavior="smooth">
      <head>
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
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('mamefricoto-theme');
                  if (t === 'dark' || t === 'light') {
                    document.documentElement.setAttribute('data-theme', t);
                  } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <a href="#main-content" className="sr-only focus:not-sr-only">
          Aller au contenu principal
        </a>
        {children}
      </body>
    </html>
  );
}

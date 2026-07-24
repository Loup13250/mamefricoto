import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata = {
  metadataBase: new URL('https://mamefricoto.fr'),
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
    url: "https://mamefricoto.fr",
    siteName: "Mamé Fricoto",
    title: "Mamé Fricoto | Traiteur & Cuisine Maison à Eyguières",
    description: "Cuisine familiale généreuse et de saison à Eyguières. Menus hebdomadaires et réceptions sur mesure.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Mamé Fricoto — Traiteur & Cuisine Maison",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mamé Fricoto | Traiteur & Cuisine Maison",
    description: "Cuisine maison et événements à Eyguières et en Provence.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${dmSans.variable} ${cormorant.variable}`} data-scroll-behavior="smooth">
      <body>
        <a href="#main-content" className="sr-only focus:not-sr-only">
          Aller au contenu principal
        </a>
        {children}
      </body>
    </html>
  );
}

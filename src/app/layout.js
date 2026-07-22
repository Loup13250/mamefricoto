import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Mamé Fricoto | Traiteur Maison à Eyguières",
  description: "Cuisine maison préparée avec amour. Plats du jour, événements, repas d'entreprise et buffets dînatoires. Livraison et retrait à Eyguières et alentours.",
  keywords: "traiteur, cuisine maison, Eyguières, plat du jour, buffet dînatoire, repas entreprise, livraison",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}

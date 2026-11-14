import { Oswald, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SoundtrackPlayer from "@/components/SoundtrackPlayer";
import { SITE } from "@/lib/site";

// next/font descarga las fuentes al compilar y las sirve desde tu propio sitio.
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

// Título y descripción del sitio completo. Las páginas que definen su propio
// "title" usan el template: "Contacto · Reducido".
const defaultTitle = `${SITE.name} — ${SITE.tagline}`;

export const metadata = {
  // URL base: Next la usa para armar links absolutos (las redes los necesitan así).
  metadataBase: new URL(SITE.url),
  title: { default: defaultTitle, template: `%s · ${SITE.name}` },
  description: SITE.description,
  // Open Graph: lo que leen WhatsApp, Facebook e Instagram al compartir un link.
  openGraph: {
    title: defaultTitle,
    description: SITE.description,
    siteName: SITE.name,
    locale: "es_CL",
    type: "website",
  },
  // Lo mismo para X/Twitter; "summary_large_image" = vista previa con imagen grande.
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: SITE.description,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${oswald.variable} ${plexMono.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        {/* Vive en el layout: no se recarga al navegar con <Link>, así la música sigue */}
        <SoundtrackPlayer />
      </body>
    </html>
  );
}

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

export const metadata = {
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  description: SITE.description,
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

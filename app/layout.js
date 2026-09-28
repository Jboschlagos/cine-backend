import "./globals.css";

export const metadata = {
  title: "Página de Cine",
  description: "Reseñas de películas con banda sonora",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <nav className="flex gap-4 border-b border-neutral-800 p-4">
          <a href="/" className="text-white">Mis reseñas</a>
          <a href="/discover" className="text-white">Descubrir</a>
        </nav>
        {children}
      </body>
    </html>
  );
}

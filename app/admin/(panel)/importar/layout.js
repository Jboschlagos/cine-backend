import Link from "next/link";
import { igImportAvailable } from "@/lib/instagram";

// Envuelve /admin/importar y /admin/importar/123.
// En el sitio publicado no existe IG_EXPORT_DIR (la carpeta está en tu PC),
// así que en vez de errores mostramos un aviso claro.
export default function ImportLayout({ children }) {
  if (igImportAvailable()) return children;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-3 p-4 text-sm text-neutral-300">
      <h1 className="text-xl font-medium text-white">Importar de Instagram</h1>
      <p>
        El importador solo funciona en tu computador: lee la exportación de Instagram desde la
        carpeta <code className="text-neutral-400">IG_EXPORT_DIR</code>, que no existe en el sitio
        publicado.
      </p>
      <p>
        Ábrelo en local con <code className="text-neutral-400">npm run dev</code>; las reseñas que
        publiques ahí aparecen aquí también.
      </p>
      <Link href="/admin" className="underline hover:text-white">
        Volver al panel
      </Link>
    </div>
  );
}

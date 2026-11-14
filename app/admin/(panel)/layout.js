import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { igImportAvailable } from "@/lib/instagram";

export default async function AdminLayout({ children }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/admin/login");

  return (
    <div>
      <div className="flex items-center justify-between border-b border-neutral-800 p-4">
        <nav className="flex items-center gap-4 text-sm text-neutral-400">
          <span>Panel admin</span>
          <Link href="/admin" className="hover:text-white">Nueva reseña</Link>
          {/* Solo en tu PC: en Vercel no existe la carpeta de la exportación */}
          {igImportAvailable() && (
            <Link href="/admin/importar" className="hover:text-white">Importar de IG</Link>
          )}
        </nav>
        <LogoutButton />
      </div>
      {children}
    </div>
  );
}

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// Usar al principio de cualquier handler de API que escriba datos
// (POST/PUT/DELETE). Si no hay sesión, corta la ejecución y devuelve 401.
//
// Uso:
//   const denied = await requireAdmin();
//   if (denied) return denied;
export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}

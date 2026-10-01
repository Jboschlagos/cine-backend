"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className="text-sm text-neutral-400 underline">
      Cerrar sesión
    </button>
  );
}

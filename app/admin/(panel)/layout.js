import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

export default async function AdminLayout({ children }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/admin/login");

  return (
    <div>
      <div className="flex items-center justify-between border-b border-neutral-800 p-4">
        <span className="text-sm text-neutral-400">Panel admin</span>
        <LogoutButton />
      </div>
      {children}
    </div>
  );
}

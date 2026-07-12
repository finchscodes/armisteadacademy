import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { AdminTabs } from "@/components/admin-tabs";
import { getAdminAccessContext, hasAnyAdminAccess } from "@/lib/admin-access";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const access = await getAdminAccessContext(
    current.activeCharacter?.id ?? null,
    current.session.isAdmin
  );
  if (!hasAnyAdminAccess(access)) redirect("/");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/admin" className="font-display text-2xl text-claret-500 hover:text-claret-400">
          Admin
        </Link>
        {!access.isFullAdmin && (
          <span className="text-xs text-ink-400 uppercase tracking-wider">Limited access</span>
        )}
      </div>
      {access.isFullAdmin && <AdminTabs />}
      <div className="mt-6">{children}</div>
    </div>
  );
}

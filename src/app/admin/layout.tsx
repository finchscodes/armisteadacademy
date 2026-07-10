import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { AdminTabs } from "@/components/admin-tabs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (!current.session.isAdmin) redirect("/");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/admin" className="font-display text-2xl text-claret-500 hover:text-claret-400">
          Admin
        </Link>
      </div>
      <AdminTabs />
      <div className="mt-6">{children}</div>
    </div>
  );
}

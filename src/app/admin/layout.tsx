import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (!current.session.isAdmin) redirect("/");

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6 border-b border-ink-700 pb-4">
        <Link href="/admin" className="font-display text-2xl text-claret-500 hover:text-claret-400">
          Admin
        </Link>
      </div>
      {children}
    </div>
  );
}

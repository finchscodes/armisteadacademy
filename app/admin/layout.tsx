import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (!current.session.isAdmin) redirect("/");

  return (
    <div>
      <div className="flex items-center gap-4 mb-6 border-b border-ink-700 pb-4">
        <h1 className="font-display text-2xl text-claret-500">Admin</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin/users" className="text-ink-200 hover:text-brass-400">
            Users
          </Link>
          <Link href="/admin/classes" className="text-ink-200 hover:text-brass-400">
            Class Assignments
          </Link>
          <Link href="/admin/boards" className="text-ink-200 hover:text-brass-400">
            Boards
          </Link>
          <Link href="/admin/article-boards" className="text-ink-200 hover:text-brass-400">
            Article Boards
          </Link>
          <Link href="/admin/guide" className="text-ink-200 hover:text-brass-400">
            Guidebook
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}

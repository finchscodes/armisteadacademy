import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserDetail } from "@/actions/admin";
import { EditUserForm } from "@/components/edit-user-form";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getUserDetail(Number(id));
  if (!detail) notFound();

  const { user, characters } = detail;

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/admin/users" className="text-sm text-ink-400 hover:text-brass-400">
        &larr; All users
      </Link>
      <h1 className="font-display text-2xl text-parchment-100 mt-2 mb-6">{user.username}</h1>

      <EditUserForm userId={user.id} username={user.username} email={user.email} role={user.role} />

      <div className="mt-6">
        <h2 className="font-display text-sm uppercase tracking-wider text-ink-400 mb-2">
          Characters
        </h2>
        {characters.length === 0 ? (
          <p className="text-sm text-ink-400">No characters.</p>
        ) : (
          <div className="bg-ink-900 border border-ink-700 rounded-lg divide-y divide-ink-700">
            {characters.map((c) => (
              <Link
                key={c.id}
                href={`/c/${c.slug}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-ink-800/60 transition-colors"
              >
                <span className="text-parchment-100">{c.name}</span>
                <span className="text-xs text-ink-400">{c.major}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

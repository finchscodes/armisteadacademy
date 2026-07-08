import Link from "next/link";
import { searchUsers } from "@/actions/admin";
import { ROLE_LABELS } from "@/lib/roles";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const users = await searchUsers(q ?? "");

  return (
    <div>
      <form className="mb-4">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by username or email..."
          className="w-full max-w-md rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500"
        />
      </form>

      <div className="bg-ink-900 border border-ink-700 rounded-lg divide-y divide-ink-700">
        {users.length === 0 ? (
          <p className="px-4 py-6 text-sm text-ink-400 text-center">No users found.</p>
        ) : (
          users.map((u) => (
            <Link
              key={u.id}
              href={`/admin/users/${u.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-ink-800/60 transition-colors"
            >
              <div>
                <p className="text-parchment-100">{u.username}</p>
                <p className="text-xs text-ink-400">{u.email}</p>
              </div>
              <span className="text-xs uppercase tracking-wider text-ink-400 border border-ink-600 rounded px-2 py-1">
                {ROLE_LABELS[u.role]}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

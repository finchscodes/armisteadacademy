import Link from "next/link";
import { getStaffDirectory } from "@/lib/staff-directory";
import { ROLE_VALUES, ROLE_META, roleLabel, isListedJob, type UserRole } from "@/lib/roles";

export default async function JobsPage() {
  const staff = await getStaffDirectory();
  const byRole = new Map<UserRole, typeof staff>();
  for (const u of staff) {
    if (!byRole.has(u.role)) byRole.set(u.role, []);
    byRole.get(u.role)!.push(u);
  }

  const jobsInOrder = ROLE_VALUES.filter(isListedJob).filter((r) => byRole.has(r));

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-brass-400 mb-1">Job List</h1>
      <p className="text-ink-400 text-sm mb-6">Who&apos;s who at Armistead.</p>

      {jobsInOrder.length === 0 ? (
        <p className="text-sm text-ink-400">Nobody holds a job yet.</p>
      ) : (
        <div className="space-y-5">
          {jobsInOrder.map((role) => {
            const meta = ROLE_META[role];
            const people = byRole.get(role)!;
            return (
              <section key={role}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: meta.color ?? "#888" }}
                  />
                  <h2 className="font-display text-lg" style={{ color: meta.color ?? undefined }}>
                    {roleLabel(role)}
                  </h2>
                </div>
                {meta.description && (
                  <p className="text-xs text-ink-400 mb-2 ml-4.5">{meta.description}</p>
                )}
                <div className="bg-ink-900 border border-ink-700 rounded-lg divide-y divide-ink-700">
                  {people.map((p) => (
                    <div key={p.id} className="px-4 py-2.5 flex items-center justify-between">
                      <span className="text-parchment-100 text-sm">{p.username}</span>
                      <span className="text-xs text-ink-400">
                        {p.characters.length === 0
                          ? "no character yet"
                          : p.characters.map((c, i) => (
                              <span key={c.slug}>
                                {i > 0 && ", "}
                                <Link href={`/c/${c.slug}`} className="hover:text-brass-400">
                                  {c.name}
                                </Link>
                              </span>
                            ))}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

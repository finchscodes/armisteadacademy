import Link from "next/link";
import { getStaffDirectory } from "@/lib/staff-directory";
import { JOB_VALUES, JOB_META, jobLabel, isListedJob, type CharacterJob } from "@/lib/roles";
import { CharacterBadge } from "@/components/character-badge";

export default async function JobsPage() {
  const staff = await getStaffDirectory();
  const byJob = new Map<CharacterJob, typeof staff>();
  for (const c of staff) {
    if (!byJob.has(c.job)) byJob.set(c.job, []);
    byJob.get(c.job)!.push(c);
  }

  const jobsInOrder = JOB_VALUES.filter(isListedJob).filter((j) => byJob.has(j));

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-brass-400 mb-1">Job List</h1>
      <p className="text-ink-400 text-sm mb-6">Who&apos;s who at Armistead.</p>

      {jobsInOrder.length === 0 ? (
        <p className="text-sm text-ink-400">Nobody holds a job yet.</p>
      ) : (
        <div className="space-y-5">
          {jobsInOrder.map((job) => {
            const meta = JOB_META[job];
            const people = byJob.get(job)!;
            return (
              <section key={job}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: meta.color ?? "#888" }}
                  />
                  <h2 className="font-display text-lg" style={{ color: meta.color ?? undefined }}>
                    {jobLabel(job)}
                  </h2>
                </div>
                <div className="bg-ink-900 border border-ink-700 rounded-lg divide-y divide-ink-700">
                  {people.map((c) => (
                    <Link
                      key={c.id}
                      href={`/c/${c.slug}`}
                      className="px-4 py-2.5 flex items-center gap-3 hover:bg-ink-800/60 transition-colors"
                    >
                      <CharacterBadge name={c.name} avatarUrl={c.avatarUrl} size="sm" />
                      <span>
                        <span
                          className="block text-sm font-medium text-parchment-100"
                          style={{ color: meta.color ?? undefined }}
                        >
                          {c.firstName} {c.lastName}
                        </span>
                        <span className="block text-xs text-ink-400">
                          {c.jobTitle || `"${c.name}"`}
                        </span>
                      </span>
                    </Link>
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

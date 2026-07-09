import Link from "next/link";
import { getJobBoardData } from "@/lib/character-jobs";
import { JOB_META, jobLabel, isListedJob } from "@/lib/roles";
import { CharacterBadge } from "@/components/character-badge";

export default async function JobsPage() {
  const byJob = await getJobBoardData();

  const jobsInOrder = [...byJob.keys()].filter(isListedJob);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-display text-3xl text-brass-400 mb-1">Job List</h1>
      <p className="text-ink-400 text-sm mb-6">Who&apos;s who at Armistead.</p>

      <div className="space-y-8">
        {jobsInOrder.map((job) => {
          const meta = JOB_META[job];
          const people = byJob.get(job) ?? [];
          return (
            <section key={job}>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: meta.color ?? "#888" }}
                />
                <h2 className="font-display text-lg" style={{ color: meta.color ?? undefined }}>
                  {jobLabel(job)}
                </h2>
                <div className="flex-1 brass-rule" />
              </div>

              {people.length === 0 ? (
                <p className="text-xs text-ink-400 italic">Nobody holds this job yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {people.map((p) => (
                    <Link
                      key={`${job}-${p.characterId}`}
                      href={`/c/${p.characterSlug}`}
                      className="bg-ink-900 border border-ink-700 rounded-lg p-3 flex flex-col items-center text-center hover:border-brass-500/50 transition-colors"
                    >
                      <CharacterBadge
                        name={`${p.characterFirstName} ${p.characterLastName}`}
                        avatarUrl={p.characterAvatarUrl}
                      />
                      <span
                        className="text-sm font-medium text-parchment-100 mt-2 leading-tight"
                        style={{ color: meta.color ?? undefined }}
                      >
                        {p.characterFirstName} {p.characterLastName}
                      </span>
                      {p.jobTitle && (
                        <span className="text-[11px] text-ink-400 mt-0.5 leading-tight">
                          {p.jobTitle}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

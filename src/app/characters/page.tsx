import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getCharacterBalance } from "@/lib/economy";
import { getCharacterLevelProgress } from "@/lib/xp";
import { getCharacterYearLabel } from "@/lib/year";
import { getMajorColor } from "@/lib/majors";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

export default async function CharactersPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const stats = await Promise.all(
    current.characters.map(async (c) => ({
      id: c.id,
      balance: await getCharacterBalance(c.id),
      level: (await getCharacterLevelProgress(c.id)).level,
      year: await getCharacterYearLabel(c.id, c.major, c.yearOverride),
    }))
  );
  const statMap = new Map(stats.map((s) => [s.id, s]));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-brass-400">Your characters</h1>
        <Link
          href="/characters/new"
          className="text-sm bg-brass-500 text-ink-950 px-4 py-2 rounded-md font-medium hover:bg-brass-400 transition-colors"
        >
          + New character
        </Link>
      </div>

      {current.characters.length === 0 ? (
        <p className="text-ink-400">
          You haven&apos;t created a character yet.{" "}
          <Link href="/characters/new" className="text-brass-400 hover:underline">
            Create your first one
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {current.characters.map((c) => {
            const color = getMajorColor(c.major) ?? "#7f95a3";
            const s = statMap.get(c.id);
            return (
              <Link
                key={c.id}
                href={`/c/${c.slug}`}
                className="bg-ink-900 border border-ink-700 overflow-hidden group block"
              >
                <div className="block relative aspect-[4/3] bg-ink-800 overflow-hidden">
                  {c.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.avatarUrl}
                      alt={c.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-2xl font-display"
                      style={{ backgroundColor: `${color}26`, color }}
                    >
                      {c.firstName.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-transparent to-transparent" />
                </div>
                <div className="p-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-ink-400 truncate">
                    {c.firstName}
                  </p>
                  <p className="font-display text-base -mt-1 truncate" style={{ color }}>
                    {c.lastName}
                  </p>
                  <div className="mt-2 pt-2 border-t border-ink-800 space-y-1 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-ink-400">Major</span>
                      <span className="text-parchment-200 ml-auto text-right truncate">{c.major}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-ink-400">Year</span>
                      <span className="text-parchment-200 ml-auto">{s?.year}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-ink-400">Level</span>
                      <span className="text-parchment-200 ml-auto">{s?.level ?? 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-ink-400">Money</span>
                      <span className="text-brass-400 ml-auto">{s?.balance ?? 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

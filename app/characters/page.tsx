import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getCharacterBalance } from "@/lib/economy";
import { getCharacterLevelProgress } from "@/lib/xp";
import { getCharacterYearLabel } from "@/lib/year";
import { CharacterBadge } from "@/components/character-badge";

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {current.characters.map((c) => (
            <Link
              key={c.id}
              href={`/c/${c.slug}`}
              className="bg-ink-900 border border-ink-700 rounded-lg p-4 hover:border-brass-500/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CharacterBadge name={c.name} avatarUrl={c.avatarUrl} />
                <div className="min-w-0">
                  <p className="font-display text-lg text-parchment-100">
                    {c.firstName} {c.lastName}
                  </p>
                  <p className="text-xs text-ink-400">{c.name}</p>
                </div>
              </div>
              <p className="text-xs text-ink-400 mt-2">
                {[c.major, statMap.get(c.id)?.year].filter(Boolean).join(" · ")}
              </p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-ink-700">
                <span className="text-brass-400 text-sm">
                  {statMap.get(c.id)?.balance ?? 0} dollars
                </span>
                <span className="text-ink-400 text-xs">
                  Level {statMap.get(c.id)?.level ?? 1}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

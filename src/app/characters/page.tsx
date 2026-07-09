import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getCharacterBalance } from "@/lib/economy";
import { getCharacterLevelProgress } from "@/lib/xp";
import { getCharacterYearLabel } from "@/lib/year";

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
        <div className="grid gap-3">
          {current.characters.map((c) => (
            <Link
              key={c.id}
              href={`/c/${c.slug}`}
              className="bg-ink-900 border border-ink-700 rounded-lg p-4 flex items-center justify-between hover:border-brass-500/50 transition-colors"
            >
              <div>
                <p className="font-display text-lg text-parchment-100">{c.name}</p>
                <p className="text-xs text-ink-400">
                  {[c.major, statMap.get(c.id)?.year].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span className="text-right">
                <span className="block text-brass-400 text-sm">
                  {statMap.get(c.id)?.balance ?? 0} dollars
                </span>
                <span className="block text-ink-400 text-xs">
                  Level {statMap.get(c.id)?.level ?? 1}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { getHallTotalReputation, getHallLeaderboard } from "@/lib/reputation";
import { HALL_VALUES, hallLabel, hallColor } from "@/lib/halls";
import { CharacterHoverCard } from "@/components/character-hover-card";
import { jobColor } from "@/lib/roles";

// Reputation totals change constantly — must render per-request, never
// prerendered at build time.
export const dynamic = "force-dynamic";

export default async function ReputationPage() {
  const hallData = await Promise.all(
    HALL_VALUES.map(async (hall) => ({
      hall,
      total: await getHallTotalReputation(hall),
      leaderboard: await getHallLeaderboard(hall, 25),
    }))
  );

  return (
    <div>
      <h1 className="font-display text-3xl text-brass-400 mb-1">Reputation</h1>
      <p className="text-ink-400 text-sm mb-6">
        Earned by grading, posting in topics, and submitting homework. Feeds straight into your
        hall&apos;s total below.
      </p>

      <h2 className="font-display text-lg text-parchment-100 mb-3">Hall Reputation</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {hallData.map(({ hall, total, leaderboard }) => (
          <div key={hall} className="bg-ink-900 border border-ink-700 rounded-lg overflow-hidden">
            <div
              className="px-4 py-3 text-center"
              style={{ backgroundColor: `${hallColor(hall)}33`, borderBottom: `1px solid ${hallColor(hall)}66` }}
            >
              <h3 className="font-display text-lg" style={{ color: hallColor(hall) ?? undefined }}>
                {hallLabel(hall)}
              </h3>
              <p className="text-2xl font-display text-parchment-100 mt-1">{total}</p>
            </div>
            <div className="divide-y divide-ink-800">
              {leaderboard.length === 0 ? (
                <p className="px-4 py-4 text-xs text-ink-400 text-center">No one sorted here yet.</p>
              ) : (
                leaderboard.map((c, i) => (
                  <div key={c.id} className="flex items-start gap-2 px-3 py-2">
                    <span className="text-xs text-ink-500 w-4 shrink-0 pt-0.5">{i + 1}</span>
                    <CharacterHoverCard characterId={c.id} slug={c.slug} className="relative flex-1 min-w-0">
                      <Link
                        href={`/c/${c.slug}`}
                        className="text-xs hover:underline block"
                        style={{ color: jobColor(c.characterJob) ?? undefined }}
                      >
                        {c.firstName} {c.lastName}
                      </Link>
                    </CharacterHoverCard>
                    <span className="text-xs font-mono text-brass-400 shrink-0 pt-0.5">{c.reputation}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

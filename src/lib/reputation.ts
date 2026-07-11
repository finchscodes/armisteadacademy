import { eq, sum, inArray } from "drizzle-orm";
import { db } from "@/db";
import { reputationLedger, characters } from "@/db/schema";
import type { Hall } from "@/lib/halls";
import { MAJOR_VALUES } from "@/lib/majors";
import { getPrimaryJobsForCharacters } from "@/lib/character-jobs";

/** Reputation awarded per action. Adjust freely — nothing else depends on the exact numbers. */
export const REPUTATION_AWARDS = {
  homework_submission: 10,
  grading: 5,
  thread_created: 5,
  thread_reply: 2,
} as const;

/**
 * Reputation bonus for the submitter based on final grade tier — separate
 * from the money payout, and NOT configurable per-lesson (unlike money).
 * Awarded once, whenever a submission's grade is finalized or changed.
 */
export const GRADE_TIER_REPUTATION: Record<string, number> = {
  perfect: 15,
  excellent: 12,
  good: 7,
  needs_improvement: 5,
  failing: 0,
};

export async function awardReputation(
  characterId: number,
  amount: number,
  reason: keyof typeof REPUTATION_AWARDS | "admin_adjustment" | "homework_graded",
  note: string,
  relatedSubmissionId?: number,
  relatedPostId?: number
) {
  await db.insert(reputationLedger).values({
    characterId,
    amount,
    reason,
    note,
    relatedSubmissionId,
    relatedPostId,
  });
}

export async function getCharacterReputation(characterId: number): Promise<number> {
  const [row] = await db
    .select({ total: sum(reputationLedger.amount) })
    .from(reputationLedger)
    .where(eq(reputationLedger.characterId, characterId));
  return Number(row?.total ?? 0);
}

/** Total reputation for every character in a hall, summed. */
export async function getHallTotalReputation(hall: Hall): Promise<number> {
  const hallCharacters = await db
    .select({ id: characters.id })
    .from(characters)
    .where(eq(characters.hall, hall));
  if (hallCharacters.length === 0) return 0;

  const ids = hallCharacters.map((c) => c.id);
  const [row] = await db
    .select({ total: sum(reputationLedger.amount) })
    .from(reputationLedger)
    .where(inArray(reputationLedger.characterId, ids));
  return Number(row?.total ?? 0);
}

/** Top N reputation earners within a hall. */
export async function getHallLeaderboard(hall: Hall, limit = 25) {
  const hallCharacters = await db
    .select({
      id: characters.id,
      firstName: characters.firstName,
      lastName: characters.lastName,
      name: characters.name,
      slug: characters.slug,
      avatarUrl: characters.avatarUrl,
    })
    .from(characters)
    .where(eq(characters.hall, hall));
  if (hallCharacters.length === 0) return [];

  const ids = hallCharacters.map((c) => c.id);
  const totals = await db
    .select({ characterId: reputationLedger.characterId, total: sum(reputationLedger.amount) })
    .from(reputationLedger)
    .where(inArray(reputationLedger.characterId, ids))
    .groupBy(reputationLedger.characterId);
  const totalByCharacter = new Map(totals.map((t) => [t.characterId, Number(t.total ?? 0)]));
  const jobsByCharacter = await getPrimaryJobsForCharacters(ids);

  return hallCharacters
    .map((c) => ({
      ...c,
      reputation: totalByCharacter.get(c.id) ?? 0,
      characterJob: jobsByCharacter.get(c.id) ?? "none",
    }))
    .sort((a, b) => b.reputation - a.reputation)
    .slice(0, limit);
}

/** How many characters are in each major, for the top-of-page tile grid on /reputation. */
export async function getMajorCounts() {
  const rows = await db.select({ major: characters.major }).from(characters);
  const counts = new Map<string, number>();
  for (const m of MAJOR_VALUES) counts.set(m, 0);
  for (const r of rows) {
    counts.set(r.major, (counts.get(r.major) ?? 0) + 1);
  }
  return [...counts.entries()].map(([major, count]) => ({ major, count }));
}

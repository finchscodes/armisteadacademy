import { eq, sum } from "drizzle-orm";
import { db } from "@/db";
import { xpLedger, GRADING_LEVEL_REQUIREMENT } from "@/db/schema";
import { addRecordsEntry } from "@/lib/records";

/**
 * Increasing XP curve: the XP needed to go from level L to L+1 grows with L,
 * so each level takes more than the last.
 *   Level 1 -> 2 needs 100 XP
 *   Level 2 -> 3 needs 200 XP  (cumulative 300)
 *   Level 3 -> 4 needs 300 XP  (cumulative 600)
 *   ...
 * XP_BASE is the only knob you need to touch to retune the whole curve.
 */
const XP_BASE = 100;

/** Total cumulative XP required to REACH a given level. Level 1 requires 0. */
export function cumulativeXpForLevel(level: number): number {
  if (level <= 1) return 0;
  // Triangular growth: sum of XP_BASE * l for l = 1..level-1
  const n = level - 1;
  return (XP_BASE * n * (n + 1)) / 2;
}

export function levelForXp(totalXp: number): number {
  let level = 1;
  // Levels are small in practice (this is a forum RPG, not an idle game),
  // so a simple loop is plenty fast and easy to reason about.
  while (cumulativeXpForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

export type LevelProgress = {
  level: number;
  totalXp: number;
  currentLevelFloor: number; // cumulative XP at the start of the current level
  nextLevelFloor: number; // cumulative XP needed to reach the next level
  xpIntoLevel: number;
  xpToNextLevel: number;
  progressFraction: number; // 0-1, how far through the current level
};

export function getLevelProgress(totalXp: number): LevelProgress {
  const level = levelForXp(totalXp);
  const currentLevelFloor = cumulativeXpForLevel(level);
  const nextLevelFloor = cumulativeXpForLevel(level + 1);
  const span = nextLevelFloor - currentLevelFloor;
  const xpIntoLevel = totalXp - currentLevelFloor;

  return {
    level,
    totalXp,
    currentLevelFloor,
    nextLevelFloor,
    xpIntoLevel,
    xpToNextLevel: nextLevelFloor - totalXp,
    progressFraction: span === 0 ? 1 : xpIntoLevel / span,
  };
}

export async function getCharacterXp(characterId: number): Promise<number> {
  const [row] = await db
    .select({ total: sum(xpLedger.amount) })
    .from(xpLedger)
    .where(eq(xpLedger.characterId, characterId));

  return Number(row?.total ?? 0);
}

export async function getCharacterLevelProgress(characterId: number): Promise<LevelProgress> {
  const xp = await getCharacterXp(characterId);
  return getLevelProgress(xp);
}

export async function canGradeHomework(characterId: number): Promise<boolean> {
  const xp = await getCharacterXp(characterId);
  return levelForXp(xp) >= GRADING_LEVEL_REQUIREMENT;
}

/** XP award amounts. Change these in one place to retune the economy. */
export const XP_AWARDS = {
  chat_post: 5,
  homework_submission: 100,
  grading: 25,
  pet_cuddle: 5, // legacy — pets feature was removed, but the enum value stays for old ledger rows
} as const;

/**
 * The one path every XP grant should go through — inserts the ledger row
 * and, if it crossed a level threshold, posts an automatic entry to the
 * character's Records thread. Centralized specifically so level-up
 * detection doesn't need to be duplicated at every one of the several call
 * sites that award XP.
 */
export async function awardXp(params: {
  characterId: number;
  amount: number;
  reason: (typeof xpLedger.$inferInsert)["reason"];
  note?: string;
  relatedPostId?: number;
  relatedSubmissionId?: number;
}): Promise<void> {
  const before = await getCharacterXp(params.characterId);
  const levelBefore = levelForXp(before);

  await db.insert(xpLedger).values(params);

  const levelAfter = levelForXp(before + params.amount);
  if (levelAfter > levelBefore) {
    await addRecordsEntry(params.characterId, `Reached Level ${levelAfter}!`);
  }
}

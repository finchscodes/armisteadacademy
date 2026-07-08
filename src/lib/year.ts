import { eq, inArray, count } from "drizzle-orm";
import { db } from "@/db";
import { submissions } from "@/db/schema";

/**
 * Year is earned, not chosen: it's based on how many lessons a character has
 * taken (submitted homework for), regardless of grade. Retune the whole
 * progression by editing this table — thresholds are cumulative lesson counts.
 */
const YEAR_THRESHOLDS: { label: string; minLessons: number }[] = [
  { label: "1st Year", minLessons: 0 },
  { label: "2nd Year", minLessons: 3 },
  { label: "3rd Year", minLessons: 6 },
  { label: "4th Year", minLessons: 9 },
  { label: "5th Year", minLessons: 12 },
  { label: "Graduate", minLessons: 15 },
];

/** Lessons-taken count at which a character automatically becomes a Graduate. */
export const GRADUATE_LESSONS_THRESHOLD = YEAR_THRESHOLDS[YEAR_THRESHOLDS.length - 1].minLessons;

export function yearLabelForLessonsTaken(lessonsTaken: number): string {
  let label = YEAR_THRESHOLDS[0].label;
  for (const tier of YEAR_THRESHOLDS) {
    if (lessonsTaken >= tier.minLessons) label = tier.label;
  }
  return label;
}

export async function getLessonsTakenCount(characterId: number): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(submissions)
    .where(eq(submissions.characterId, characterId));
  return row?.total ?? 0;
}

/** Batched version for pages that display many characters at once (thread posts, feeds). */
export async function getLessonsTakenCounts(
  characterIds: number[]
): Promise<Map<number, number>> {
  if (characterIds.length === 0) return new Map();
  const rows = await db
    .select({ characterId: submissions.characterId, total: count() })
    .from(submissions)
    .where(inArray(submissions.characterId, characterIds))
    .groupBy(submissions.characterId);
  return new Map(rows.map((r) => [r.characterId, r.total]));
}

/**
 * Faculty don't progress through years — everyone else does, based on lessons taken.
 * `major` is the character's chosen major (characters.major).
 */
export async function getCharacterYearLabel(
  characterId: number,
  major: string
): Promise<string> {
  if (major === "Faculty") return "Faculty";
  const lessonsTaken = await getLessonsTakenCount(characterId);
  return yearLabelForLessonsTaken(lessonsTaken);
}

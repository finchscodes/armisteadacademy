import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";

/**
 * Year is earned by passing end-of-year exams during Summer (see
 * lib/exams.ts), tracked as a plain number on the character
 * (currentYearNumber, 1 = 1st Year) — not computed from anything else
 * anymore. An admin-set yearOverride still wins over this when present.
 */
const YEAR_NUMBER_LABELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
export const GRADUATE_AT_YEAR_NUMBER = YEAR_NUMBER_LABELS.length + 1; // 5

export function labelForYearNumber(yearNumber: number): string {
  if (yearNumber >= GRADUATE_AT_YEAR_NUMBER) return "Graduate";
  return YEAR_NUMBER_LABELS[yearNumber - 1] ?? YEAR_NUMBER_LABELS[0];
}

export function yearLabelForOverrideOrYearNumber(
  yearOverride: string | null,
  yearNumber: number
): string {
  if (yearOverride) return yearOverride;
  return labelForYearNumber(yearNumber);
}

/** Year is based on currentYearNumber, unless an admin has set a manual override. */
export async function getCharacterYearLabel(
  characterId: number,
  _major: string,
  yearOverride?: string | null
): Promise<string> {
  if (yearOverride) return yearOverride;
  const [row] = await db
    .select({ currentYearNumber: characters.currentYearNumber })
    .from(characters)
    .where(eq(characters.id, characterId));
  return labelForYearNumber(row?.currentYearNumber ?? 1);
}

/** Batched version for pages that display many characters at once (thread posts, feeds). */
export async function getYearNumbersForCharacters(characterIds: number[]): Promise<Map<number, number>> {
  if (characterIds.length === 0) return new Map();
  const rows = await db
    .select({ id: characters.id, currentYearNumber: characters.currentYearNumber })
    .from(characters)
    .where(inArray(characters.id, characterIds));
  return new Map(rows.map((r) => [r.id, r.currentYearNumber]));
}

import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { gameTime, characters, currencyLedger, characterJobs } from "@/db/schema";
import { getPrimaryJobsForCharacters } from "@/lib/character-jobs";
import type { CharacterJob } from "@/lib/roles";
import { dateFromDayIndex, type GameDate } from "@/lib/game-calendar";

export type { Quarter, GameDate } from "@/lib/game-calendar";
export { QUARTER_ORDER, QUARTER_WEEKS, WEEK_DAYS, DAY_NAMES, dateFromDayIndex, dayIndexFromDate } from "@/lib/game-calendar";

/**
 * Job -> weekly pay, as dictated exactly. Registrar and Handler are
 * student staff, not management — they only get elevated permissions for
 * their two specific grants (backstory approval, Missions board posting),
 * confirmed nowhere else in the codebase grants them anything broader.
 */
const PAYROLL_RATES: Partial<Record<CharacterJob, number>> = {
  spymaster: 200,
  secretary: 200,
  head_staff: 140,
  resident_advisor: 140,
  instructor: 80,
  chief_editor: 80,
  assistant_instructor: 40,
  prefect: 40,
  student_council: 40,
  writer: 40,
  media_team: 40,
  library_handler: 40,
  registrar: 40,
  handler: 40,
};

async function runWeeklyPayroll() {
  const rows = await db.select({ id: characterJobs.characterId }).from(characterJobs);
  const characterIds = [...new Set(rows.map((r) => r.id))];
  if (characterIds.length === 0) return;

  const jobsByCharacter = await getPrimaryJobsForCharacters(characterIds);

  for (const [characterId, job] of jobsByCharacter) {
    const rate = PAYROLL_RATES[job];
    if (!rate) continue;
    await db.insert(currencyLedger).values({
      characterId,
      amount: rate,
      reason: "weekly_payroll",
      note: "Weekly pay",
    });
  }
}

async function runBirthdayChecks(date: GameDate) {
  const matches = await db
    .select({ id: characters.id, age: characters.age })
    .from(characters)
    .where(
      and(
        eq(characters.birthdayQuarter, date.quarter),
        eq(characters.birthdayWeek, date.week),
        eq(characters.birthdayDayOfWeek, date.dayOfWeek)
      )
    );

  for (const m of matches) {
    await db
      .update(characters)
      .set({ age: m.age + 1 })
      .where(eq(characters.id, m.id));
  }
}

/**
 * The one entry point for "what time is it" — reads the singleton row, and
 * if not paused, advances it (running payroll/birthdays for every day
 * crossed) based on how much real time has passed since it was last
 * checked, at 1 real day = 1 game day. Safe to call as often as needed;
 * it's a no-op once caught up to the current real day.
 */
export async function getCurrentGameDate(): Promise<GameDate> {
  const [row] = await db.select().from(gameTime).where(eq(gameTime.id, 1));
  if (!row) {
    // Shouldn't happen outside a fresh DB that hasn't run the seed insert —
    // fall back to day 0 rather than throwing.
    return dateFromDayIndex(0);
  }

  if (row.isPaused) return dateFromDayIndex(row.dayIndex);

  const realDaysPassed = Math.floor((Date.now() - row.lastAdvancedAt.getTime()) / (24 * 60 * 60 * 1000));
  if (realDaysPassed <= 0) return dateFromDayIndex(row.dayIndex);

  let dayIndex = row.dayIndex;
  for (let i = 0; i < realDaysPassed; i++) {
    dayIndex += 1;
    const date = dateFromDayIndex(dayIndex);
    if (date.isEndOfWeek) await runWeeklyPayroll();
    await runBirthdayChecks(date);
  }

  await db.update(gameTime).set({ dayIndex, lastAdvancedAt: new Date() }).where(eq(gameTime.id, 1));

  return dateFromDayIndex(dayIndex);
}

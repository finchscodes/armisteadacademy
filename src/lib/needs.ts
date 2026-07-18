import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { ONLINE_WINDOW_MS } from "@/lib/online-status";

const DAYS_TO_EMPTY = 7;
const PERCENT_PER_HOUR = 100 / (DAYS_TO_EMPTY * 24); // ~0.595/hour
const FAINT_DURATION_MS = 60 * 60 * 1000; // 1 hour
const RECOVERY_LEVEL = 75;

export type NeedsState = {
  hunger: number;
  thirst: number;
  fainted: boolean;
  /** Ms remaining on the faint clock — only meaningful while fainted. */
  faintRemainingMs: number | null;
};

/**
 * The one entry point for "how hungry/thirsty is this character" — reads
 * the stored values and, based on how much real time has passed since the
 * last check, computes (and persists) where they'd actually be now.
 * Same lazy pattern as game time and bank interest — nothing here runs on
 * a schedule, it all resolves the moment something asks (in practice, on
 * every page load via the nav bar).
 *
 * The faint clock only counts down while the character is actively
 * online: since this function only ever runs when they're making a
 * request, each elapsed gap since the last check is capped at
 * ONLINE_WINDOW_MS before being applied to the faint timer. Continuous
 * browsing produces gaps well under that cap, so the full time counts;
 * closing the tab produces one huge gap, of which only the capped sliver
 * counts — effectively pausing the clock while they're away.
 */
export async function getCurrentNeeds(characterId: number): Promise<NeedsState> {
  const [character] = await db
    .select({
      hunger: characters.hunger,
      thirst: characters.thirst,
      lastNeedsUpdate: characters.lastNeedsUpdate,
      faintRemainingMs: characters.faintRemainingMs,
    })
    .from(characters)
    .where(eq(characters.id, characterId));

  if (!character) return { hunger: 100, thirst: 100, fainted: false, faintRemainingMs: null };

  const now = new Date();
  const elapsedMs = now.getTime() - character.lastNeedsUpdate.getTime();

  if (character.faintRemainingMs !== null) {
    // Fainted — count down, capped per-check so time offline doesn't count.
    const activeMs = Math.min(Math.max(elapsedMs, 0), ONLINE_WINDOW_MS);
    const newRemaining = character.faintRemainingMs - activeMs;

    if (newRemaining <= 0) {
      await db
        .update(characters)
        .set({ hunger: RECOVERY_LEVEL, thirst: RECOVERY_LEVEL, faintRemainingMs: null, lastNeedsUpdate: now })
        .where(eq(characters.id, characterId));
      return { hunger: RECOVERY_LEVEL, thirst: RECOVERY_LEVEL, fainted: false, faintRemainingMs: null };
    }

    await db
      .update(characters)
      .set({ faintRemainingMs: newRemaining, lastNeedsUpdate: now })
      .where(eq(characters.id, characterId));
    return { hunger: character.hunger, thirst: character.thirst, fainted: true, faintRemainingMs: newRemaining };
  }

  // Not fainted — normal draining, uncapped (this isn't a "presence" clock,
  // hunger/thirst should keep dropping whether they're online or not).
  if (elapsedMs <= 0) {
    return { hunger: character.hunger, thirst: character.thirst, fainted: false, faintRemainingMs: null };
  }

  const drain = (elapsedMs / (60 * 60 * 1000)) * PERCENT_PER_HOUR;
  const newHunger = Math.max(0, character.hunger - drain);
  const newThirst = Math.max(0, character.thirst - drain);
  const justFainted = newHunger <= 0 || newThirst <= 0;
  const newFaintRemainingMs = justFainted ? FAINT_DURATION_MS : null;

  await db
    .update(characters)
    .set({
      hunger: Math.round(newHunger),
      thirst: Math.round(newThirst),
      lastNeedsUpdate: now,
      faintRemainingMs: newFaintRemainingMs,
    })
    .where(eq(characters.id, characterId));

  return {
    hunger: Math.round(newHunger),
    thirst: Math.round(newThirst),
    fainted: justFainted,
    faintRemainingMs: newFaintRemainingMs,
  };
}

/** Convenience wrapper for action gates — is this character currently unable to act? */
export async function isFainted(characterId: number): Promise<boolean> {
  const state = await getCurrentNeeds(characterId);
  return state.fainted;
}

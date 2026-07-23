"use server";

import { eq, or, ilike } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { getCharacterYearLabel, getDisplayMajor } from "@/lib/year";
import { getPrimaryJob, getPrimaryJobsForCharacters } from "@/lib/character-jobs";
import { getStatusesForCharacter } from "@/lib/character-statuses";
import { jobColor } from "@/lib/roles";
import { hallLabel, hallColor } from "@/lib/halls";
import { getPresenceStatus, type PresenceStatus } from "@/lib/online-status";
import { getCharacterXp, levelForXp } from "@/lib/xp";

export type MiniProfile = {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  major: string;
  year: string;
  age: number;
  level: number;
  nameColor: string | null;
  presence: PresenceStatus;
  statuses: string[];
  hallLabel: string | null;
  hallColor: string | null;
};

export async function getMiniProfileAction(characterId: number): Promise<MiniProfile | null> {
  const [character] = await db.select().from(characters).where(eq(characters.id, characterId));
  if (!character) return null;

  const [year, primaryJob, statuses, xp] = await Promise.all([
    getCharacterYearLabel(character.id, character.major, character.yearOverride),
    getPrimaryJob(character.id),
    getStatusesForCharacter(character.id),
    getCharacterXp(character.id),
  ]);

  return {
    firstName: character.firstName,
    lastName: character.lastName,
    avatarUrl: character.avatarUrl,
    major: getDisplayMajor(character.major, character.currentYearNumber, character.igJobTitle, character.yearOverride),
    year,
    age: character.age,
    level: levelForXp(xp),
    nameColor: jobColor(primaryJob),
    presence: getPresenceStatus(character.lastActiveAt),
    statuses: statuses.map((s) => s.label),
    hallLabel: character.hall ? hallLabel(character.hall) : null,
    hallColor: character.hall ? hallColor(character.hall) : null,
  };
}

export type MentionCandidate = {
  id: number;
  firstName: string;
  lastName: string;
  slug: string;
  color: string | null;
};

/** Character search for the @mention autocomplete in rich text editors (articles, guide, etc). */
export async function searchCharactersForMentionAction(query: string): Promise<MentionCandidate[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const rows = await db
    .select({
      id: characters.id,
      firstName: characters.firstName,
      lastName: characters.lastName,
      slug: characters.slug,
    })
    .from(characters)
    .where(or(ilike(characters.firstName, `%${trimmed}%`), ilike(characters.lastName, `%${trimmed}%`)))
    .limit(8);

  const jobsByCharacter = await getPrimaryJobsForCharacters(rows.map((r) => r.id));

  return rows.map((r) => ({
    ...r,
    color: jobColor(jobsByCharacter.get(r.id) ?? "none"),
  }));
}

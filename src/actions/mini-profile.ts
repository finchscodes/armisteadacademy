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
  isIgJob: boolean;
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

  const displayMajor = getDisplayMajor(
    character.major,
    character.currentYearNumber,
    character.igJobTitle,
    character.yearOverride
  );

  return {
    firstName: character.firstName,
    lastName: character.lastName,
    avatarUrl: character.avatarUrl,
    major: displayMajor,
    isIgJob: displayMajor !== character.major,
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

export type CharacterNameMatch = {
  id: number;
  name: string;
  slug: string;
  avatarUrl: string | null;
};

/**
 * Character search for gift/trade "type a name" inputs (and anywhere else
 * that needs to resolve a character by their display name specifically,
 * as opposed to the @mention search below which matches legal
 * first/last name). Searches characters.name — the same field the
 * underlying gift/trade actions match against, so whatever gets picked
 * here is guaranteed to resolve correctly.
 */
export async function searchCharactersByNameAction(query: string): Promise<CharacterNameMatch[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  return db
    .select({ id: characters.id, name: characters.name, slug: characters.slug, avatarUrl: characters.avatarUrl })
    .from(characters)
    .where(ilike(characters.name, `%${trimmed}%`))
    .limit(8);
}

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

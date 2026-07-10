"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { getCharacterYearLabel } from "@/lib/year";
import { getPrimaryJob } from "@/lib/character-jobs";
import { getStatusesForCharacter } from "@/lib/character-statuses";
import { jobColor } from "@/lib/roles";
import { ONLINE_WINDOW_MS } from "@/lib/online-status";

export type MiniProfile = {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  major: string;
  year: string;
  age: number;
  nameColor: string | null;
  isOnline: boolean;
  statuses: string[];
};

export async function getMiniProfileAction(characterId: number): Promise<MiniProfile | null> {
  const [character] = await db.select().from(characters).where(eq(characters.id, characterId));
  if (!character) return null;

  const [year, primaryJob, statuses] = await Promise.all([
    getCharacterYearLabel(character.id, character.major, character.yearOverride),
    getPrimaryJob(character.id),
    getStatusesForCharacter(character.id),
  ]);

  const isOnline = Boolean(
    character.lastActiveAt && Date.now() - character.lastActiveAt.getTime() < ONLINE_WINDOW_MS
  );

  return {
    firstName: character.firstName,
    lastName: character.lastName,
    avatarUrl: character.avatarUrl,
    major: character.major,
    year,
    age: character.age,
    nameColor: jobColor(primaryJob),
    isOnline,
    statuses: statuses.map((s) => s.label),
  };
}

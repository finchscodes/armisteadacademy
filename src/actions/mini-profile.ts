"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { getCharacterYearLabel } from "@/lib/year";
import { getPrimaryJob } from "@/lib/character-jobs";
import { jobColor } from "@/lib/roles";

export type MiniProfile = {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  major: string;
  year: string;
  age: number;
  nameColor: string | null;
};

export async function getMiniProfileAction(characterId: number): Promise<MiniProfile | null> {
  const [character] = await db.select().from(characters).where(eq(characters.id, characterId));
  if (!character) return null;

  const [year, primaryJob] = await Promise.all([
    getCharacterYearLabel(character.id, character.major, character.yearOverride),
    getPrimaryJob(character.id),
  ]);

  return {
    firstName: character.firstName,
    lastName: character.lastName,
    avatarUrl: character.avatarUrl,
    major: character.major,
    year,
    age: character.age,
    nameColor: jobColor(primaryJob),
  };
}

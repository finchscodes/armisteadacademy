"use server";

import { getCurrentUser } from "@/lib/current-user";
import { getCharacterXp, levelForXp } from "@/lib/xp";

export async function getMyLevelAction(): Promise<{ characterId: number; level: number } | null> {
  const current = await getCurrentUser();
  if (!current?.activeCharacter) return null;
  const xp = await getCharacterXp(current.activeCharacter.id);
  return { characterId: current.activeCharacter.id, level: levelForXp(xp) };
}

"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { pets } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { getPetsForCharacter, CUDDLE_XP } from "@/lib/pets";
import { awardXp, XP_AWARDS } from "@/lib/xp";

export type PetActionState = { error?: string; success?: string } | undefined;

/** Anyone viewing a character's pets can cuddle one — not owner-restricted, same spirit as liking a wall post. */
export async function cuddlePetAction(
  _prevState: PetActionState,
  formData: FormData
): Promise<PetActionState> {
  const { characterId } = await requireSessionAndCharacter();
  const petId = Number(formData.get("petId"));
  if (!petId) return { error: "Pet not found" };

  const [pet] = await db.select({ id: pets.id, lastCuddledAt: pets.lastCuddledAt }).from(pets).where(eq(pets.id, petId));
  if (!pet) return { error: "Pet not found" };

  if (pet.lastCuddledAt && Date.now() - pet.lastCuddledAt.getTime() < 24 * 60 * 60 * 1000) {
    return { error: "Already cuddled today — try again tomorrow" };
  }

  await db.update(pets).set({ lastCuddledAt: new Date() }).where(eq(pets.id, petId));
  await awardXp({ characterId, amount: XP_AWARDS.pet_cuddle, reason: "pet_cuddle", note: "Cuddled a pet" });

  revalidatePath("/", "layout");
  return { success: `+${CUDDLE_XP} XP` };
}

/**
 * Cuddles every eligible (not-on-cooldown) pet a character owns, in one
 * go — pays out half of what cuddling each one individually would (an
 * intentional discount for the convenience of doing it all at once).
 */
export async function cuddleAllPetsAction(
  _prevState: PetActionState,
  formData: FormData
): Promise<PetActionState> {
  const { characterId: viewerCharacterId } = await requireSessionAndCharacter();
  const ownerCharacterId = Number(formData.get("ownerCharacterId"));
  if (!ownerCharacterId) return { error: "Character not found" };

  const ownerPets = await getPetsForCharacter(ownerCharacterId);
  const eligible = ownerPets.filter((p) => p.canCuddleNow);
  if (eligible.length === 0) return { error: "Nothing to cuddle right now — try again tomorrow" };

  const now = new Date();
  for (const p of eligible) {
    await db.update(pets).set({ lastCuddledAt: now }).where(eq(pets.id, p.id));
  }

  const totalXp = Math.round((eligible.length * XP_AWARDS.pet_cuddle) / 2);
  await awardXp({
    characterId: viewerCharacterId,
    amount: totalXp,
    reason: "pet_cuddle",
    note: `Cuddled ${eligible.length} pet${eligible.length === 1 ? "" : "s"} at once`,
  });

  revalidatePath("/", "layout");
  return { success: `+${totalXp} XP (${eligible.length} pet${eligible.length === 1 ? "" : "s"})` };
}

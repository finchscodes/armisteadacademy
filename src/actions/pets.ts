"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { pets, items, inventory } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { getPetsForCharacter, CUDDLE_XP, CARE_XP } from "@/lib/pets";
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

/** Cuddles every eligible (not-on-cooldown) pet a character owns, in one go. */
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

  const totalXp = eligible.length * XP_AWARDS.pet_cuddle;
  await awardXp({
    characterId: viewerCharacterId,
    amount: totalXp,
    reason: "pet_cuddle",
    note: `Cuddled ${eligible.length} pet${eligible.length === 1 ? "" : "s"}`,
  });

  revalidatePath("/", "layout");
  return { success: `+${totalXp} XP (${eligible.length} pet${eligible.length === 1 ? "" : "s"})` };
}

/** Feeds one pet from a chosen pet-food item in the caring character's own Arsenal — 3x the cuddle XP, once. */
export async function careForPetAction(
  _prevState: PetActionState,
  formData: FormData
): Promise<PetActionState> {
  const { characterId } = await requireSessionAndCharacter();
  const petId = Number(formData.get("petId"));
  const inventoryId = Number(formData.get("inventoryId"));
  if (!petId || !inventoryId) return { error: "Pick a pet and a food item" };

  const [pet] = await db.select({ id: pets.id, hunger: pets.hunger }).from(pets).where(eq(pets.id, petId));
  if (!pet) return { error: "Pet not found" };

  const [foodRow] = await db
    .select({
      id: inventory.id,
      quantity: inventory.quantity,
      petFoodRestore: items.petFoodRestore,
      itemName: items.name,
    })
    .from(inventory)
    .innerJoin(items, eq(inventory.itemId, items.id))
    .where(and(eq(inventory.id, inventoryId), eq(inventory.characterId, characterId)));

  if (!foodRow) return { error: "You don't have that food item" };
  if (!foodRow.petFoodRestore) return { error: "That item isn't pet food" };

  const newHunger = Math.min(100, pet.hunger + foodRow.petFoodRestore);
  await db.update(pets).set({ hunger: newHunger, lastPetNeedsUpdate: new Date() }).where(eq(pets.id, petId));

  if (foodRow.quantity > 1) {
    await db.update(inventory).set({ quantity: foodRow.quantity - 1 }).where(eq(inventory.id, foodRow.id));
  } else {
    await db.delete(inventory).where(eq(inventory.id, foodRow.id));
  }

  await awardXp({
    characterId,
    amount: CARE_XP,
    reason: "pet_cuddle",
    note: `Cared for a pet with ${foodRow.itemName}`,
  });

  revalidatePath("/", "layout");
  return { success: `+${foodRow.petFoodRestore}% hunger, +${CARE_XP} XP` };
}

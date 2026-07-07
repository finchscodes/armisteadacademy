"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pets, characters, xpLedger } from "@/db/schema";
import { getActiveCharacterId, getSession } from "@/lib/auth";
import { XP_AWARDS } from "@/lib/xp";
import type { ActionState } from "./auth";

const CUDDLE_COOLDOWN_MS = 8 * 60 * 60 * 1000; // 8 hours

async function requireSessionAndCharacter() {
  const session = await getSession();
  if (!session) redirect("/login");

  const characterId = await getActiveCharacterId();
  if (!characterId) redirect("/characters");

  const [character] = await db
    .select({ id: characters.id, userId: characters.userId })
    .from(characters)
    .where(eq(characters.id, characterId));

  if (!character || character.userId !== session.userId) {
    redirect("/characters");
  }

  return { session: session!, characterId: characterId! };
}

const adoptPetSchema = z.object({
  name: z.string().min(1, "Give your pet a name").max(64),
  species: z.string().min(1, "Pick or type a species").max(60),
  bio: z.string().max(2000).optional(),
});

export async function adoptPetAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { characterId } = await requireSessionAndCharacter();

  const parsed = adoptPetSchema.safeParse({
    name: formData.get("name"),
    species: formData.get("species"),
    bio: formData.get("bio") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, species, bio } = parsed.data;

  const [pet] = await db
    .insert(pets)
    .values({ characterId, name, species, bio })
    .returning({ id: pets.id });

  revalidatePath("/pets");
  redirect(`/pets/${pet.id}`);
}

export async function cuddlePetAction(formData: FormData) {
  const { characterId } = await requireSessionAndCharacter();
  const petId = Number(formData.get("petId"));
  if (!petId) return;

  const [pet] = await db.select().from(pets).where(eq(pets.id, petId));
  if (!pet || pet.characterId !== characterId) return;

  if (pet.lastCuddledAt) {
    const elapsed = Date.now() - pet.lastCuddledAt.getTime();
    if (elapsed < CUDDLE_COOLDOWN_MS) {
      // Still on cooldown — silently no-op. The page shows remaining time
      // and disables the button, so reaching here means a stale form resubmit.
      return;
    }
  }

  await db.update(pets).set({ lastCuddledAt: new Date() }).where(eq(pets.id, petId));

  await db.insert(xpLedger).values({
    characterId,
    amount: XP_AWARDS.pet_cuddle,
    reason: "pet_cuddle",
    relatedPetId: petId,
    note: `Cuddled ${pet.name}`,
  });

  revalidatePath(`/pets/${petId}`);
}

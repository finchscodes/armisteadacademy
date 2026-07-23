import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pets, items } from "@/db/schema";

const DAYS_TO_EMPTY = 7; // same rate as character hunger/thirst, for consistency
const PERCENT_PER_HOUR = 100 / (DAYS_TO_EMPTY * 24);
const MIN_PERSIST_INTERVAL_MS = 5 * 60 * 1000; // same reasoning as lib/needs.ts

export const CUDDLE_XP = 5;
export const CUDDLE_COOLDOWN_MS = 24 * 60 * 60 * 1000; // one cuddle per pet per real day

export type PetRow = {
  id: number;
  itemId: number;
  name: string;
  imageUrl: string | null;
  hunger: number;
  lastCuddledAt: Date | null;
  acquiredAt: Date;
  canCuddleNow: boolean;
};

/** Lazily decays and persists one pet's hunger — same pattern as lib/needs.ts, no fainting involved. */
async function resolvePetHunger(petId: number, hunger: number, lastPetNeedsUpdate: Date): Promise<number> {
  const elapsedMs = Date.now() - lastPetNeedsUpdate.getTime();
  if (elapsedMs <= 0) return hunger;

  const elapsedHours = elapsedMs / (60 * 60 * 1000);
  const newHunger = Math.max(0, Math.round(hunger - elapsedHours * PERCENT_PER_HOUR));
  if (elapsedMs >= MIN_PERSIST_INTERVAL_MS) {
    await db.update(pets).set({ hunger: newHunger, lastPetNeedsUpdate: new Date() }).where(eq(pets.id, petId));
  }
  return newHunger;
}

/** Every pet a character owns, with current (lazily-resolved) hunger. */
export async function getPetsForCharacter(characterId: number): Promise<PetRow[]> {
  const rows = await db
    .select({
      id: pets.id,
      itemId: pets.itemId,
      hunger: pets.hunger,
      lastPetNeedsUpdate: pets.lastPetNeedsUpdate,
      lastCuddledAt: pets.lastCuddledAt,
      acquiredAt: pets.acquiredAt,
      name: items.name,
      imageUrl: items.imageUrl,
    })
    .from(pets)
    .innerJoin(items, eq(pets.itemId, items.id))
    .where(eq(pets.characterId, characterId));

  const now = Date.now();
  return Promise.all(
    rows.map(async (r) => {
      const hunger = await resolvePetHunger(r.id, r.hunger, r.lastPetNeedsUpdate);
      const canCuddleNow = !r.lastCuddledAt || now - r.lastCuddledAt.getTime() >= CUDDLE_COOLDOWN_MS;
      return {
        id: r.id,
        itemId: r.itemId,
        name: r.name,
        imageUrl: r.imageUrl,
        hunger,
        lastCuddledAt: r.lastCuddledAt,
        acquiredAt: r.acquiredAt,
        canCuddleNow,
      };
    })
  );
}

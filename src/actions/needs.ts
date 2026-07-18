"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { getSession } from "@/lib/auth";
import { getCurrentNeeds } from "@/lib/needs";

const MEAL_RESTORE = 15;
const MEAL_COOLDOWN_MS = 24 * 60 * 60 * 1000; // once per real day

export type MealActionState = { error?: string; success?: string } | undefined;

/** The Dining Hall's "Have a meal" button — +15% hunger and thirst, once per real day per character. */
export async function haveAMealAction(): Promise<MealActionState> {
  const { characterId } = await requireSessionAndCharacter();

  const [character] = await db
    .select({ lastMealAt: characters.lastMealAt })
    .from(characters)
    .where(eq(characters.id, characterId));
  if (!character) return { error: "Character not found" };

  if (character.lastMealAt && Date.now() - character.lastMealAt.getTime() < MEAL_COOLDOWN_MS) {
    return { error: "Already had a meal today — come back tomorrow" };
  }

  // Not gated by fainting — a meal is exactly how you'd recover, so it
  // shouldn't itself be blocked by being too hungry/thirsty to act.
  const state = await getCurrentNeeds(characterId);
  const newHunger = Math.min(100, state.hunger + MEAL_RESTORE);
  const newThirst = Math.min(100, state.thirst + MEAL_RESTORE);

  await db
    .update(characters)
    .set({ hunger: newHunger, thirst: newThirst, lastNeedsUpdate: new Date(), lastMealAt: new Date() })
    .where(eq(characters.id, characterId));

  revalidatePath("/", "layout");
  return { success: `+${MEAL_RESTORE}% hunger and thirst` };
}

export type AdminNeedsActionState = { error?: string; success?: string } | undefined;

/** True admin only — resets a character's hunger/thirst to full and clears any active faint. */
export async function adminResetNeedsAction(formData: FormData): Promise<AdminNeedsActionState> {
  const session = await getSession();
  if (!session || !session.isAdmin) return { error: "Not authorized" };

  const characterId = Number(formData.get("characterId"));
  if (!characterId) return { error: "Character not found" };

  await db
    .update(characters)
    .set({ hunger: 100, thirst: 100, faintRemainingMs: null, lastNeedsUpdate: new Date() })
    .where(eq(characters.id, characterId));

  revalidatePath("/admin/users");
  revalidatePath("/", "layout");
  return { success: "Hunger and thirst reset" };
}

"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters, currencyLedger } from "@/db/schema";
import { getSession, setActiveCharacterId } from "@/lib/auth";
import { slugifyUnique } from "@/lib/slug";
import { MAJOR_VALUES } from "@/lib/majors";
import type { ActionState } from "./auth";

const createCharacterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(64),
  major: z.enum(MAJOR_VALUES, { message: "Pick a major" }),
  avatarUrl: z.string().url().max(2000).optional().or(z.literal("")),
  bio: z.string().max(4000).optional(),
});

const STARTING_BALANCE = 50;

export async function createCharacterAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const parsed = createCharacterSchema.safeParse({
    name: formData.get("name"),
    major: formData.get("major"),
    avatarUrl: formData.get("avatarUrl") || undefined,
    bio: formData.get("bio") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, major, avatarUrl, bio } = parsed.data;
  const slug = slugifyUnique(name);

  const [character] = await db
    .insert(characters)
    .values({
      userId: session.userId,
      name,
      slug,
      major,
      avatarUrl: avatarUrl || undefined,
      bio,
    })
    .returning({ id: characters.id });

  // Give every new character a starting balance so shops/grading have something to work with.
  await db.insert(currencyLedger).values({
    characterId: character.id,
    amount: STARTING_BALANCE,
    reason: "starting_balance",
    note: "Welcome gift",
  });

  await setActiveCharacterId(character.id);
  redirect("/");
}

export async function setActiveCharacterAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const characterId = Number(formData.get("characterId"));
  if (!characterId) return;

  // Ownership check
  const [owned] = await db
    .select({ id: characters.id })
    .from(characters)
    .where(eq(characters.id, characterId));

  if (owned) {
    await setActiveCharacterId(characterId);
  }
  revalidatePath("/");
}

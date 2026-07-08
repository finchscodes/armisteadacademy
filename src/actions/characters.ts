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

const nameRegex = /^[a-zA-Z' -]+$/;

const createCharacterSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50).regex(nameRegex, "Letters only"),
  middleName: z
    .string()
    .max(50)
    .regex(nameRegex, "Letters only")
    .optional()
    .or(z.literal("")),
  lastName: z.string().min(1, "Last name is required").max(50).regex(nameRegex, "Letters only"),
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
    firstName: formData.get("firstName"),
    middleName: formData.get("middleName") || undefined,
    lastName: formData.get("lastName"),
    name: formData.get("name"),
    major: formData.get("major"),
    avatarUrl: formData.get("avatarUrl") || undefined,
    bio: formData.get("bio") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { firstName, middleName, lastName, name, major, avatarUrl, bio } = parsed.data;
  const slug = slugifyUnique(name);

  const [character] = await db
    .insert(characters)
    .values({
      userId: session.userId,
      firstName,
      middleName: middleName || undefined,
      lastName,
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

const updateCharacterSchema = z.object({
  characterId: z.coerce.number().int(),
  name: z.string().min(2, "Name must be at least 2 characters").max(64),
  major: z.enum(MAJOR_VALUES, { message: "Pick a major" }),
  avatarUrl: z.string().url().max(2000).optional().or(z.literal("")),
  bio: z.string().max(4000).optional(),
});

export async function updateCharacterAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const parsed = updateCharacterSchema.safeParse({
    characterId: formData.get("characterId"),
    name: formData.get("name"),
    major: formData.get("major"),
    avatarUrl: formData.get("avatarUrl") || undefined,
    bio: formData.get("bio") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { characterId, name, major, avatarUrl, bio } = parsed.data;

  const [existing] = await db
    .select({ id: characters.id, userId: characters.userId, slug: characters.slug })
    .from(characters)
    .where(eq(characters.id, characterId));

  if (!existing || existing.userId !== session.userId) {
    return { error: "You don't own this character" };
  }

  await db
    .update(characters)
    .set({ name, major, avatarUrl: avatarUrl || null, bio: bio || null })
    .where(eq(characters.id, characterId));

  revalidatePath(`/c/${existing.slug}`);
  redirect(`/c/${existing.slug}`);
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

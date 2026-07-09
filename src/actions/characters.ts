"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { characters, currencyLedger } from "@/db/schema";
import { getSession, setActiveCharacterId } from "@/lib/auth";
import { slugifyUnique } from "@/lib/slug";
import { SELECTABLE_MAJORS, UNDECIDED_MAJOR } from "@/lib/majors";
import type { ActionState } from "./auth";

const nameRegex = /^[a-zA-Z' -]+$/;
const SELECTABLE_MAJOR_VALUES = SELECTABLE_MAJORS.map((m) => m.value) as [string, ...string[]];

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
  major: z.enum(SELECTABLE_MAJOR_VALUES, { message: "Pick a major" }),
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
  // Optional: the edit form only submits this while the major is still
  // Undecided (i.e. unlocked). Once locked, the field is read-only and omitted,
  // so we must not require it here.
  major: z.enum(SELECTABLE_MAJOR_VALUES).optional(),
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
    major: formData.get("major") || undefined,
    avatarUrl: formData.get("avatarUrl") || undefined,
    bio: formData.get("bio") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { characterId, name, major, avatarUrl, bio } = parsed.data;

  const [existing] = await db
    .select({ id: characters.id, userId: characters.userId, slug: characters.slug, major: characters.major })
    .from(characters)
    .where(eq(characters.id, characterId));

  if (!existing || existing.userId !== session.userId) {
    return { error: "You don't own this character" };
  }

  // Major can only be chosen once: it's locked the moment it's anything other
  // than Undecided. If they're still Undecided and submitted a choice, take it;
  // otherwise keep the existing major untouched.
  const majorToSave =
    existing.major === UNDECIDED_MAJOR && major ? major : existing.major;

  await db
    .update(characters)
    .set({ name, major: majorToSave, avatarUrl: avatarUrl || null, bio: bio || null })
    .where(eq(characters.id, characterId));

  revalidatePath(`/c/${existing.slug}`);
  redirect(`/c/${existing.slug}`);
}

export async function setActiveCharacterAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const characterId = Number(formData.get("characterId"));
  if (!characterId) return;

  // Only allow switching to a character this user actually owns.
  const [owned] = await db
    .select({ id: characters.id })
    .from(characters)
    .where(and(eq(characters.id, characterId), eq(characters.userId, session.userId)));

  if (!owned) return;

  await setActiveCharacterId(characterId);

  // The "posting as" identity affects the nav bar (in the root layout) and every
  // page that renders the active character, so revalidate the whole tree, not
  // just "/".
  revalidatePath("/", "layout");
}

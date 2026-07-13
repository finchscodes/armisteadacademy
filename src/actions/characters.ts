"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { characters, currencyLedger, chatMessages, sortingAnswers } from "@/db/schema";
import { getSession, setActiveCharacterId } from "@/lib/auth";
import { slugifyUnique } from "@/lib/slug";
import { SELECTABLE_MAJORS, UNDECIDED_MAJOR } from "@/lib/majors";
import { AGE_OPTIONS, DEFAULT_AGE, GENDER_OPTIONS, SOCIAL_STATUS_OPTIONS } from "@/lib/character-options";
import { HALL_VALUES, hallLabel } from "@/lib/halls";
import { characterHasAnyJob } from "@/lib/character-jobs";
import { MANAGEMENT_JOBS } from "@/lib/roles";
import { sanitizeRichText } from "@/lib/sanitize";
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
  age: z.coerce.number().int().refine((v) => (AGE_OPTIONS as readonly number[]).includes(v), {
    message: "Age must be between 18 and 25",
  }),
  gender: z.enum(GENDER_OPTIONS, { message: "Pick a gender" }),
  socialStatus: z.enum(SOCIAL_STATUS_OPTIONS, { message: "Pick a social status" }),
  name: z.string().min(2, "Name must be at least 2 characters").max(64),
  major: z.enum(SELECTABLE_MAJOR_VALUES, { message: "Pick a major" }),
  avatarUrl: z.string().url().max(2000).optional().or(z.literal("")),
  bio: z.string().max(4000).optional(),
});

const STARTING_BALANCE = 50;

/** Resolve a character's hall from a direct pick, or defer it ("pending") for the sorting quiz. */
function resolveHall(formData: FormData): { hall: string | null } | { error: string } {
  const hallMode = formData.get("hallMode");

  if (hallMode === "quiz") {
    // Hall stays pending — they'll take the quiz on its own page after
    // enrolling, and can chat in the meantime.
    return { hall: null };
  }

  const hall = formData.get("hall");
  if (typeof hall !== "string" || !HALL_VALUES.includes(hall as (typeof HALL_VALUES)[number])) {
    return { error: "Pick a hall" };
  }
  return { hall };
}

export async function createCharacterAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const hallResult = resolveHall(formData);
  if ("error" in hallResult) {
    return { error: hallResult.error };
  }

  const parsed = createCharacterSchema.safeParse({
    firstName: formData.get("firstName"),
    middleName: formData.get("middleName") || undefined,
    lastName: formData.get("lastName"),
    age: formData.get("age") || DEFAULT_AGE,
    gender: formData.get("gender"),
    socialStatus: formData.get("socialStatus"),
    name: formData.get("name"),
    major: formData.get("major"),
    avatarUrl: formData.get("avatarUrl") || undefined,
    bio: formData.get("bio") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { firstName, middleName, lastName, age, gender, socialStatus, name, major, avatarUrl, bio } =
    parsed.data;
  const sanitizedBio = bio ? sanitizeRichText(bio) : undefined;
  const slug = slugifyUnique(`${firstName} ${lastName}`);

  const [character] = await db
    .insert(characters)
    .values({
      userId: session.userId,
      firstName,
      age,
      gender,
      socialStatus,
      hall: hallResult.hall as (typeof HALL_VALUES)[number] | null,
      middleName: middleName || undefined,
      lastName,
      name,
      slug,
      major,
      avatarUrl: avatarUrl || undefined,
      bio: sanitizedBio,
    })
    .returning({ id: characters.id });

  // Give every new character a starting balance so shops/grading have something to work with.
  await db.insert(currencyLedger).values({
    characterId: character.id,
    amount: STARTING_BALANCE,
    reason: "starting_balance",
    note: "Welcome gift",
  });

  // Renders as "Firstname Lastname just enrolled..." — chat displays a
  // character's name directly before their message with no colon, so this
  // reads as an announcement rather than something they typed.
  await db.insert(chatMessages).values({
    characterId: character.id,
    userId: session.userId,
    content:
      hallResult.hall === null
        ? "just enrolled and is awaiting the sorting quiz!"
        : `just enrolled and moved into ${hallLabel(hallResult.hall)} hall!`,
    isAnnouncement: true,
  });

  await setActiveCharacterId(character.id);
  redirect(hallResult.hall === null ? "/sorting-quiz" : `/hall/${hallResult.hall}/welcome`);
}

/**
 * Scores a completed sorting quiz for a character whose hall is still
 * pending (deferred at creation) and moves them into the winning hall.
 */
export async function submitSortingQuizAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const characterId = Number(formData.get("characterId"));
  const [character] = await db.select().from(characters).where(eq(characters.id, characterId));
  if (!character || character.userId !== session.userId) {
    return { error: "Not authorized" };
  }
  if (character.hall !== null) {
    // Already sorted — nothing to do, just send them on.
    redirect(`/hall/${character.hall}/welcome`);
  }

  const answerIds: number[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("quiz_q") && typeof value === "string" && value) {
      answerIds.push(Number(value));
    }
  }
  if (answerIds.length === 0) {
    return { error: "Answer every question to be sorted" };
  }

  const rows = await db
    .select({ hall: sortingAnswers.hall })
    .from(sortingAnswers)
    .where(inArray(sortingAnswers.id, answerIds));
  const tally = new Map<string, number>();
  for (const r of rows) tally.set(r.hall, (tally.get(r.hall) ?? 0) + 1);
  let winner: string | null = null;
  let winnerCount = -1;
  for (const [hall, count] of tally) {
    if (count > winnerCount) {
      winner = hall;
      winnerCount = count;
    }
  }
  if (!winner) return { error: "Couldn't score the quiz — try again" };

  await db
    .update(characters)
    .set({ hall: winner as (typeof HALL_VALUES)[number] })
    .where(eq(characters.id, characterId));

  await db.insert(chatMessages).values({
    characterId: character.id,
    userId: session.userId,
    content: `was just sorted into ${hallLabel(winner)} hall!`,
    isAnnouncement: true,
  });

  redirect(`/hall/${winner}/welcome`);
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
  backstoryRating: z.coerce.number().int().min(1).max(5).optional(),
  personality: z.string().max(4000).optional(),
  appearance: z.string().max(4000).optional(),
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
    backstoryRating: formData.get("backstoryRating") || undefined,
    personality: formData.get("personality") || undefined,
    appearance: formData.get("appearance") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { characterId, name, major, avatarUrl, bio, backstoryRating, personality, appearance } = parsed.data;
  const sanitizedBio = bio ? sanitizeRichText(bio) : undefined;
  const sanitizedAppearance = appearance ? sanitizeRichText(appearance) : undefined;

  const [existing] = await db
    .select({
      id: characters.id,
      userId: characters.userId,
      slug: characters.slug,
      major: characters.major,
      bio: characters.bio,
    })
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

  // Editing the backstory puts it back to pending — a Registrar should see
  // the new version before it counts as approved again.
  const bioChanged = (sanitizedBio || null) !== (existing.bio || null);

  await db
    .update(characters)
    .set({
      name,
      major: majorToSave,
      avatarUrl: avatarUrl || null,
      bio: sanitizedBio || null,
      backstoryRating: backstoryRating ?? null,
      personality: personality || null,
      appearance: sanitizedAppearance || null,
      ...(bioChanged ? { backstoryApproved: false } : {}),
    })
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

/**
 * Approve (or un-approve) a character's backstory. Registrars and
 * admin/management can do this for any character — nothing is blocked
 * while pending, it's purely an informational badge.
 */
export async function toggleBackstoryApprovalAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const characterId = Number(formData.get("characterId"));
  if (!characterId) return;

  if (!session.isAdmin) {
    const reviewerCharacterId = Number(formData.get("reviewerCharacterId"));
    if (!reviewerCharacterId) return;
    const allowed = await characterHasAnyJob(reviewerCharacterId, [...MANAGEMENT_JOBS, "registrar"]);
    if (!allowed) return;
  }

  const [existing] = await db
    .select({ backstoryApproved: characters.backstoryApproved, slug: characters.slug })
    .from(characters)
    .where(eq(characters.id, characterId));
  if (!existing) return;

  await db
    .update(characters)
    .set({ backstoryApproved: !existing.backstoryApproved })
    .where(eq(characters.id, characterId));

  revalidatePath(`/c/${existing.slug}`);
}

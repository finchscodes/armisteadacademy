"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, or, ilike, count } from "drizzle-orm";
import { db } from "@/db";
import { users, characters, boards, classAssignments } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { JOB_VALUES } from "@/lib/roles";
import { MAJOR_VALUES } from "@/lib/majors";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !session.isAdmin) {
    throw new Error("Not authorized");
  }
  return session;
}

export async function searchUsers(query: string) {
  await requireAdmin();

  const trimmed = query.trim();
  const cols = {
    id: users.id,
    username: users.username,
    email: users.email,
    isAdmin: users.isAdmin,
    createdAt: users.createdAt,
  };
  const rows = trimmed
    ? await db
        .select(cols)
        .from(users)
        .where(or(ilike(users.username, `%${trimmed}%`), ilike(users.email, `%${trimmed}%`)))
        .limit(50)
    : await db.select(cols).from(users).limit(50);

  return rows;
}

export async function getUserDetail(userId: number) {
  await requireAdmin();

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return null;

  const userCharacters = await db
    .select({
      id: characters.id,
      name: characters.name,
      slug: characters.slug,
      major: characters.major,
      job: characters.job,
      firstName: characters.firstName,
      middleName: characters.middleName,
      lastName: characters.lastName,
    })
    .from(characters)
    .where(eq(characters.userId, userId))
    .orderBy(characters.createdAt);

  return { user, characters: userCharacters };
}

const updateUserSchema = z.object({
  userId: z.coerce.number().int(),
  username: z.string().min(3).max(32),
  email: z.string().email(),
  isAdmin: z.coerce.boolean(),
});

export type AdminActionState = { error?: string; success?: string } | undefined;

export async function updateUserAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const admin = await requireAdmin();

  const parsed = updateUserSchema.safeParse({
    userId: formData.get("userId"),
    username: formData.get("username"),
    email: formData.get("email"),
    isAdmin: formData.get("isAdmin") === "on" || formData.get("isAdmin") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { userId, username, email, isAdmin } = parsed.data;

  // Safety net: don't let the last admin remove their own admin access with
  // no one left who can restore it.
  if (userId === admin.userId && !isAdmin) {
    const [{ total }] = await db
      .select({ total: count() })
      .from(users)
      .where(eq(users.isAdmin, true));
    if (total <= 1) {
      return { error: "You're the only admin — grant it to someone else before removing your own" };
    }
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.username, username), eq(users.email, email)));
  if (existing && existing.id !== userId) {
    return { error: "That username or email is already in use by another account" };
  }

  await db.update(users).set({ username, email, isAdmin }).where(eq(users.id, userId));

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
  return { success: "Saved" };
}

const updateCharacterMajorSchema = z.object({
  characterId: z.coerce.number().int(),
  userId: z.coerce.number().int(),
  major: z.enum(MAJOR_VALUES),
});

export async function adminUpdateCharacterMajorAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = updateCharacterMajorSchema.safeParse({
    characterId: formData.get("characterId"),
    userId: formData.get("userId"),
    major: formData.get("major"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { characterId, userId, major } = parsed.data;

  // Admin can set any major freely — the only way to assign Faculty, and the
  // only way to change a character's major after it's normally locked.
  await db.update(characters).set({ major }).where(eq(characters.id, characterId));

  revalidatePath(`/admin/users/${userId}`);
  return { success: "Major updated" };
}

const updateCharacterJobSchema = z.object({
  characterId: z.coerce.number().int(),
  userId: z.coerce.number().int(),
  job: z.enum(JOB_VALUES),
});

export async function adminUpdateCharacterJobAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = updateCharacterJobSchema.safeParse({
    characterId: formData.get("characterId"),
    userId: formData.get("userId"),
    job: formData.get("job"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { characterId, userId, job } = parsed.data;
  await db.update(characters).set({ job }).where(eq(characters.id, characterId));

  revalidatePath(`/admin/users/${userId}`);
  return { success: "Job updated" };
}

const nameRegex = /^[a-zA-Z' -]+$/;

const updateCharacterNameSchema = z.object({
  characterId: z.coerce.number().int(),
  userId: z.coerce.number().int(),
  firstName: z.string().min(1, "First name is required").max(50).regex(nameRegex, "Letters only"),
  middleName: z.string().max(50).regex(nameRegex, "Letters only").optional().or(z.literal("")),
  lastName: z.string().min(1, "Last name is required").max(50).regex(nameRegex, "Letters only"),
});

export async function adminUpdateCharacterNameAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = updateCharacterNameSchema.safeParse({
    characterId: formData.get("characterId"),
    userId: formData.get("userId"),
    firstName: formData.get("firstName"),
    middleName: formData.get("middleName") || undefined,
    lastName: formData.get("lastName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { characterId, userId, firstName, middleName, lastName } = parsed.data;

  await db
    .update(characters)
    .set({ firstName, middleName: middleName || null, lastName })
    .where(eq(characters.id, characterId));

  revalidatePath(`/admin/users/${userId}`);
  return { success: "Legal name updated" };
}

/* -------------------------------------------------------------------------- */
/*  Class assignments                                                         */
/* -------------------------------------------------------------------------- */

/** All class boards, plus every character currently assigned to each. */
export async function getClassAssignmentOverview() {
  await requireAdmin();

  const classBoards = await db
    .select({ id: boards.id, name: boards.name, slug: boards.slug })
    .from(boards)
    .where(eq(boards.kind, "class"))
    .orderBy(boards.position);

  const assignments = await db
    .select({
      id: classAssignments.id,
      boardId: classAssignments.boardId,
      characterId: characters.id,
      characterName: characters.name,
      characterSlug: characters.slug,
    })
    .from(classAssignments)
    .innerJoin(characters, eq(classAssignments.characterId, characters.id));

  return classBoards.map((b) => ({
    ...b,
    assigned: assignments.filter((a) => a.boardId === b.id),
  }));
}

/** Look up a character by exact code name, for the assignment form. */
export async function findCharacterByName(name: string) {
  await requireAdmin();
  const [character] = await db
    .select({ id: characters.id, name: characters.name })
    .from(characters)
    .where(eq(characters.name, name.trim()))
    .limit(1);
  return character ?? null;
}

const assignSchema = z.object({
  boardId: z.coerce.number().int(),
  characterName: z.string().min(1),
});

export async function assignClassAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = assignSchema.safeParse({
    boardId: formData.get("boardId"),
    characterName: formData.get("characterName"),
  });
  if (!parsed.success) {
    return { error: "Enter a character name" };
  }

  const character = await findCharacterByName(parsed.data.characterName);
  if (!character) {
    return { error: `No character found with the exact name "${parsed.data.characterName}"` };
  }

  await db
    .insert(classAssignments)
    .values({ characterId: character.id, boardId: parsed.data.boardId })
    .onConflictDoNothing();

  revalidatePath("/admin/classes");
  return { success: `Assigned ${character.name}` };
}

export async function unassignClassAction(formData: FormData) {
  await requireAdmin();
  const assignmentId = Number(formData.get("assignmentId"));
  if (assignmentId) {
    await db.delete(classAssignments).where(eq(classAssignments.id, assignmentId));
    revalidatePath("/admin/classes");
  }
}

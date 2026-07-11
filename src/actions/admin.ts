"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, or, ilike, count, and, inArray, desc, ne } from "drizzle-orm";
import { db } from "@/db";
import { users, characters, boards, characterJobs, boardPostPermissions, xpLedger, currencyLedger, characterStatuses, homeAnnouncement, spotlightEntries, sortingQuestions, sortingAnswers, submissions, lessons, hallWelcomeMessages, siteLinks } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { JOB_VALUES } from "@/lib/roles";
import { MAJOR_VALUES } from "@/lib/majors";
import { getCharacterXp, cumulativeXpForLevel } from "@/lib/xp";
import { getCharacterBalance } from "@/lib/economy";
import { slugifyUnique } from "@/lib/slug";
import { GENDER_OPTIONS, SOCIAL_STATUS_OPTIONS } from "@/lib/character-options";
import { HALL_VALUES } from "@/lib/halls";
import { getPrimaryJobsForCharacters, isScopedToBoard } from "@/lib/character-jobs";
import { GRADE_TIER_VALUES, GRADE_TIER_META, computePayout } from "@/lib/grading";

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
      age: characters.age,
      gender: characters.gender,
      socialStatus: characters.socialStatus,
      hall: characters.hall,
      yearOverride: characters.yearOverride,
      firstName: characters.firstName,
      middleName: characters.middleName,
      lastName: characters.lastName,
      chatTimeoutUntil: characters.chatTimeoutUntil,
    })
    .from(characters)
    .where(eq(characters.userId, userId))
    .orderBy(characters.createdAt);

  const characterIds = userCharacters.map((c) => c.id);
  const allJobs =
    characterIds.length > 0
      ? await db
          .select({
            id: characterJobs.id,
            characterId: characterJobs.characterId,
            job: characterJobs.job,
            jobTitle: characterJobs.jobTitle,
            scopeBoardId: characterJobs.scopeBoardId,
            scopeBoardName: boards.name,
            isHidden: characterJobs.isHidden,
          })
          .from(characterJobs)
          .leftJoin(boards, eq(characterJobs.scopeBoardId, boards.id))
          .where(inArray(characterJobs.characterId, characterIds))
      : [];
  const allStatuses =
    characterIds.length > 0
      ? await db.select().from(characterStatuses).where(inArray(characterStatuses.characterId, characterIds))
      : [];

  const withJobs = await Promise.all(
    userCharacters.map(async (c) => ({
      ...c,
      jobs: allJobs.filter((j) => j.characterId === c.id),
      statuses: allStatuses.filter((s) => s.characterId === c.id),
      xp: await getCharacterXp(c.id),
      balance: await getCharacterBalance(c.id),
    }))
  );

  return { user, characters: withJobs };
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

  // Admin can set any major freely — the only way to change a character's
  // major after it's normally locked.
  await db.update(characters).set({ major }).where(eq(characters.id, characterId));

  revalidatePath(`/admin/users/${userId}`);
  return { success: "Major updated" };
}

const addCharacterJobSchema = z.object({
  characterId: z.coerce.number().int(),
  userId: z.coerce.number().int(),
  job: z.enum(JOB_VALUES),
  jobTitle: z.string().max(100).optional().or(z.literal("")),
  scopeBoardId: z.coerce.number().int().optional(),
  isHidden: z.coerce.boolean().optional(),
});

export async function adminAddCharacterJobAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = addCharacterJobSchema.safeParse({
    characterId: formData.get("characterId"),
    userId: formData.get("userId"),
    job: formData.get("job"),
    jobTitle: formData.get("jobTitle") || undefined,
    scopeBoardId: formData.get("scopeBoardId") || undefined,
    isHidden: formData.get("isHidden") ? true : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { characterId, userId, job, jobTitle, scopeBoardId, isHidden } = parsed.data;

  if (job === "none") {
    return { error: "Pick an actual job to add" };
  }

  // Scoped jobs (Writer, Instructor, Assistant Instructor, RA) can be held
  // for more than one board at once, so uniqueness includes the scope.
  // Unscoped jobs stay one-row-per-job, same as before.
  const matchConditions = scopeBoardId
    ? and(
        eq(characterJobs.characterId, characterId),
        eq(characterJobs.job, job),
        eq(characterJobs.scopeBoardId, scopeBoardId)
      )
    : and(eq(characterJobs.characterId, characterId), eq(characterJobs.job, job));

  const [existing] = await db.select({ id: characterJobs.id }).from(characterJobs).where(matchConditions);

  if (existing) {
    // Already holds this job (at this scope) — just update the title/hidden flag if given.
    await db
      .update(characterJobs)
      .set({ jobTitle: jobTitle || null, isHidden: Boolean(isHidden) })
      .where(eq(characterJobs.id, existing.id));
  } else {
    await db.insert(characterJobs).values({
      characterId,
      job,
      jobTitle: jobTitle || null,
      scopeBoardId: scopeBoardId ?? null,
      isHidden: Boolean(isHidden),
    });
  }

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/jobs");
  return { success: "Job added" };
}

export async function adminRemoveCharacterJobAction(formData: FormData) {
  await requireAdmin();
  const jobRowId = Number(formData.get("jobRowId"));
  const userId = Number(formData.get("userId"));
  if (!jobRowId) return;

  await db.delete(characterJobs).where(eq(characterJobs.id, jobRowId));

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/jobs");
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

/**
 * Look up a character by their locked legal name (first + last), not their
 * code name — code names can be changed anytime by the owner, so keying
 * assignments off them would let someone dodge/spoof an assignment by
 * renaming. Legal name is locked and admin-only to change.
 */
export async function findCharacterByLegalName(firstName: string, lastName: string) {
  await requireAdmin();
  const [character] = await db
    .select({ id: characters.id, firstName: characters.firstName, lastName: characters.lastName })
    .from(characters)
    .where(
      and(
        ilike(characters.firstName, firstName.trim()),
        ilike(characters.lastName, lastName.trim())
      )
    )
    .limit(1);
  return character ?? null;
}

/* -------------------------------------------------------------------------- */
/*  Admin character management: age, year override, delete                    */
/* -------------------------------------------------------------------------- */

const updateAgeSchema = z.object({
  characterId: z.coerce.number().int(),
  userId: z.coerce.number().int(),
  age: z.coerce.number().int().min(1, "Age must be at least 1").max(999, "That age is too large"),
});

export async function adminUpdateCharacterAgeAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = updateAgeSchema.safeParse({
    characterId: formData.get("characterId"),
    userId: formData.get("userId"),
    age: formData.get("age"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db
    .update(characters)
    .set({ age: parsed.data.age })
    .where(eq(characters.id, parsed.data.characterId));

  revalidatePath(`/admin/users/${parsed.data.userId}`);
  return { success: "Age updated" };
}

const YEAR_OVERRIDE_VALUES = [
  "auto",
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "Graduate",
] as const;

const updateYearSchema = z.object({
  characterId: z.coerce.number().int(),
  userId: z.coerce.number().int(),
  yearOverride: z.enum(YEAR_OVERRIDE_VALUES),
});

export async function adminUpdateCharacterYearAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = updateYearSchema.safeParse({
    characterId: formData.get("characterId"),
    userId: formData.get("userId"),
    yearOverride: formData.get("yearOverride"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { characterId, userId, yearOverride } = parsed.data;
  await db
    .update(characters)
    .set({ yearOverride: yearOverride === "auto" ? null : yearOverride })
    .where(eq(characters.id, characterId));

  revalidatePath(`/admin/users/${userId}`);
  return { success: "Year updated" };
}

export async function adminDeleteCharacterAction(formData: FormData) {
  await requireAdmin();
  const characterId = Number(formData.get("characterId"));
  const userId = Number(formData.get("userId"));
  if (!characterId) return;

  // Cascades to that character's threads, posts, reactions, comments,
  // ledger entries, and class assignments.
  await db.delete(characters).where(eq(characters.id, characterId));

  revalidatePath(`/admin/users/${userId}`);
}

/** Permanently delete an entire account, including every character on it. */
export async function adminDeleteUserAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = Number(formData.get("userId"));
  if (!userId) return;

  if (userId === admin.userId) {
    return; // can't delete yourself from here — avoid locking yourself out
  }

  // Cascades to their characters (which cascade further to threads, posts,
  // reactions, comments, ledger entries, class assignments) plus their
  // direct chat messages.
  await db.delete(users).where(eq(users.id, userId));

  revalidatePath("/admin/users");
}

/* -------------------------------------------------------------------------- */
/*  Article board permissions (Notice Board, Community Board)                 */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*  Editing board names and descriptions                                      */
/* -------------------------------------------------------------------------- */

/** Every board, ordered like the site nav (category -> children, in position order). */
export async function getAllBoardsForAdmin() {
  await requireAdmin();

  const allBoards = await db.select().from(boards).orderBy(boards.position);
  const categories = allBoards.filter((b) => b.kind === "category");
  const others = allBoards.filter((b) => b.kind !== "category");

  return categories.map((cat) => ({
    ...cat,
    children: others.filter((b) => b.parentId === cat.id),
  }));
}

export async function getBoardForAdmin(boardId: number) {
  await requireAdmin();
  const [board] = await db.select().from(boards).where(eq(boards.id, boardId));
  return board ?? null;
}

const updateBoardSchema = z.object({
  boardId: z.coerce.number().int(),
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(2000).optional().or(z.literal("")),
  imageUrl: z.string().url().max(2000).optional().or(z.literal("")),
});

export async function adminUpdateBoardAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = updateBoardSchema.safeParse({
    boardId: formData.get("boardId"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { boardId, name, description, imageUrl } = parsed.data;
  await db
    .update(boards)
    .set({ name, description: description || null, imageUrl: imageUrl || null })
    .where(eq(boards.id, boardId));

  revalidatePath("/admin/boards");
  revalidatePath("/", "layout"); // nav mega-menu shows board names
  return { success: "Board updated" };
}

/* -------------------------------------------------------------------------- */
/*  Creating and deleting boards                                              */
/* -------------------------------------------------------------------------- */

/** Every category, for the "parent" picker when creating a new board. */
export async function getCategoriesForAdmin() {
  await requireAdmin();
  return db
    .select({ id: boards.id, name: boards.name })
    .from(boards)
    .where(eq(boards.kind, "category"))
    .orderBy(boards.position);
}

const createBoardSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  kind: z.enum(["category", "board", "class", "article"]),
  parentId: z.coerce.number().int().optional(),
  description: z.string().max(2000).optional().or(z.literal("")),
  extraArticleJob: z.enum(JOB_VALUES).optional(),
});

export async function adminCreateBoardAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = createBoardSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    parentId: formData.get("parentId") || undefined,
    description: formData.get("description") || undefined,
    extraArticleJob: formData.get("extraArticleJob") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, kind, parentId, description, extraArticleJob } = parsed.data;

  if (kind !== "category" && !parentId) {
    return { error: "Pick a parent category" };
  }

  const slug = slugifyUnique(name);
  const siblings = parentId
    ? await db.select({ id: boards.id }).from(boards).where(eq(boards.parentId, parentId))
    : await db.select({ id: boards.id }).from(boards).where(eq(boards.kind, "category"));

  await db.insert(boards).values({
    kind,
    parentId: kind === "category" ? null : parentId,
    name,
    slug,
    description: description || null,
    extraArticleJob: kind === "article" ? extraArticleJob || null : null,
    position: siblings.length,
  });

  revalidatePath("/admin/boards");
  revalidatePath("/", "layout");
  return { success: `"${name}" created` };
}

export async function adminDeleteBoardAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();
  const boardId = Number(formData.get("boardId"));
  if (!boardId) return { error: "Missing board" };

  // boards.parentId isn't a real foreign key (self-referencing FKs get messy),
  // so a category's children won't cascade automatically — check first rather
  // than silently orphaning them.
  const children = await db.select({ id: boards.id }).from(boards).where(eq(boards.parentId, boardId));
  if (children.length > 0) {
    return { error: `Delete or move its ${children.length} board(s) first` };
  }

  await db.delete(boards).where(eq(boards.id, boardId));

  revalidatePath("/admin/boards");
  revalidatePath("/", "layout");
  return { success: "Board deleted" };
}

/* -------------------------------------------------------------------------- */
/*  Adjusting a character's level (XP) and money — both ledger-based, so we   */
/*  insert one adjustment entry for the delta rather than overwriting a       */
/*  stored total (there isn't one — level and balance are always derived     */
/*  from the ledgers, which keeps every change auditable).                    */
/* -------------------------------------------------------------------------- */

const adjustLevelSchema = z.object({
  characterId: z.coerce.number().int(),
  userId: z.coerce.number().int(),
  targetLevel: z.coerce.number().int().min(1, "Level must be at least 1").max(999, "Too high"),
});

export async function adminAdjustCharacterLevelAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = adjustLevelSchema.safeParse({
    characterId: formData.get("characterId"),
    userId: formData.get("userId"),
    targetLevel: formData.get("targetLevel"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { characterId, userId, targetLevel } = parsed.data;
  const currentXp = await getCharacterXp(characterId);
  const targetXp = cumulativeXpForLevel(targetLevel);
  const delta = targetXp - currentXp;

  if (delta !== 0) {
    await db.insert(xpLedger).values({
      characterId,
      amount: delta,
      reason: "admin_adjustment",
      note: `Admin set level to ${targetLevel}`,
    });
  }

  revalidatePath(`/admin/users/${userId}`);
  return { success: `Level set to ${targetLevel}` };
}

const adjustBalanceSchema = z.object({
  characterId: z.coerce.number().int(),
  userId: z.coerce.number().int(),
  targetBalance: z.coerce.number().int().min(0, "Balance can't be negative").max(1000000, "Too high"),
});

export async function adminAdjustCharacterBalanceAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = adjustBalanceSchema.safeParse({
    characterId: formData.get("characterId"),
    userId: formData.get("userId"),
    targetBalance: formData.get("targetBalance"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { characterId, userId, targetBalance } = parsed.data;
  const currentBalance = await getCharacterBalance(characterId);
  const delta = targetBalance - currentBalance;

  if (delta !== 0) {
    await db.insert(currencyLedger).values({
      characterId,
      amount: delta,
      reason: "admin_adjustment",
      note: `Admin set balance to ${targetBalance}`,
    });
  }

  revalidatePath(`/admin/users/${userId}`);
  return { success: `Balance set to ${targetBalance}` };
}

/* -------------------------------------------------------------------------- */
/*  Changing a character's profile URL (slug)                                 */
/* -------------------------------------------------------------------------- */

const updateSlugSchema = z.object({
  characterId: z.coerce.number().int(),
  userId: z.coerce.number().int(),
  slug: z
    .string()
    .min(2, "Too short")
    .max(140)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
});

export async function adminUpdateCharacterSlugAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = updateSlugSchema.safeParse({
    characterId: formData.get("characterId"),
    userId: formData.get("userId"),
    slug: formData.get("slug"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { characterId, userId, slug } = parsed.data;

  const [existing] = await db.select({ id: characters.id }).from(characters).where(eq(characters.slug, slug));
  if (existing && existing.id !== characterId) {
    return { error: "That URL is already taken by another character" };
  }

  await db.update(characters).set({ slug }).where(eq(characters.id, characterId));

  revalidatePath(`/admin/users/${userId}`);
  return { success: "Profile URL updated" };
}

/* -------------------------------------------------------------------------- */
/*  Gender and social status — locked from the owner's side, admin can fix    */
/* -------------------------------------------------------------------------- */

const updateGenderSchema = z.object({
  characterId: z.coerce.number().int(),
  userId: z.coerce.number().int(),
  gender: z.enum(GENDER_OPTIONS),
});

export async function adminUpdateCharacterGenderAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = updateGenderSchema.safeParse({
    characterId: formData.get("characterId"),
    userId: formData.get("userId"),
    gender: formData.get("gender"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { characterId, userId, gender } = parsed.data;
  await db.update(characters).set({ gender }).where(eq(characters.id, characterId));

  revalidatePath(`/admin/users/${userId}`);
  return { success: "Gender updated" };
}

const updateSocialStatusSchema = z.object({
  characterId: z.coerce.number().int(),
  userId: z.coerce.number().int(),
  socialStatus: z.enum(SOCIAL_STATUS_OPTIONS),
});

export async function adminUpdateCharacterSocialStatusAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = updateSocialStatusSchema.safeParse({
    characterId: formData.get("characterId"),
    userId: formData.get("userId"),
    socialStatus: formData.get("socialStatus"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { characterId, userId, socialStatus } = parsed.data;
  await db.update(characters).set({ socialStatus }).where(eq(characters.id, characterId));

  revalidatePath(`/admin/users/${userId}`);
  return { success: "Social status updated" };
}

/* -------------------------------------------------------------------------- */
/*  Character statuses — custom admin-assigned titles, shown on profile/hover */
/* -------------------------------------------------------------------------- */

const addStatusSchema = z.object({
  characterId: z.coerce.number().int(),
  userId: z.coerce.number().int(),
  label: z.string().min(1, "Enter a status").max(100),
});

export async function adminAddCharacterStatusAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = addStatusSchema.safeParse({
    characterId: formData.get("characterId"),
    userId: formData.get("userId"),
    label: formData.get("label"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db.insert(characterStatuses).values({
    characterId: parsed.data.characterId,
    label: parsed.data.label,
  });

  revalidatePath(`/admin/users/${parsed.data.userId}`);
  return { success: "Status added" };
}

export async function adminRemoveCharacterStatusAction(formData: FormData) {
  await requireAdmin();
  const statusId = Number(formData.get("statusId"));
  const userId = Number(formData.get("userId"));
  if (!statusId) return;

  await db.delete(characterStatuses).where(eq(characterStatuses.id, statusId));
  revalidatePath(`/admin/users/${userId}`);
}

/* -------------------------------------------------------------------------- */
/*  Home board: announcement, weather (read-only), news (read-only), spotlight */
/* -------------------------------------------------------------------------- */

export async function getHomeAnnouncement() {
  const [row] = await db.select().from(homeAnnouncement).where(eq(homeAnnouncement.id, 1));
  return row ?? null;
}

const updateAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  content: z.string().max(8000).optional().or(z.literal("")),
});

export async function adminUpdateAnnouncementAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = updateAnnouncementSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db
    .insert(homeAnnouncement)
    .values({ id: 1, title: parsed.data.title, content: parsed.data.content || "" })
    .onConflictDoUpdate({
      target: homeAnnouncement.id,
      set: { title: parsed.data.title, content: parsed.data.content || "", updatedAt: new Date() },
    });

  revalidatePath("/");
  revalidatePath("/admin/home-board");
  return { success: "Announcement updated" };
}

export async function getSpotlightEntries() {
  const rows = await db
    .select({
      id: spotlightEntries.id,
      blurb: spotlightEntries.blurb,
      position: spotlightEntries.position,
      characterId: characters.id,
      characterName: characters.name,
      characterSlug: characters.slug,
      characterFirstName: characters.firstName,
      characterLastName: characters.lastName,
      characterAvatarUrl: characters.avatarUrl,
      characterMajor: characters.major,
    })
    .from(spotlightEntries)
    .innerJoin(characters, eq(spotlightEntries.characterId, characters.id))
    .orderBy(spotlightEntries.position);

  const jobsByCharacter = await getPrimaryJobsForCharacters(rows.map((r) => r.characterId));
  return rows.map((r) => ({ ...r, characterJob: jobsByCharacter.get(r.characterId) ?? "none" }));
}

const addSpotlightSchema = z.object({
  firstName: z.string().min(1, "Enter their first name"),
  lastName: z.string().min(1, "Enter their last name"),
  blurb: z.string().min(1, "Enter a blurb").max(500),
});

export async function adminAddSpotlightAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = addSpotlightSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    blurb: formData.get("blurb"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await db.select({ id: spotlightEntries.id }).from(spotlightEntries);
  if (existing.length >= 2) {
    return { error: "Only two spotlight entries at a time — remove one first" };
  }

  const character = await findCharacterByLegalName(parsed.data.firstName, parsed.data.lastName);
  if (!character) {
    return {
      error: `No character found named "${parsed.data.firstName} ${parsed.data.lastName}"`,
    };
  }

  await db.insert(spotlightEntries).values({
    characterId: character.id,
    blurb: parsed.data.blurb,
    position: existing.length,
  });

  revalidatePath("/");
  revalidatePath("/admin/home-board");
  return { success: `${character.firstName} ${character.lastName} added to the spotlight` };
}

export async function adminRemoveSpotlightAction(formData: FormData) {
  await requireAdmin();
  const entryId = Number(formData.get("entryId"));
  if (!entryId) return;

  await db.delete(spotlightEntries).where(eq(spotlightEntries.id, entryId));
  revalidatePath("/");
  revalidatePath("/admin/home-board");
}

/* -------------------------------------------------------------------------- */
/*  Hall sorting quiz — up to 12 questions, each with hall-mapped answers     */
/* -------------------------------------------------------------------------- */

const MAX_SORTING_QUESTIONS = 12;

export async function getSortingQuestionsWithAnswers() {
  const questions = await db.select().from(sortingQuestions).orderBy(sortingQuestions.position);
  const answers = await db.select().from(sortingAnswers).orderBy(sortingAnswers.position);
  return questions.map((q) => ({
    ...q,
    answers: answers.filter((a) => a.questionId === q.id),
  }));
}

const addQuestionSchema = z.object({
  questionText: z.string().min(1, "Enter a question").max(300),
});

export async function adminAddSortingQuestionAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = addQuestionSchema.safeParse({ questionText: formData.get("questionText") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await db.select({ id: sortingQuestions.id }).from(sortingQuestions);
  if (existing.length >= MAX_SORTING_QUESTIONS) {
    return { error: `Only ${MAX_SORTING_QUESTIONS} questions at a time — remove one first` };
  }

  await db.insert(sortingQuestions).values({
    questionText: parsed.data.questionText,
    position: existing.length,
  });

  revalidatePath("/admin/sorting-quiz");
  revalidatePath("/characters/new");
  return { success: "Question added" };
}

export async function adminRemoveSortingQuestionAction(formData: FormData) {
  await requireAdmin();
  const questionId = Number(formData.get("questionId"));
  if (!questionId) return;

  await db.delete(sortingQuestions).where(eq(sortingQuestions.id, questionId));
  revalidatePath("/admin/sorting-quiz");
  revalidatePath("/characters/new");
}

const addAnswerSchema = z.object({
  questionId: z.coerce.number().int(),
  answerText: z.string().min(1, "Enter an answer").max(200),
  hall: z.enum(HALL_VALUES as [string, ...string[]]),
});

export async function adminAddSortingAnswerAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = addAnswerSchema.safeParse({
    questionId: formData.get("questionId"),
    answerText: formData.get("answerText"),
    hall: formData.get("hall"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await db
    .select({ id: sortingAnswers.id })
    .from(sortingAnswers)
    .where(eq(sortingAnswers.questionId, parsed.data.questionId));

  await db.insert(sortingAnswers).values({
    questionId: parsed.data.questionId,
    answerText: parsed.data.answerText,
    hall: parsed.data.hall as (typeof HALL_VALUES)[number],
    position: existing.length,
  });

  revalidatePath("/admin/sorting-quiz");
  revalidatePath("/characters/new");
  return { success: "Answer added" };
}

export async function adminRemoveSortingAnswerAction(formData: FormData) {
  await requireAdmin();
  const answerId = Number(formData.get("answerId"));
  if (!answerId) return;

  await db.delete(sortingAnswers).where(eq(sortingAnswers.id, answerId));
  revalidatePath("/admin/sorting-quiz");
  revalidatePath("/characters/new");
}

/* -------------------------------------------------------------------------- */
/*  Hall — admin can change a character's hall anytime                        */
/* -------------------------------------------------------------------------- */

const updateHallSchema = z.object({
  characterId: z.coerce.number().int(),
  userId: z.coerce.number().int(),
  hall: z.enum(HALL_VALUES as [string, ...string[]]),
});

export async function adminUpdateCharacterHallAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = updateHallSchema.safeParse({
    characterId: formData.get("characterId"),
    userId: formData.get("userId"),
    hall: formData.get("hall"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { characterId, userId, hall } = parsed.data;
  await db
    .update(characters)
    .set({ hall: hall as (typeof HALL_VALUES)[number] })
    .where(eq(characters.id, characterId));

  revalidatePath(`/admin/users/${userId}`);
  return { success: "Hall updated" };
}

/* -------------------------------------------------------------------------- */
/*  Admin: override a submission's grade after the fact                       */
/* -------------------------------------------------------------------------- */

export async function getRecentGradedSubmissions(limit = 50) {
  await requireAdmin();
  const rows = await db
    .select({
      id: submissions.id,
      finalTier: submissions.finalTier,
      grade: submissions.grade,
      payout: submissions.payout,
      gradedAt: submissions.gradedAt,
      characterId: characters.id,
      characterSlug: characters.slug,
      characterName: characters.name,
      characterFirstName: characters.firstName,
      characterLastName: characters.lastName,
      lessonId: lessons.id,
      lessonTitle: lessons.title,
      lessonReward: lessons.reward,
      boardName: boards.name,
    })
    .from(submissions)
    .innerJoin(characters, eq(submissions.characterId, characters.id))
    .innerJoin(lessons, eq(submissions.lessonId, lessons.id))
    .innerJoin(boards, eq(lessons.boardId, boards.id))
    .where(eq(submissions.status, "graded"))
    .orderBy(desc(submissions.gradedAt))
    .limit(limit);
  return rows;
}

const updateGradeSchema = z.object({
  submissionId: z.coerce.number().int(),
  tier: z.enum(GRADE_TIER_VALUES),
});

export async function adminUpdateSubmissionGradeAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = updateGradeSchema.safeParse({
    submissionId: formData.get("submissionId"),
    tier: formData.get("tier"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { submissionId, tier } = parsed.data;

  const [submission] = await db.select().from(submissions).where(eq(submissions.id, submissionId));
  if (!submission) return { error: "That submission no longer exists" };

  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, submission.lessonId));
  if (!lesson) return { error: "That lesson no longer exists" };

  const newNumeric = GRADE_TIER_META[tier].numeric;
  const newPayout = computePayout(lesson.reward, tier);
  const oldPayout = submission.payout ?? 0;
  const delta = newPayout - oldPayout;

  await db
    .update(submissions)
    .set({ finalTier: tier, grade: newNumeric, payout: newPayout })
    .where(eq(submissions.id, submissionId));

  if (delta !== 0) {
    await db.insert(currencyLedger).values({
      characterId: submission.characterId,
      amount: delta,
      reason: "admin_adjustment",
      relatedSubmissionId: submissionId,
      note: `Admin changed grade on "${lesson.title}" to ${tier}`,
    });
  }

  revalidatePath("/admin/grading");
  revalidatePath("/grading");
  return { success: "Grade updated" };
}

/* -------------------------------------------------------------------------- */
/*  Hall welcome messages — from that hall's own RA, admin can edit any       */
/* -------------------------------------------------------------------------- */

export async function getHallWelcomeMessage(hall: string) {
  const [row] = await db
    .select()
    .from(hallWelcomeMessages)
    .where(eq(hallWelcomeMessages.hall, hall as (typeof HALL_VALUES)[number]));
  return row ?? null;
}

export async function canEditHallWelcome(characterId: number, hall: string): Promise<boolean> {
  const [hallBoard] = await db
    .select({ id: boards.id })
    .from(boards)
    .where(eq(boards.slug, `${hall}-hall`));
  if (!hallBoard) return false;
  return isScopedToBoard(characterId, ["field_agent"], hallBoard.id);
}

const updateHallWelcomeSchema = z.object({
  hall: z.enum(HALL_VALUES as [string, ...string[]]),
  title: z.string().min(1, "Title is required").max(120),
  content: z.string().max(20000).optional().or(z.literal("")),
});

const updateHallBlurbSchema = z.object({
  hall: z.enum(HALL_VALUES as [string, ...string[]]),
  blurb: z.string().max(4000).optional().or(z.literal("")),
});

/** Admin-only — the hall's own lore/info, separate from the RA's welcome message. */
export async function updateHallBlurbAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = updateHallBlurbSchema.safeParse({
    hall: formData.get("hall"),
    blurb: formData.get("blurb") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db
    .insert(hallWelcomeMessages)
    .values({ hall: parsed.data.hall as (typeof HALL_VALUES)[number], blurb: parsed.data.blurb ?? "" })
    .onConflictDoUpdate({
      target: hallWelcomeMessages.hall,
      set: { blurb: parsed.data.blurb ?? "", updatedAt: new Date() },
    });

  revalidatePath("/admin/hall-welcome");
  revalidatePath("/", "layout");
  return { success: "Blurb updated" };
}

export async function updateHallWelcomeAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };

  const parsed = updateHallWelcomeSchema.safeParse({
    hall: formData.get("hall"),
    title: formData.get("title"),
    content: formData.get("content") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { hall, title, content } = parsed.data;

  if (!session.isAdmin) {
    const characterId = formData.get("characterId");
    const allowed =
      typeof characterId === "string" && (await canEditHallWelcome(Number(characterId), hall));
    if (!allowed) {
      return { error: "Only that hall's Resident Advisor or admin can edit this" };
    }
  }

  await db
    .insert(hallWelcomeMessages)
    .values({ hall: hall as (typeof HALL_VALUES)[number], title, content })
    .onConflictDoUpdate({
      target: hallWelcomeMessages.hall,
      set: { title, content, updatedAt: new Date() },
    });

  revalidatePath(`/hall/${hall}/welcome`);
  return { success: "Welcome message updated" };
}

/* -------------------------------------------------------------------------- */
/*  Site links — external link buttons on the home board                      */
/* -------------------------------------------------------------------------- */

export async function getSiteLinks() {
  return db.select().from(siteLinks).orderBy(siteLinks.position);
}

const addSiteLinkSchema = z.object({
  label: z.string().min(1, "Enter a label").max(60),
  url: z.string().url("Enter a valid URL"),
});

export async function adminAddSiteLinkAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = addSiteLinkSchema.safeParse({
    label: formData.get("label"),
    url: formData.get("url"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await db.select({ id: siteLinks.id }).from(siteLinks);
  await db.insert(siteLinks).values({
    label: parsed.data.label,
    url: parsed.data.url,
    position: existing.length,
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/home-board");
  return { success: "Link added" };
}

export async function adminRemoveSiteLinkAction(formData: FormData) {
  await requireAdmin();
  const linkId = Number(formData.get("linkId"));
  if (!linkId) return;

  await db.delete(siteLinks).where(eq(siteLinks.id, linkId));
  revalidatePath("/", "layout");
  revalidatePath("/admin/home-board");
}

/** Flat list of every non-category board — used to populate the role-scope picker. */
export async function getAllBoardsFlat() {
  await requireAdmin();
  return db
    .select({ id: boards.id, name: boards.name, kind: boards.kind, restrictedToHall: boards.restrictedToHall })
    .from(boards)
    .where(ne(boards.kind, "category"))
    .orderBy(boards.name);
}

/* -------------------------------------------------------------------------- */
/*  Board access grants — per character (replaces the old /admin/article-boards page) */
/* -------------------------------------------------------------------------- */

export async function getBoardGrantsForCharacter(characterId: number) {
  await requireAdmin();
  return db
    .select({ id: boardPostPermissions.id, boardId: boardPostPermissions.boardId, boardName: boards.name })
    .from(boardPostPermissions)
    .innerJoin(boards, eq(boardPostPermissions.boardId, boards.id))
    .where(eq(boardPostPermissions.characterId, characterId));
}

export async function adminGrantBoardAccessAction(formData: FormData) {
  await requireAdmin();
  const characterId = Number(formData.get("characterId"));
  const boardId = Number(formData.get("boardId"));
  const userId = Number(formData.get("userId"));
  if (!characterId || !boardId) return;

  await db.insert(boardPostPermissions).values({ characterId, boardId }).onConflictDoNothing();
  revalidatePath(`/admin/users/${userId}`);
}

export async function adminRevokeBoardAccessAction(formData: FormData) {
  await requireAdmin();
  const grantId = Number(formData.get("grantId"));
  const userId = Number(formData.get("userId"));
  if (!grantId) return;

  await db.delete(boardPostPermissions).where(eq(boardPostPermissions.id, grantId));
  revalidatePath(`/admin/users/${userId}`);
}

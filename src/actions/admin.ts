"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, or, ilike, count } from "drizzle-orm";
import { db } from "@/db";
import { users, characters } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { isAdmin, type UserRole } from "@/lib/roles";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) {
    throw new Error("Not authorized");
  }
  return session;
}

export async function searchUsers(query: string) {
  await requireAdmin();

  const trimmed = query.trim();
  const rows = trimmed
    ? await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(or(ilike(users.username, `%${trimmed}%`), ilike(users.email, `%${trimmed}%`)))
        .limit(50)
    : await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .limit(50);

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
    })
    .from(characters)
    .where(eq(characters.userId, userId));

  return { user, characters: userCharacters };
}

const ROLE_VALUES: [UserRole, ...UserRole[]] = ["member", "instructor", "staff", "admin"];

const updateUserSchema = z.object({
  userId: z.coerce.number().int(),
  username: z.string().min(3).max(32),
  email: z.string().email(),
  role: z.enum(ROLE_VALUES),
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
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { userId, username, email, role } = parsed.data;

  // A safety net: don't let the last admin accidentally demote themselves out
  // of admin with no other admin to fix it.
  if (userId === admin.userId && role !== "admin") {
    const [{ total }] = await db
      .select({ total: count() })
      .from(users)
      .where(eq(users.role, "admin"));

    if (total <= 1) {
      return { error: "You're the only admin — promote someone else before removing yourself" };
    }
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.username, username), eq(users.email, email)));
  if (existing && existing.id !== userId) {
    return { error: "That username or email is already in use by another account" };
  }

  await db.update(users).set({ username, email, role }).where(eq(users.id, userId));

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
  return { success: "Saved" };
}

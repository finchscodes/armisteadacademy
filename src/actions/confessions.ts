"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { confessions } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { getSession } from "@/lib/auth";
import { characterHasAnyJob } from "@/lib/character-jobs";
import { MANAGEMENT_JOBS } from "@/lib/roles";
import { sanitizePlainText } from "@/lib/sanitize";

async function requireAdminOrManagement() {
  const session = await getSession();
  if (!session) throw new Error("Not authorized");
  if (session.isAdmin) return session;

  const { characterId } = await requireSessionAndCharacter();
  if (await characterHasAnyJob(characterId, MANAGEMENT_JOBS)) return session;
  throw new Error("Not authorized");
}

export type ConfessionActionState = { error?: string; success?: string } | undefined;

const submitConfessionSchema = z.object({
  content: z.string().trim().min(1, "Write something first").max(1000, "Keep it under 1000 characters"),
});

/** Anyone with an active character can submit — held for admin review before it's ever shown. */
export async function submitConfessionAction(
  _prevState: ConfessionActionState,
  formData: FormData
): Promise<ConfessionActionState> {
  const { characterId } = await requireSessionAndCharacter();

  const parsed = submitConfessionSchema.safeParse({ content: formData.get("content") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db.insert(confessions).values({
    characterId,
    content: sanitizePlainText(parsed.data.content),
  });

  revalidatePath("/admin/confessions");
  return { success: "Submitted — it'll show up once approved" };
}

/** Admin/management-only — approves a pending confession, starting its 2-week visible window. */
export async function adminApproveConfessionAction(formData: FormData) {
  await requireAdminOrManagement();

  const confessionId = Number(formData.get("confessionId"));
  if (!confessionId) return;

  await db
    .update(confessions)
    .set({ status: "approved", approvedAt: new Date() })
    .where(eq(confessions.id, confessionId));

  revalidatePath("/admin/confessions");
  revalidatePath("/");
}

/** Admin/management-only — rejects a pending confession, deleting it outright (nothing kept around). */
export async function adminRejectConfessionAction(formData: FormData) {
  await requireAdminOrManagement();

  const confessionId = Number(formData.get("confessionId"));
  if (!confessionId) return;

  await db.delete(confessions).where(eq(confessions.id, confessionId));

  revalidatePath("/admin/confessions");
}

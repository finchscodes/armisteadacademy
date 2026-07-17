"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { guideSections } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { slugifyUnique } from "@/lib/slug";
import { sanitizeRichText, richTextLength } from "@/lib/sanitize";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !session.isAdmin) {
    throw new Error("Not authorized");
  }
  return session;
}

export type GuideActionState = { error?: string; success?: string } | undefined;

export async function getGuideSections() {
  return db.select().from(guideSections).orderBy(asc(guideSections.position));
}

const sectionSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  content: z
    .string()
    .max(60000, "That's too long")
    .refine((v) => richTextLength(v) > 0, "Content can't be empty"),
  parentId: z.coerce.number().int().optional(),
});

export async function createGuideSectionAction(
  _prevState: GuideActionState,
  formData: FormData
): Promise<GuideActionState> {
  await requireAdmin();

  const parsed = sectionSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    parentId: formData.get("parentId") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { title, parentId } = parsed.data;
  const content = sanitizeRichText(parsed.data.content);
  const slug = slugifyUnique(title);

  const existing = await db.select({ id: guideSections.id }).from(guideSections);

  await db.insert(guideSections).values({ title, slug, content, position: existing.length, parentId: parentId ?? null });

  revalidatePath("/guide");
  revalidatePath("/admin/guide");
  return { success: "Section added" };
}

const updateSectionSchema = z.object({
  sectionId: z.coerce.number().int(),
  title: z.string().min(1, "Title is required").max(120),
  content: z
    .string()
    .max(60000, "That's too long")
    .refine((v) => richTextLength(v) > 0, "Content can't be empty"),
  parentId: z.coerce.number().int().optional(),
});

export async function updateGuideSectionAction(
  _prevState: GuideActionState,
  formData: FormData
): Promise<GuideActionState> {
  await requireAdmin();

  const parsed = updateSectionSchema.safeParse({
    sectionId: formData.get("sectionId"),
    title: formData.get("title"),
    content: formData.get("content"),
    parentId: formData.get("parentId") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { sectionId, title, parentId } = parsed.data;
  const content = sanitizeRichText(parsed.data.content);

  // A section can't be its own parent, and can't be nested under one of
  // its own children (only one level of nesting is supported at all, so
  // in practice this just guards against self-parenting).
  const safeParentId = parentId === sectionId ? null : parentId ?? null;

  await db
    .update(guideSections)
    .set({ title, content, parentId: safeParentId })
    .where(eq(guideSections.id, sectionId));

  revalidatePath("/guide");
  revalidatePath("/admin/guide");
  return { success: "Section saved" };
}

export async function deleteGuideSectionAction(formData: FormData) {
  await requireAdmin();
  const sectionId = Number(formData.get("sectionId"));
  if (!sectionId) return;

  await db.delete(guideSections).where(eq(guideSections.id, sectionId));

  revalidatePath("/guide");
  revalidatePath("/admin/guide");
}

/** Set the full section order at once — used by drag-and-drop in the admin panel. */
export async function reorderGuideSectionsAction(formData: FormData) {
  await requireAdmin();
  const orderedIdsRaw = formData.get("orderedIds");
  if (typeof orderedIdsRaw !== "string") return;

  const orderedIds = orderedIdsRaw
    .split(",")
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n));

  let position = 0;
  for (const id of orderedIds) {
    await db.update(guideSections).set({ position }).where(eq(guideSections.id, id));
    position++;
  }

  revalidatePath("/guide");
  revalidatePath("/admin/guide");
}

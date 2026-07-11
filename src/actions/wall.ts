"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { wallPosts, characters } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { sanitizeRichText, richTextLength } from "@/lib/sanitize";
import { characterHasAnyJob } from "@/lib/character-jobs";
import { MANAGEMENT_JOBS } from "@/lib/roles";
import type { ActionState } from "./auth";

const createPostSchema = z.object({
  wallCharacterId: z.coerce.number().int(),
  content: z
    .string()
    .min(1, "Say something first")
    .max(20000)
    .refine((v) => richTextLength(v) > 0, "Say something first"),
});

export async function createWallPostAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { characterId } = await requireSessionAndCharacter();

  const parsed = createPostSchema.safeParse({
    wallCharacterId: formData.get("wallCharacterId"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const [wallOwner] = await db
    .select({ id: characters.id, slug: characters.slug })
    .from(characters)
    .where(eq(characters.id, parsed.data.wallCharacterId));
  if (!wallOwner) return { error: "That character no longer exists" };

  const content = sanitizeRichText(parsed.data.content);
  await db.insert(wallPosts).values({
    wallCharacterId: parsed.data.wallCharacterId,
    posterCharacterId: characterId,
    content,
  });

  revalidatePath(`/c/${wallOwner.slug}`);
  revalidatePath("/");
  return undefined;
}

export async function deleteWallPostAction(formData: FormData) {
  const { characterId, session } = await requireSessionAndCharacter();
  const postId = Number(formData.get("postId"));
  if (!postId) return;

  const [post] = await db.select().from(wallPosts).where(eq(wallPosts.id, postId));
  if (!post) return;

  const [wallOwner] = await db
    .select({ slug: characters.slug })
    .from(characters)
    .where(eq(characters.id, post.wallCharacterId));

  const isWallOwner = post.wallCharacterId === characterId;
  const isManagement = session.isAdmin || (await characterHasAnyJob(characterId, MANAGEMENT_JOBS));
  if (!isWallOwner && !isManagement) return;

  await db.delete(wallPosts).where(eq(wallPosts.id, postId));
  if (wallOwner) revalidatePath(`/c/${wallOwner.slug}`);
  revalidatePath("/");
}

export async function pinWallPostAction(formData: FormData) {
  const { characterId } = await requireSessionAndCharacter();
  const postId = Number(formData.get("postId"));
  if (!postId) return;

  const [post] = await db.select().from(wallPosts).where(eq(wallPosts.id, postId));
  if (!post || post.wallCharacterId !== characterId) return;

  const [wallOwner] = await db
    .select({ slug: characters.slug })
    .from(characters)
    .where(eq(characters.id, post.wallCharacterId));

  const alreadyPinned = post.isPinned;
  // Only one pinned post at a time — clear any other, then toggle this one.
  await db
    .update(wallPosts)
    .set({ isPinned: false })
    .where(and(eq(wallPosts.wallCharacterId, characterId), eq(wallPosts.isPinned, true)));
  if (!alreadyPinned) {
    await db.update(wallPosts).set({ isPinned: true }).where(eq(wallPosts.id, postId));
  }

  if (wallOwner) revalidatePath(`/c/${wallOwner.slug}`);
}

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { wallPosts, wallPostLikes, wallPostComments, characters } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { sanitizeRichText, richTextLength } from "@/lib/sanitize";
import { characterHasAnyJob } from "@/lib/character-jobs";
import { MANAGEMENT_JOBS } from "@/lib/roles";
import { createNotification } from "@/lib/notifications";
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

  if (wallOwner.id !== characterId) {
    const [poster] = await db
      .select({ firstName: characters.firstName, lastName: characters.lastName })
      .from(characters)
      .where(eq(characters.id, characterId));
    if (poster) {
      await createNotification(
        wallOwner.id,
        "wall_post",
        `${poster.firstName} ${poster.lastName} posted on your wall`,
        `/c/${wallOwner.slug}`
      );
    }
  }

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

/** Toggle a like on/off for the active character. */
export async function toggleWallLikeAction(formData: FormData) {
  const { characterId } = await requireSessionAndCharacter();
  const wallPostId = Number(formData.get("wallPostId"));
  if (!wallPostId) return;

  const [post] = await db.select({ wallCharacterId: wallPosts.wallCharacterId }).from(wallPosts).where(eq(wallPosts.id, wallPostId));
  if (!post) return;

  const [existing] = await db
    .select({ id: wallPostLikes.id })
    .from(wallPostLikes)
    .where(and(eq(wallPostLikes.wallPostId, wallPostId), eq(wallPostLikes.characterId, characterId)));

  if (existing) {
    await db.delete(wallPostLikes).where(eq(wallPostLikes.id, existing.id));
  } else {
    await db.insert(wallPostLikes).values({ wallPostId, characterId });
  }

  const [wallOwner] = await db.select({ slug: characters.slug }).from(characters).where(eq(characters.id, post.wallCharacterId));
  if (wallOwner) revalidatePath(`/c/${wallOwner.slug}`);
  revalidatePath("/");
}

const wallCommentSchema = z.object({
  wallPostId: z.coerce.number().int(),
  content: z.string().min(1, "Comment can't be empty").max(1000),
});

export async function addWallCommentAction(formData: FormData) {
  const { session, characterId } = await requireSessionAndCharacter();

  const parsed = wallCommentSchema.safeParse({
    wallPostId: formData.get("wallPostId"),
    content: formData.get("content"),
  });
  if (!parsed.success) return;

  const [post] = await db.select({ wallCharacterId: wallPosts.wallCharacterId }).from(wallPosts).where(eq(wallPosts.id, parsed.data.wallPostId));
  if (!post) return;

  await db.insert(wallPostComments).values({
    wallPostId: parsed.data.wallPostId,
    characterId,
    userId: session.userId,
    content: parsed.data.content,
  });

  const [wallOwner] = await db.select({ slug: characters.slug }).from(characters).where(eq(characters.id, post.wallCharacterId));
  if (wallOwner) revalidatePath(`/c/${wallOwner.slug}`);
  revalidatePath("/");
}

export async function deleteWallCommentAction(formData: FormData) {
  const { characterId, session } = await requireSessionAndCharacter();
  const commentId = Number(formData.get("commentId"));
  if (!commentId) return;

  const [comment] = await db.select().from(wallPostComments).where(eq(wallPostComments.id, commentId));
  if (!comment) return;

  const [post] = await db.select({ wallCharacterId: wallPosts.wallCharacterId }).from(wallPosts).where(eq(wallPosts.id, comment.wallPostId));

  const isAuthor = comment.characterId === characterId;
  const isWallOwner = post?.wallCharacterId === characterId;
  const isManagement = session.isAdmin || (await characterHasAnyJob(characterId, MANAGEMENT_JOBS));
  if (!isAuthor && !isWallOwner && !isManagement) return;

  await db.delete(wallPostComments).where(eq(wallPostComments.id, commentId));

  if (post) {
    const [wallOwner] = await db.select({ slug: characters.slug }).from(characters).where(eq(characters.id, post.wallCharacterId));
    if (wallOwner) revalidatePath(`/c/${wallOwner.slug}`);
  }
  revalidatePath("/");
}

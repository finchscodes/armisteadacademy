"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { postReactions, postComments, posts, threads } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { getSession, getActiveCharacterId } from "@/lib/auth";
import { characterHasAnyJob } from "@/lib/character-jobs";
import { MANAGEMENT_JOBS } from "@/lib/roles";
import { ALLOWED_REACTION_EMOJI } from "@/lib/reactions";

async function revalidateThreadForPost(postId: number) {
  const [post] = await db.select({ threadId: posts.threadId }).from(posts).where(eq(posts.id, postId));
  if (!post) return;
  const [thread] = await db.select({ slug: threads.slug }).from(threads).where(eq(threads.id, post.threadId));
  if (thread) revalidatePath(`/t/${thread.slug}`);
}

/** Toggle a reaction on/off for the active character. */
export async function toggleReactionAction(formData: FormData) {
  const { characterId } = await requireSessionAndCharacter();

  const postId = Number(formData.get("postId"));
  const emoji = String(formData.get("emoji") || "");
  if (!postId || !ALLOWED_REACTION_EMOJI.includes(emoji)) return;

  const [existing] = await db
    .select({ id: postReactions.id })
    .from(postReactions)
    .where(
      and(
        eq(postReactions.postId, postId),
        eq(postReactions.characterId, characterId),
        eq(postReactions.emoji, emoji)
      )
    );

  if (existing) {
    await db.delete(postReactions).where(eq(postReactions.id, existing.id));
  } else {
    await db.insert(postReactions).values({ postId, characterId, emoji });
  }

  await revalidateThreadForPost(postId);
}

const commentSchema = z.object({
  postId: z.coerce.number().int(),
  content: z.string().min(1, "Comment can't be empty").max(1000),
});

export async function addCommentAction(formData: FormData) {
  const { session, characterId } = await requireSessionAndCharacter();

  const parsed = commentSchema.safeParse({
    postId: formData.get("postId"),
    content: formData.get("content"),
  });
  if (!parsed.success) return;

  await db.insert(postComments).values({
    postId: parsed.data.postId,
    characterId,
    userId: session.userId,
    content: parsed.data.content,
  });

  await revalidateThreadForPost(parsed.data.postId);
}

/** Article comments only — management/admin and Chief Editors can remove one. */
export async function deleteCommentAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const commentId = Number(formData.get("commentId"));
  if (!commentId) return;

  if (!session.isAdmin) {
    const activeCharacterId = await getActiveCharacterId();
    const allowed =
      activeCharacterId && (await characterHasAnyJob(activeCharacterId, [...MANAGEMENT_JOBS, "chief_editor"]));
    if (!allowed) return;
  }

  const [comment] = await db.select({ postId: postComments.postId }).from(postComments).where(eq(postComments.id, commentId));
  if (!comment) return;

  await db.delete(postComments).where(eq(postComments.id, commentId));
  await revalidateThreadForPost(comment.postId);
}

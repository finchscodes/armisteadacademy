"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { boards, threads, posts, xpLedger } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { getSession } from "@/lib/auth";
import { slugifyUnique } from "@/lib/slug";
import { XP_AWARDS } from "@/lib/xp";
import type { ActionState } from "./auth";

const newThreadSchema = z.object({
  boardSlug: z.string().min(1),
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  content: z.string().min(1, "Post can't be empty").max(20000),
});

export async function createThreadAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { session, characterId } = await requireSessionAndCharacter();

  const parsed = newThreadSchema.safeParse({
    boardSlug: formData.get("boardSlug"),
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { boardSlug, title, content } = parsed.data;

  const [board] = await db.select().from(boards).where(eq(boards.slug, boardSlug));
  if (!board) {
    return { error: "That board no longer exists" };
  }

  const threadSlug = slugifyUnique(title);
  const now = new Date();

  const [thread] = await db
    .insert(threads)
    .values({
      boardId: board.id,
      characterId,
      userId: session.userId,
      title,
      slug: threadSlug,
      lastPostAt: now,
    })
    .returning({ id: threads.id, slug: threads.slug });

  const [openingPost] = await db
    .insert(posts)
    .values({
      threadId: thread.id,
      characterId,
      userId: session.userId,
      content,
    })
    .returning({ id: posts.id });

  await db.insert(xpLedger).values({
    characterId,
    amount: XP_AWARDS.chat_post,
    reason: "chat_post",
    relatedPostId: openingPost.id,
  });

  revalidatePath(`/b/${boardSlug}`);
  redirect(`/t/${thread.slug}`);
}

const newPostSchema = z.object({
  threadSlug: z.string().min(1),
  content: z.string().min(1, "Reply can't be empty").max(20000),
});

export async function createPostAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { session, characterId } = await requireSessionAndCharacter();

  const parsed = newPostSchema.safeParse({
    threadSlug: formData.get("threadSlug"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { threadSlug, content } = parsed.data;

  const [thread] = await db.select().from(threads).where(eq(threads.slug, threadSlug));
  if (!thread) {
    return { error: "That thread no longer exists" };
  }
  if (thread.isLocked) {
    return { error: "This thread is locked" };
  }

  const [newPost] = await db
    .insert(posts)
    .values({
      threadId: thread.id,
      characterId,
      userId: session.userId,
      content,
    })
    .returning({ id: posts.id });

  await db.insert(xpLedger).values({
    characterId,
    amount: XP_AWARDS.chat_post,
    reason: "chat_post",
    relatedPostId: newPost.id,
  });

  await db.update(threads).set({ lastPostAt: new Date() }).where(eq(threads.id, thread.id));

  revalidatePath(`/t/${threadSlug}`);
  redirect(`/t/${threadSlug}`);
}

/* -------------------------------------------------------------------------- */
/*  Deleting threads and posts                                                */
/* -------------------------------------------------------------------------- */

/**
 * You can delete a post if you authored it (any character on your account) or
 * you're an admin. Deleting the first post of a thread deletes the whole thread.
 */
export async function deletePostAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const postId = Number(formData.get("postId"));
  if (!postId) return;

  const [post] = await db.select().from(posts).where(eq(posts.id, postId));
  if (!post) return;

  if (post.userId !== session.userId && !session.isAdmin) {
    return; // not your post and not an admin
  }

  const [thread] = await db.select().from(threads).where(eq(threads.id, post.threadId));
  if (!thread) return;

  // Is this the opening post? (the earliest post in the thread)
  const [firstPost] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.threadId, thread.id))
    .orderBy(posts.createdAt)
    .limit(1);

  const [board] = await db.select().from(boards).where(eq(boards.id, thread.boardId));

  if (firstPost && firstPost.id === postId) {
    // Deleting the opening post removes the entire thread (cascades to posts).
    await db.delete(threads).where(eq(threads.id, thread.id));
    revalidatePath(`/b/${board?.slug ?? ""}`);
    redirect(`/b/${board?.slug ?? ""}`);
  }

  await db.delete(posts).where(eq(posts.id, postId));
  revalidatePath(`/t/${thread.slug}`);
  redirect(`/t/${thread.slug}`);
}

/** Delete an entire thread. Author of the opening post, or admin. */
export async function deleteThreadAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const threadId = Number(formData.get("threadId"));
  if (!threadId) return;

  const [thread] = await db.select().from(threads).where(eq(threads.id, threadId));
  if (!thread) return;

  if (thread.userId !== session.userId && !session.isAdmin) {
    return;
  }

  const [board] = await db.select().from(boards).where(eq(boards.id, thread.boardId));
  await db.delete(threads).where(eq(threads.id, threadId));
  revalidatePath(`/b/${board?.slug ?? ""}`);
  redirect(`/b/${board?.slug ?? ""}`);
}

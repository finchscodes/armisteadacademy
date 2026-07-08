"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { boards, threads, posts, xpLedger } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
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

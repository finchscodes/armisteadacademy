"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { boards, threads, posts, xpLedger, characters } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { getSession } from "@/lib/auth";
import { slugifyUnique } from "@/lib/slug";
import { XP_AWARDS } from "@/lib/xp";
import { sanitizeRichText, richTextLength } from "@/lib/sanitize";
import { canPostArticle, canModeratePosts } from "@/lib/article-boards";
import { createNotifications } from "@/lib/notifications";
import { awardReputation, REPUTATION_AWARDS } from "@/lib/reputation";
import type { ActionState } from "./auth";

const newThreadSchema = z.object({
  boardSlug: z.string().min(1),
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  content: z
    .string()
    .min(1, "Post can't be empty")
    .max(60000, "That's too long")
    .refine((v) => richTextLength(v) > 0, "Post can't be empty"),
  location: z.string().max(200).optional().or(z.literal("")),
  timeSetting: z.string().max(100).optional().or(z.literal("")),
  surroundings: z.string().max(4000).optional().or(z.literal("")),
  ooc: z.string().max(4000).optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  scheduledFor: z.string().optional().or(z.literal("")),
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
    location: formData.get("location") || undefined,
    timeSetting: formData.get("timeSetting") || undefined,
    surroundings: formData.get("surroundings") || undefined,
    ooc: formData.get("ooc") || undefined,
    rating: formData.get("rating") || undefined,
    scheduledFor: formData.get("scheduledFor") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { boardSlug, title, location, timeSetting, surroundings, ooc, rating } = parsed.data;
  const content = sanitizeRichText(parsed.data.content);

  const [board] = await db.select().from(boards).where(eq(boards.slug, boardSlug));
  if (!board) {
    return { error: "That board no longer exists" };
  }
  if (board.kind === "class") {
    return { error: "This is a class board — it only takes lessons, not topics" };
  }
  if (board.kind === "article") {
    const allowed = session.isAdmin || (await canPostArticle(characterId, board.id));
    if (!allowed) {
      return { error: "Only Head Staff and up (or someone specifically granted access) can post here" };
    }
  }

  const isArticle = board.kind === "article";
  let scheduledFor: Date | null = null;
  if (isArticle && parsed.data.scheduledFor) {
    const parsedDate = new Date(parsed.data.scheduledFor);
    if (Number.isNaN(parsedDate.getTime())) {
      return { error: "That scheduled date isn't valid" };
    }
    if (parsedDate.getTime() > Date.now()) {
      scheduledFor = parsedDate;
    }
    // A date in the past just publishes immediately — no error needed.
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
      location: isArticle ? null : location || null,
      timeSetting: isArticle ? null : timeSetting || null,
      surroundings: isArticle ? null : surroundings || null,
      ooc: isArticle ? null : ooc || null,
      rating: isArticle ? null : rating ?? null,
      scheduledFor,
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

  if (!isArticle) {
    await awardReputation(
      characterId,
      REPUTATION_AWARDS.thread_created,
      "thread_created",
      `Started "${title}"`,
      undefined,
      openingPost.id
    );
  }

  revalidatePath(`/b/${boardSlug}`);
  redirect(`/t/${thread.slug}`);
}

const newPostSchema = z.object({
  threadSlug: z.string().min(1),
  content: z
    .string()
    .min(1, "Reply can't be empty")
    .max(60000, "That's too long")
    .refine((v) => richTextLength(v) > 0, "Reply can't be empty"),
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

  const { threadSlug } = parsed.data;
  const content = sanitizeRichText(parsed.data.content);

  const [thread] = await db.select().from(threads).where(eq(threads.slug, threadSlug));
  if (!thread) {
    return { error: "That thread no longer exists" };
  }
  if (thread.isLocked) {
    return { error: "This thread is locked" };
  }

  const [threadBoard] = await db.select({ kind: boards.kind }).from(boards).where(eq(boards.id, thread.boardId));
  if (threadBoard?.kind === "article") {
    return { error: "Use comments to respond to an article, not a reply post" };
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

  await awardReputation(
    characterId,
    REPUTATION_AWARDS.thread_reply,
    "thread_reply",
    `Replied to "${thread.title}"`,
    undefined,
    newPost.id
  );

  await db.update(threads).set({ lastPostAt: new Date() }).where(eq(threads.id, thread.id));

  // Notify everyone else who has posted in this thread — "someone responded
  // to a topic you're in." Excludes the replier themselves.
  const priorParticipants = await db
    .selectDistinct({ characterId: posts.characterId })
    .from(posts)
    .where(eq(posts.threadId, thread.id));
  const notifyIds = priorParticipants
    .map((p) => p.characterId)
    .filter((id) => id !== characterId);

  if (notifyIds.length > 0) {
    const [replier] = await db
      .select({ firstName: characters.firstName, lastName: characters.lastName })
      .from(characters)
      .where(eq(characters.id, characterId));
    if (replier) {
      await createNotifications(
        notifyIds,
        "thread_reply",
        `${replier.firstName} ${replier.lastName} replied to "${thread.title}"`,
        `/t/${threadSlug}`
      );
    }
  }

  revalidatePath(`/t/${threadSlug}`);
  redirect(`/t/${threadSlug}`);
}

/* -------------------------------------------------------------------------- */
/*  Editing a post                                                            */
/* -------------------------------------------------------------------------- */

const editPostSchema = z.object({
  postId: z.coerce.number().int(),
  content: z
    .string()
    .min(1, "Post can't be empty")
    .max(60000, "That's too long")
    .refine((v) => richTextLength(v) > 0, "Post can't be empty"),
});

export async function updatePostAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { session, characterId } = await requireSessionAndCharacter();

  const parsed = editPostSchema.safeParse({
    postId: formData.get("postId"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { postId, content: rawContent } = parsed.data;
  const content = sanitizeRichText(rawContent);

  const [post] = await db.select().from(posts).where(eq(posts.id, postId));
  if (!post) return { error: "That post no longer exists" };

  const isAuthor = post.userId === session.userId;
  const canModerate = session.isAdmin || (await canModeratePosts(characterId));
  if (!isAuthor && !canModerate) {
    return { error: "You don't have permission to edit this post" };
  }

  await db.update(posts).set({ content, editedAt: new Date() }).where(eq(posts.id, postId));

  const [thread] = await db.select({ slug: threads.slug }).from(threads).where(eq(threads.id, post.threadId));
  if (thread) revalidatePath(`/t/${thread.slug}`);
  return { error: undefined };
}

/* -------------------------------------------------------------------------- */
/*  Deleting threads and posts                                                */
/* -------------------------------------------------------------------------- */

/**
 * Regular users can delete their own individual posts (replies) — not the
 * thread's opening post, since that would take the whole thread down with it.
 * Deleting the opening post (or any post) is admin-only.
 */
export async function deletePostAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const postId = Number(formData.get("postId"));
  if (!postId) return;

  const [post] = await db.select().from(posts).where(eq(posts.id, postId));
  if (!post) return;

  const isOwnPost = post.userId === session.userId;
  if (!isOwnPost && !session.isAdmin) {
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

  const isOpeningPost = firstPost?.id === postId;

  // Regular (non-admin) users can't remove the opening post — that's
  // whole-thread deletion, which is reserved for admins.
  if (isOpeningPost && !session.isAdmin) {
    return;
  }

  const [board] = await db.select().from(boards).where(eq(boards.id, thread.boardId));

  if (isOpeningPost) {
    // Admin deleting the opening post removes the entire thread (cascades to posts).
    await db.delete(threads).where(eq(threads.id, thread.id));
    revalidatePath(`/b/${board?.slug ?? ""}`);
    redirect(`/b/${board?.slug ?? ""}`);
  }

  await db.delete(posts).where(eq(posts.id, postId));
  revalidatePath(`/t/${thread.slug}`);
  redirect(`/t/${thread.slug}`);
}

/** Delete an entire thread outright. Admin only. */
export async function deleteThreadAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.isAdmin) return;

  const threadId = Number(formData.get("threadId"));
  if (!threadId) return;

  const [thread] = await db.select().from(threads).where(eq(threads.id, threadId));
  if (!thread) return;

  const [board] = await db.select().from(boards).where(eq(boards.id, thread.boardId));
  await db.delete(threads).where(eq(threads.id, threadId));
  revalidatePath(`/b/${board?.slug ?? ""}`);
  redirect(`/b/${board?.slug ?? ""}`);
}

"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { boards, threads, posts, characters } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { getSession, getActiveCharacterId } from "@/lib/auth";
import { slugifyUnique } from "@/lib/slug";
import { XP_AWARDS, awardXp } from "@/lib/xp";
import { sanitizeRichText, sanitizePlainText, richTextLength } from "@/lib/sanitize";
import { canPostArticle, canModeratePosts } from "@/lib/article-boards";
import { createNotifications } from "@/lib/notifications";
import { getAllCharacterIds } from "@/lib/missions";
import { characterHasAnyJob } from "@/lib/character-jobs";
import { MANAGEMENT_JOBS } from "@/lib/roles";

/** Admin, or a character holding a topic-moderator job (management, Prefect) — same set as post moderation. */
async function canModerateTopics(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  if (session.isAdmin) return true;
  const activeCharacterId = await getActiveCharacterId();
  if (!activeCharacterId) return false;
  return canModeratePosts(activeCharacterId);
}
import { awardReputation, REPUTATION_AWARDS } from "@/lib/reputation";
import { isFainted } from "@/lib/needs";
import type { ActionState } from "./auth";

/** A single ten-sided die roll (1-10) — always generated server-side, never from client input, so it can't be gamed. */
function rollD10(): number {
  return 1 + Math.floor(Math.random() * 10);
}

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
  emailFormat: z.enum(["email", "letter"]).optional(),
  letterTo: z.string().max(200).optional().or(z.literal("")),
  letterFrom: z.string().max(200).optional().or(z.literal("")),
  rollModifier: z.coerce.number().int().min(-99).max(99).optional(),
  missionDeadline: z.string().optional().or(z.literal("")),
  missionMaxSpots: z.coerce.number().int().min(1).max(50).optional(),
});

export async function createThreadAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { session, characterId } = await requireSessionAndCharacter();

  if (await isFainted(characterId)) {
    return { error: "Too faint from hunger or thirst to do this right now — eat or drink something." };
  }

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
    emailFormat: formData.get("emailFormat") || undefined,
    letterTo: formData.get("letterTo") || undefined,
    letterFrom: formData.get("letterFrom") || undefined,
    rollModifier: formData.get("rollModifier") || undefined,
    missionDeadline: formData.get("missionDeadline") || undefined,
    missionMaxSpots: formData.get("missionMaxSpots") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const {
    boardSlug,
    title,
    location,
    timeSetting,
    surroundings,
    ooc,
    rating,
    emailFormat,
    letterTo,
    letterFrom,
    rollModifier,
    missionMaxSpots,
  } = parsed.data;

  const [board] = await db.select().from(boards).where(eq(boards.slug, boardSlug));
  if (!board) {
    return { error: "That board no longer exists" };
  }
  const isPhone = board.kind === "phone";
  const isEmail = board.kind === "email";
  const isBoard = board.kind === "board";
  const content = isPhone ? sanitizePlainText(parsed.data.content) : sanitizeRichText(parsed.data.content);
  if (board.kind === "class") {
    return { error: "This is a class board — it only takes lessons, not topics" };
  }
  if (board.kind === "shop" || board.kind === "bank") {
    return { error: "This board doesn't take topics" };
  }
  if (board.kind === "mission") {
    const allowed =
      session.isAdmin ||
      (await characterHasAnyJob(characterId, [...MANAGEMENT_JOBS, "handler"]));
    if (!allowed) {
      return { error: "Only Handlers and management can post a mission" };
    }
  }
  if (board.kind === "article") {
    const allowed = session.isAdmin || (await canPostArticle(characterId, board.id));
    if (!allowed) {
      return { error: "Only Head Staff and up (or someone specifically granted access) can post here" };
    }
  }

  const isArticle = board.kind === "article";
  const isSocial = board.kind === "social";
  const isMission = board.kind === "mission";
  if (isSocial && !title.startsWith("@")) {
    return { error: "Handles must start with @" };
  }
  if (!isArticle && !isEmail && !isSocial && !isMission && !rating) {
    return { error: "Pick a rating" };
  }
  if (!isSocial && richTextLength(parsed.data.content) === 0) {
    return { error: "Post can't be empty" };
  }

  let missionDeadline: Date | null = null;
  if (isMission && parsed.data.missionDeadline) {
    const parsedDeadline = new Date(parsed.data.missionDeadline);
    if (Number.isNaN(parsedDeadline.getTime())) {
      return { error: "That deadline isn't valid" };
    }
    if (parsedDeadline.getTime() <= Date.now()) {
      return { error: "The deadline needs to be in the future" };
    }
    missionDeadline = parsedDeadline;
  }
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
      location: isArticle || isPhone || isEmail ? null : location || null,
      timeSetting: isArticle || isPhone || isEmail ? null : timeSetting || null,
      surroundings: isArticle || isPhone || isEmail ? null : surroundings || null,
      ooc: isArticle || isPhone || isEmail ? null : ooc || null,
      rating: isArticle || isEmail ? null : rating ?? null,
      scheduledFor,
      lastPostAt: now,
      missionDeadline,
      missionMaxSpots: isMission ? missionMaxSpots ?? null : null,
    })
    .returning({ id: threads.id, slug: threads.slug });

  const [openingPost] = await db
    .insert(posts)
    .values({
      threadId: thread.id,
      characterId,
      userId: session.userId,
      content,
      rollValue: isBoard && rollModifier !== undefined ? rollD10() : null,
      rollModifier: isBoard && rollModifier !== undefined ? rollModifier : null,
      emailFormat: isEmail ? emailFormat ?? "email" : null,
      letterTo: isEmail && emailFormat === "letter" ? letterTo || null : null,
      letterFrom: isEmail && emailFormat === "letter" ? letterFrom || null : null,
    })
    .returning({ id: posts.id });

  await awardXp({
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

  if (isMission) {
    const allCharacterIds = await getAllCharacterIds();
    await createNotifications(
      allCharacterIds.filter((id) => id !== characterId),
      "mission_posted",
      `A new mission was posted: "${title}"`,
      `/t/${thread.slug}`
    );
  }

  revalidatePath(`/b/${boardSlug}`);
  redirect(`/t/${thread.slug}`);
}

const newPostSchema = z.object({
  threadSlug: z.string().min(1),
  // Required for every board kind except social, where a photo with no
  // caption is valid — enforced below once we know the board kind, since
  // zod alone can't see that yet.
  content: z.string().max(60000, "That's too long"),
  emailFormat: z.enum(["email", "letter"]).optional(),
  letterTo: z.string().max(200).optional().or(z.literal("")),
  letterFrom: z.string().max(200).optional().or(z.literal("")),
  ooc: z.string().max(4000).optional().or(z.literal("")),
  rollModifier: z.coerce.number().int().min(-99).max(99).optional(),
  imageUrl: z.string().url().max(2000).optional().or(z.literal("")),
});

export async function createPostAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { session, characterId } = await requireSessionAndCharacter();

  if (await isFainted(characterId)) {
    return { error: "Too faint from hunger or thirst to do this right now — eat or drink something." };
  }

  const parsed = newPostSchema.safeParse({
    threadSlug: formData.get("threadSlug"),
    content: formData.get("content"),
    emailFormat: formData.get("emailFormat") || undefined,
    letterTo: formData.get("letterTo") || undefined,
    letterFrom: formData.get("letterFrom") || undefined,
    ooc: formData.get("ooc") || undefined,
    rollModifier: formData.get("rollModifier") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { threadSlug, emailFormat, letterTo, letterFrom, ooc, rollModifier, imageUrl } = parsed.data;

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
  const isEmailBoard = threadBoard?.kind === "email";
  const isPhoneBoard = threadBoard?.kind === "phone";
  const isBoardKind = threadBoard?.kind === "board";
  const isSocialBoard = threadBoard?.kind === "social";

  // Every other board kind requires real content — a social post is the
  // one exception, where a photo with no caption is a valid post.
  if (isSocialBoard) {
    if (!imageUrl && richTextLength(parsed.data.content) === 0) {
      return { error: "Add a photo or a caption" };
    }
  } else if (richTextLength(parsed.data.content) === 0) {
    return { error: "Reply can't be empty" };
  }

  const content =
    threadBoard?.kind === "phone" ? sanitizePlainText(parsed.data.content) : sanitizeRichText(parsed.data.content);

  const [newPost] = await db
    .insert(posts)
    .values({
      threadId: thread.id,
      characterId,
      userId: session.userId,
      content,
      ooc: !isEmailBoard && !isPhoneBoard ? ooc || null : null,
      rollValue: isBoardKind && rollModifier !== undefined ? rollD10() : null,
      rollModifier: isBoardKind && rollModifier !== undefined ? rollModifier : null,
      emailFormat: isEmailBoard ? emailFormat ?? "email" : null,
      letterTo: isEmailBoard && emailFormat === "letter" ? letterTo || null : null,
      letterFrom: isEmailBoard && emailFormat === "letter" ? letterFrom || null : null,
      imageUrl: isSocialBoard ? imageUrl || null : null,
    })
    .returning({ id: posts.id });

  await awardXp({
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
  content: z.string().max(60000, "That's too long"),
  ooc: z.string().max(4000).optional().or(z.literal("")),
});

export async function updatePostAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { session, characterId } = await requireSessionAndCharacter();

  const parsed = editPostSchema.safeParse({
    postId: formData.get("postId"),
    content: formData.get("content"),
    ooc: formData.get("ooc") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { postId, content: rawContent, ooc } = parsed.data;

  const [post] = await db.select().from(posts).where(eq(posts.id, postId));
  if (!post) return { error: "That post no longer exists" };

  const [postThread] = await db.select({ boardId: threads.boardId }).from(threads).where(eq(threads.id, post.threadId));
  const [postBoard] = postThread
    ? await db.select({ kind: boards.kind }).from(boards).where(eq(boards.id, postThread.boardId))
    : [undefined];

  // Social posts are the one place empty content is valid — a photo with
  // no caption. The thread's opening post (the profile bio) is also
  // allowed to be empty regardless of board kind.
  const [threadRow] = await db.select({ characterId: threads.characterId }).from(threads).where(eq(threads.id, post.threadId));
  const isOpeningPostOfSocialProfile = postBoard?.kind === "social" && threadRow?.characterId === post.characterId;
  if (
    richTextLength(parsed.data.content) === 0 &&
    !(postBoard?.kind === "social" && (post.imageUrl || isOpeningPostOfSocialProfile))
  ) {
    return { error: "Post can't be empty" };
  }

  const content = postBoard?.kind === "phone" ? sanitizePlainText(rawContent) : sanitizeRichText(rawContent);

  const isAuthor = post.userId === session.userId;
  const canModerate = session.isAdmin || (await canModeratePosts(characterId));
  if (!isAuthor && !canModerate) {
    return { error: "You don't have permission to edit this post" };
  }

  await db
    .update(posts)
    .set({ content, ooc: postBoard?.kind === "phone" || postBoard?.kind === "email" ? null : ooc || null, editedAt: new Date() })
    .where(eq(posts.id, postId));

  const [thread] = await db.select({ slug: threads.slug }).from(threads).where(eq(threads.id, post.threadId));
  if (thread) revalidatePath(`/t/${thread.slug}`);
  return { error: undefined };
}

const editLetterSchema = z.object({
  postId: z.coerce.number().int(),
  content: z
    .string()
    .min(1, "Letter can't be empty")
    .max(60000, "That's too long")
    .refine((v) => richTextLength(v) > 0, "Letter can't be empty"),
  letterTo: z.string().max(200).optional().or(z.literal("")),
  letterFrom: z.string().max(200).optional().or(z.literal("")),
});

/** Letters have salutation/signature fields on the thread, alongside the post content — edited together. */
export async function updateLetterAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { session, characterId } = await requireSessionAndCharacter();

  const parsed = editLetterSchema.safeParse({
    postId: formData.get("postId"),
    content: formData.get("content"),
    letterTo: formData.get("letterTo") || undefined,
    letterFrom: formData.get("letterFrom") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { postId, letterTo, letterFrom } = parsed.data;
  const content = sanitizeRichText(parsed.data.content);

  const [post] = await db.select().from(posts).where(eq(posts.id, postId));
  if (!post) return { error: "That post no longer exists" };

  const isAuthor = post.userId === session.userId;
  const canModerate = session.isAdmin || (await canModeratePosts(characterId));
  if (!isAuthor && !canModerate) {
    return { error: "You don't have permission to edit this letter" };
  }

  await db
    .update(posts)
    .set({ content, letterTo: letterTo || null, letterFrom: letterFrom || null, editedAt: new Date() })
    .where(eq(posts.id, postId));

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
    const activeCharacterId = await getActiveCharacterId();
    const isModerator = activeCharacterId ? await canModeratePosts(activeCharacterId) : false;
    if (!isModerator) return; // not your post and not a moderator
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

/** Delete an entire thread outright. Admin, management, or Prefect. */
export async function deleteThreadAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!(await canModerateTopics())) return;

  const threadId = Number(formData.get("threadId"));
  if (!threadId) return;

  const [thread] = await db.select().from(threads).where(eq(threads.id, threadId));
  if (!thread) return;

  const [board] = await db.select().from(boards).where(eq(boards.id, thread.boardId));
  await db.delete(threads).where(eq(threads.id, threadId));
  revalidatePath(`/b/${board?.slug ?? ""}`);
  redirect(`/b/${board?.slug ?? ""}`);
}

/** Lock or unlock a thread — locked threads can't receive new replies. Admin, management, or Prefect. */
export async function toggleThreadLockAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!(await canModerateTopics())) return;

  const threadId = Number(formData.get("threadId"));
  if (!threadId) return;

  const [thread] = await db.select().from(threads).where(eq(threads.id, threadId));
  if (!thread) return;

  const [threadBoard] = await db.select({ kind: boards.kind }).from(boards).where(eq(boards.id, thread.boardId));
  if (threadBoard?.kind === "article") return; // article boards reply via comments, not thread posts — no lock

  await db.update(threads).set({ isLocked: !thread.isLocked }).where(eq(threads.id, threadId));
  revalidatePath(`/t/${thread.slug}`);
}

const updateThreadSettingsSchema = z.object({
  threadId: z.coerce.number().int(),
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  location: z.string().max(200).optional().or(z.literal("")),
  timeSetting: z.string().max(100).optional().or(z.literal("")),
  surroundings: z.string().max(4000).optional().or(z.literal("")),
  ooc: z.string().max(4000).optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

export type ThreadSettingsActionState = { error?: string; success?: string } | undefined;

/** Prefects and management can retitle/re-tag a topic (location, time, surroundings, OOC, rating) — not the content of any post. */
export async function updateThreadSettingsAction(
  _prevState: ThreadSettingsActionState,
  formData: FormData
): Promise<ThreadSettingsActionState> {
  const session = await getSession();
  if (!session) return { error: "Not authorized" };
  if (!(await canModerateTopics())) return { error: "Not authorized" };

  const parsed = updateThreadSettingsSchema.safeParse({
    threadId: formData.get("threadId"),
    title: formData.get("title"),
    location: formData.get("location") || undefined,
    timeSetting: formData.get("timeSetting") || undefined,
    surroundings: formData.get("surroundings") || undefined,
    ooc: formData.get("ooc") || undefined,
    rating: formData.get("rating") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { threadId, title, location, timeSetting, surroundings, ooc, rating } = parsed.data;

  const [thread] = await db.select({ slug: threads.slug, boardId: threads.boardId }).from(threads).where(eq(threads.id, threadId));
  if (!thread) return { error: "That topic no longer exists" };

  const [threadBoard] = await db.select({ kind: boards.kind }).from(boards).where(eq(boards.id, thread.boardId));
  if (threadBoard?.kind === "article" || threadBoard?.kind === "email" || threadBoard?.kind === "social") {
    return { error: "This board's topics don't have these settings" };
  }

  await db
    .update(threads)
    .set({
      title,
      location: location || null,
      timeSetting: timeSetting || null,
      surroundings: surroundings || null,
      ooc: ooc || null,
      rating: rating ?? null,
    })
    .where(eq(threads.id, threadId));

  revalidatePath(`/t/${thread.slug}`);
  return { success: "Topic updated" };
}

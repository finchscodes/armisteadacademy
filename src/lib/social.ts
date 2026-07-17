import { eq, and, desc, isNotNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { posts, socialFollows, threads } from "@/db/schema";

export async function getFollowerCount(threadId: number): Promise<number> {
  const rows = await db
    .select({ id: socialFollows.id })
    .from(socialFollows)
    .where(eq(socialFollows.followedThreadId, threadId));
  return rows.length;
}

export async function isFollowingThread(characterId: number, threadId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: socialFollows.id })
    .from(socialFollows)
    .where(and(eq(socialFollows.followerCharacterId, characterId), eq(socialFollows.followedThreadId, threadId)));
  return Boolean(row);
}

/** How many other accounts (social threads) this character follows. */
export async function getFollowingCount(characterId: number): Promise<number> {
  const rows = await db
    .select({ id: socialFollows.id })
    .from(socialFollows)
    .where(eq(socialFollows.followerCharacterId, characterId));
  return rows.length;
}

/** Photo posts in this thread, excluding the opening post (that's the profile header, not a post). */
export async function getPostCount(threadId: number, openingPostId: number): Promise<number> {
  const rows = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.threadId, threadId), isNotNull(posts.imageUrl), ne(posts.id, openingPostId)));
  return rows.length;
}

/** The 9 most recent photo posts for the profile grid — clicking one jumps to it in the thread. */
export async function getRecentPhotoPosts(threadId: number, openingPostId: number, limit = 9) {
  return db
    .select({ id: posts.id, imageUrl: posts.imageUrl, createdAt: posts.createdAt })
    .from(posts)
    .where(and(eq(posts.threadId, threadId), isNotNull(posts.imageUrl), ne(posts.id, openingPostId)))
    .orderBy(desc(posts.createdAt))
    .limit(limit);
}

export async function getThreadIdForSlug(slug: string): Promise<number | null> {
  const [row] = await db.select({ id: threads.id }).from(threads).where(eq(threads.slug, slug));
  return row?.id ?? null;
}

import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { posts, threads, boards, characters } from "@/db/schema";

const EXCERPT_LENGTH = 280;

export async function getRecentFeedPosts(limit = 20) {
  const rows = await db
    .select({
      id: posts.id,
      content: posts.content,
      createdAt: posts.createdAt,
      characterId: characters.id,
      characterName: characters.name,
      characterSlug: characters.slug,
      characterJob: characters.job,
      characterAvatarUrl: characters.avatarUrl,
      threadId: threads.id,
      threadTitle: threads.title,
      threadSlug: threads.slug,
      boardName: boards.name,
      boardSlug: boards.slug,
    })
    .from(posts)
    .innerJoin(threads, eq(posts.threadId, threads.id))
    .innerJoin(boards, eq(threads.boardId, boards.id))
    .innerJoin(characters, eq(posts.characterId, characters.id))
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    excerpt:
      r.content.length > EXCERPT_LENGTH
        ? r.content.slice(0, EXCERPT_LENGTH).trimEnd() + "…"
        : r.content,
  }));
}

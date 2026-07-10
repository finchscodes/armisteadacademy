import { eq, desc, ne } from "drizzle-orm";
import { db } from "@/db";
import { posts, threads, boards, characters } from "@/db/schema";
import { excerptBySentences } from "@/lib/sanitize";
import { getPrimaryJobsForCharacters } from "@/lib/character-jobs";

export async function getRecentFeedPosts(limit = 20) {
  const rows = await db
    .select({
      id: posts.id,
      content: posts.content,
      createdAt: posts.createdAt,
      characterId: characters.id,
      characterName: characters.name,
      characterSlug: characters.slug,
      characterFirstName: characters.firstName,
      characterLastName: characters.lastName,
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

  const jobsByCharacter = await getPrimaryJobsForCharacters([
    ...new Set(rows.map((r) => r.characterId)),
  ]);

  return rows.map((r) => ({
    ...r,
    characterJob: jobsByCharacter.get(r.characterId) ?? "none",
    excerpt: excerptBySentences(r.content),
  }));
}

/**
 * Most recently active topics (distinct threads, not individual posts),
 * excluding article boards — used on the /social page's activity grid.
 * Shows whoever posted last in each thread, with an excerpt of that post.
 */
export async function getRecentTopics(limit = 6) {
  const rows = await db
    .selectDistinctOn([threads.id], {
      threadId: threads.id,
      threadTitle: threads.title,
      threadSlug: threads.slug,
      boardName: boards.name,
      boardSlug: boards.slug,
      postContent: posts.content,
      postCreatedAt: posts.createdAt,
      characterId: characters.id,
      characterName: characters.name,
      characterSlug: characters.slug,
      characterFirstName: characters.firstName,
      characterLastName: characters.lastName,
      characterAvatarUrl: characters.avatarUrl,
    })
    .from(posts)
    .innerJoin(threads, eq(posts.threadId, threads.id))
    .innerJoin(boards, eq(threads.boardId, boards.id))
    .innerJoin(characters, eq(posts.characterId, characters.id))
    .where(ne(boards.kind, "article"))
    .orderBy(threads.id, desc(posts.createdAt));

  const jobsByCharacter = await getPrimaryJobsForCharacters([
    ...new Set(rows.map((r) => r.characterId)),
  ]);

  return rows
    .map((r) => ({
      ...r,
      characterJob: jobsByCharacter.get(r.characterId) ?? "none",
      excerpt: excerptBySentences(r.postContent),
    }))
    .sort((a, b) => b.postCreatedAt.getTime() - a.postCreatedAt.getTime())
    .slice(0, limit);
}

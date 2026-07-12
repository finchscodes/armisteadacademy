import { eq, desc, ne } from "drizzle-orm";
import { db } from "@/db";
import { posts, threads, boards, characters } from "@/db/schema";
import { excerptBySentences } from "@/lib/sanitize";
import { phoneContentToPlainText } from "@/lib/phone-messages";
import { getPrimaryJobsForCharacters } from "@/lib/character-jobs";

/** Same content, marker-free if it's a phone board post, before excerpting. */
function excerptForBoard(content: string, boardKind: string): string {
  return excerptBySentences(boardKind === "phone" ? phoneContentToPlainText(content) : content);
}

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
      boardKind: boards.kind,
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
    excerpt: excerptForBoard(r.content, r.boardKind),
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
      boardKind: boards.kind,
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
      excerpt: excerptForBoard(r.postContent, r.boardKind),
    }))
    .sort((a, b) => b.postCreatedAt.getTime() - a.postCreatedAt.getTime())
    .slice(0, limit);
}

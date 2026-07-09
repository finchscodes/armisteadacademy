import { eq, desc, and, ne } from "drizzle-orm";
import { db } from "@/db";
import { posts, threads, boards } from "@/db/schema";

/**
 * Every distinct thread a character has posted in (opening post or reply),
 * most recent first. Excludes article boards (Notice Board, Armistead
 * Weekly, etc) — those aren't "topics" in the roleplay sense.
 */
export async function getParticipatedThreads(characterId: number) {
  const rows = await db
    .selectDistinctOn([threads.id], {
      threadId: threads.id,
      threadTitle: threads.title,
      threadSlug: threads.slug,
      boardName: boards.name,
      boardSlug: boards.slug,
      lastPostAt: threads.lastPostAt,
    })
    .from(posts)
    .innerJoin(threads, eq(posts.threadId, threads.id))
    .innerJoin(boards, eq(threads.boardId, boards.id))
    .where(and(eq(posts.characterId, characterId), ne(boards.kind, "article")))
    .orderBy(threads.id, desc(posts.createdAt));

  // selectDistinctOn doesn't let us ORDER the final result by lastPostAt
  // directly (Postgres requires the DISTINCT ON columns to lead the ORDER
  // BY), so sort the small deduped set in JS instead.
  return rows.sort((a, b) => b.lastPostAt.getTime() - a.lastPostAt.getTime());
}

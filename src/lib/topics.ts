import { eq, desc, and, ne, inArray } from "drizzle-orm";
import { db } from "@/db";
import { posts, threads, boards, characters } from "@/db/schema";
import { getPrimaryJobsForCharacters } from "@/lib/character-jobs";

/**
 * Every distinct thread a character has posted in (opening post or reply),
 * most recent first, plus who posted last in each (could be someone else).
 * Excludes article boards (Notice Board, Armistead Weekly, etc) — those
 * aren't "topics" in the roleplay sense.
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

  if (rows.length === 0) return [];

  // Who posted last in each of these threads (could be a different character).
  const threadIds = rows.map((r) => r.threadId);
  const lastPosters = await db
    .selectDistinctOn([posts.threadId], {
      threadId: posts.threadId,
      characterId: characters.id,
      characterName: characters.name,
      characterFirstName: characters.firstName,
      characterLastName: characters.lastName,
      characterSlug: characters.slug,
      characterAvatarUrl: characters.avatarUrl,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .innerJoin(characters, eq(posts.characterId, characters.id))
    .where(inArray(posts.threadId, threadIds))
    .orderBy(posts.threadId, desc(posts.createdAt));

  const jobsByCharacter = await getPrimaryJobsForCharacters(lastPosters.map((p) => p.characterId));
  const lastPosterByThread = new Map(
    lastPosters.map((p) => [
      p.threadId,
      { ...p, characterJob: jobsByCharacter.get(p.characterId) ?? "none" },
    ])
  );

  // selectDistinctOn doesn't let us ORDER the final result by lastPostAt
  // directly (Postgres requires the DISTINCT ON columns to lead the ORDER
  // BY), so sort the small deduped set in JS instead.
  return rows
    .map((r) => ({ ...r, lastPoster: lastPosterByThread.get(r.threadId) ?? null }))
    .sort((a, b) => b.lastPostAt.getTime() - a.lastPostAt.getTime());
}

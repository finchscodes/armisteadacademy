import { eq, desc, count, asc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { boards, threads, posts, characters } from "@/db/schema";
import { getPrimaryJobsForCharacters } from "@/lib/character-jobs";

export type BoardNode = typeof boards.$inferSelect & {
  children: BoardNode[];
  threadCount: number;
};

/** All boards, nested under their parent category, with a thread count per board. */
export async function getBoardTree(): Promise<BoardNode[]> {
  const allBoards = await db.select().from(boards).orderBy(asc(boards.position));

  const threadCounts = await db
    .select({ boardId: threads.boardId, total: count() })
    .from(threads)
    .groupBy(threads.boardId);
  const countMap = new Map(threadCounts.map((t) => [t.boardId, t.total]));

  const nodes = new Map<number, BoardNode>(
    allBoards.map((b) => [b.id, { ...b, children: [], threadCount: countMap.get(b.id) ?? 0 }])
  );

  const roots: BoardNode[] = [];
  for (const board of allBoards) {
    const node = nodes.get(board.id)!;
    if (board.parentId && nodes.has(board.parentId)) {
      nodes.get(board.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/**
 * Removes hall-restricted boards a viewer can't access from the nav tree —
 * otherwise everyone would see every hall's board listed (even though
 * clicking through would 404 for them). Management and admin see every hall.
 */
export function filterBoardTreeForViewer(
  tree: BoardNode[],
  viewerHall: string | null,
  canSeeAllHalls: boolean
): BoardNode[] {
  return tree.map((category) => ({
    ...category,
    children: category.children.filter(
      (board) =>
        !board.restrictedToHall || canSeeAllHalls || board.restrictedToHall === viewerHall
    ),
  }));
}

export async function getBoardBySlug(slug: string) {
  const [board] = await db.select().from(boards).where(eq(boards.slug, slug));
  if (!board) return null;

  const childBoards = await db
    .select()
    .from(boards)
    .where(eq(boards.parentId, board.id))
    .orderBy(asc(boards.position));

  const boardThreads = await db
    .select({
      id: threads.id,
      title: threads.title,
      slug: threads.slug,
      isLocked: threads.isLocked,
      isPinned: threads.isPinned,
      scheduledFor: threads.scheduledFor,
      characterId: threads.characterId,
      createdAt: threads.createdAt,
      lastPostAt: threads.lastPostAt,
      characterName: characters.name,
      characterFirstName: characters.firstName,
      characterLastName: characters.lastName,
      characterSlug: characters.slug,
    })
    .from(threads)
    .innerJoin(characters, eq(threads.characterId, characters.id))
    .where(eq(threads.boardId, board.id))
    .orderBy(desc(threads.isPinned), desc(threads.lastPostAt));

  const postCounts = await db
    .select({ threadId: posts.threadId, total: count() })
    .from(posts)
    .groupBy(posts.threadId);
  const postCountMap = new Map(postCounts.map((p) => [p.threadId, p.total]));

  const threadIds = boardThreads.map((t) => t.id);
  const lastPosters =
    threadIds.length > 0
      ? await db
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
          .orderBy(posts.threadId, desc(posts.createdAt))
      : [];
  const jobsByCharacter = await getPrimaryJobsForCharacters(lastPosters.map((p) => p.characterId));
  const lastPosterByThread = new Map(
    lastPosters.map((p) => [
      p.threadId,
      { ...p, characterJob: jobsByCharacter.get(p.characterId) ?? "none" },
    ])
  );

  return {
    board,
    childBoards,
    threads: boardThreads.map((t) => ({
      ...t,
      postCount: postCountMap.get(t.id) ?? 0,
      lastPoster: lastPosterByThread.get(t.id) ?? null,
    })),
  };
}

export async function getThreadBySlug(slug: string) {
  const [thread] = await db.select().from(threads).where(eq(threads.slug, slug));
  if (!thread) return null;

  const [board] = await db.select().from(boards).where(eq(boards.id, thread.boardId));

  const threadPosts = await db
    .select({
      id: posts.id,
      content: posts.content,
      createdAt: posts.createdAt,
      editedAt: posts.editedAt,
      authorUserId: posts.userId,
      characterId: characters.id,
      characterSlug: characters.slug,
      characterName: characters.name,
      characterFirstName: characters.firstName,
      characterLastName: characters.lastName,
      characterMajor: characters.major,
      characterYearOverride: characters.yearOverride,
      characterAvatarUrl: characters.avatarUrl,
    })
    .from(posts)
    .innerJoin(characters, eq(posts.characterId, characters.id))
    .where(eq(posts.threadId, thread.id))
    .orderBy(asc(posts.createdAt));

  return { thread, board, posts: threadPosts };
}

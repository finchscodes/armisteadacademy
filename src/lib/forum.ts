import { eq, desc, count, asc } from "drizzle-orm";
import { db } from "@/db";
import { boards, threads, posts, characters } from "@/db/schema";

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
      createdAt: threads.createdAt,
      lastPostAt: threads.lastPostAt,
      characterName: characters.name,
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

  return {
    board,
    childBoards,
    threads: boardThreads.map((t) => ({ ...t, postCount: postCountMap.get(t.id) ?? 0 })),
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
      characterId: characters.id,
      characterName: characters.name,
      characterHouse: characters.house,
      characterYearOrRole: characters.yearOrRole,
      characterAvatarUrl: characters.avatarUrl,
    })
    .from(posts)
    .innerJoin(characters, eq(posts.characterId, characters.id))
    .where(eq(posts.threadId, thread.id))
    .orderBy(asc(posts.createdAt));

  return { thread, board, posts: threadPosts };
}

import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { threads, boards } from "@/db/schema";

export async function getRecentNews(limit = 6) {
  const rows = await db
    .select({
      id: threads.id,
      title: threads.title,
      slug: threads.slug,
      createdAt: threads.createdAt,
      scheduledFor: threads.scheduledFor,
      boardName: boards.name,
      boardSlug: boards.slug,
    })
    .from(threads)
    .innerJoin(boards, eq(threads.boardId, boards.id))
    .where(eq(boards.kind, "article"))
    .orderBy(desc(threads.createdAt))
    .limit(limit * 2); // fetch extra since some may still be scheduled for the future

  const now = Date.now();
  return rows
    .filter((r) => !r.scheduledFor || r.scheduledFor.getTime() <= now)
    .slice(0, limit);
}

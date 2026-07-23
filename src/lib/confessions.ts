import { eq, and, lt, desc } from "drizzle-orm";
import { db } from "@/db";
import { confessions, characters } from "@/db/schema";

const EXPIRY_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks after approval

/**
 * Approved confessions still within their 2-week window, newest first.
 * Lazily deletes anything that's aged out — same pattern as the other
 * time-based systems in this app (game time, hunger/thirst): nothing runs
 * on a schedule, expiry is resolved the moment something asks.
 */
export async function getApprovedConfessions(): Promise<{ id: number; content: string; approvedAt: Date }[]> {
  const cutoff = new Date(Date.now() - EXPIRY_MS);

  await db.delete(confessions).where(and(eq(confessions.status, "approved"), lt(confessions.approvedAt, cutoff)));

  const rows = await db
    .select({ id: confessions.id, content: confessions.content, approvedAt: confessions.approvedAt })
    .from(confessions)
    .where(eq(confessions.status, "approved"))
    .orderBy(desc(confessions.approvedAt));

  return rows.filter((r): r is { id: number; content: string; approvedAt: Date } => r.approvedAt !== null);
}

/** The admin vetting queue — oldest submission first, so nothing waits forever unseen. Includes the submitter's name for moderation accountability (never shown publicly). */
export async function getPendingConfessions() {
  return db
    .select({
      id: confessions.id,
      content: confessions.content,
      createdAt: confessions.createdAt,
      characterId: confessions.characterId,
      characterName: characters.name,
      characterSlug: characters.slug,
    })
    .from(confessions)
    .innerJoin(characters, eq(confessions.characterId, characters.id))
    .where(eq(confessions.status, "pending"))
    .orderBy(confessions.createdAt);
}

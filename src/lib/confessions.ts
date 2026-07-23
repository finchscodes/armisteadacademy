import { eq, and, gt, lt, desc } from "drizzle-orm";
import { db } from "@/db";
import { confessions, characters } from "@/db/schema";

const EXPIRY_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks after approval

/**
 * Approved confessions still within their 2-week window, newest first.
 * Read-only — expired rows are excluded by the WHERE clause, not deleted
 * here. This runs on every homepage visit, so it must never write;
 * deleting here would mean every single visitor's page load ran a DELETE
 * statement against the table, which is expensive (locks, WAL writes) and
 * was very likely a real contributor to the site-wide hangs. Actual
 * removal happens in getPendingConfessions instead, which only runs when
 * an admin visits the moderation queue — infrequent by comparison.
 */
export async function getApprovedConfessions(): Promise<{ id: number; content: string; approvedAt: Date }[]> {
  const cutoff = new Date(Date.now() - EXPIRY_MS);

  const rows = await db
    .select({ id: confessions.id, content: confessions.content, approvedAt: confessions.approvedAt })
    .from(confessions)
    .where(and(eq(confessions.status, "approved"), gt(confessions.approvedAt, cutoff)))
    .orderBy(desc(confessions.approvedAt));

  return rows.filter((r): r is { id: number; content: string; approvedAt: Date } => r.approvedAt !== null);
}

/** The admin vetting queue — oldest submission first, so nothing waits forever unseen. Includes the submitter's legal name (never the codename) for moderation accountability, never shown publicly. */
export async function getPendingConfessions() {
  // Expired-confession cleanup lives here rather than in
  // getApprovedConfessions — this only runs when an admin visits the
  // moderation queue, not on every homepage view.
  const cutoff = new Date(Date.now() - EXPIRY_MS);
  await db.delete(confessions).where(and(eq(confessions.status, "approved"), lt(confessions.approvedAt, cutoff)));

  return db
    .select({
      id: confessions.id,
      content: confessions.content,
      createdAt: confessions.createdAt,
      characterId: confessions.characterId,
      characterFirstName: characters.firstName,
      characterLastName: characters.lastName,
      characterSlug: characters.slug,
    })
    .from(confessions)
    .innerJoin(characters, eq(confessions.characterId, characters.id))
    .where(eq(confessions.status, "pending"))
    .orderBy(confessions.createdAt);
}

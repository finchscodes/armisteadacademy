import { eq, and, gt, or, isNull, sql, inArray } from "drizzle-orm";
import { db } from "@/db";
import { threads, missionReservations, characters, boards } from "@/db/schema";

/**
 * Missions still open — deadline hasn't passed, and reservations haven't
 * filled every spot. Not deleted when they close, just excluded here, so
 * reservation history survives for RP continuity; the thread itself is
 * still directly reachable by URL after it drops off this list.
 */
export async function getOpenMissions(boardId: number) {
  const now = new Date();

  const rows = await db
    .select({
      id: threads.id,
      slug: threads.slug,
      title: threads.title,
      createdAt: threads.createdAt,
      missionDeadline: threads.missionDeadline,
      missionMaxSpots: threads.missionMaxSpots,
      characterId: threads.characterId,
      posterFirstName: characters.firstName,
      posterLastName: characters.lastName,
      posterSlug: characters.slug,
      reservedCount: sql<number>`(select count(*)::int from ${missionReservations} where ${missionReservations.threadId} = ${threads.id})`,
    })
    .from(threads)
    .innerJoin(characters, eq(threads.characterId, characters.id))
    .where(
      and(
        eq(threads.boardId, boardId),
        or(isNull(threads.missionDeadline), gt(threads.missionDeadline, now))
      )
    )
    .orderBy(threads.createdAt);

  return rows.filter((r) => r.missionMaxSpots == null || r.reservedCount < r.missionMaxSpots);
}

export async function getReservationCount(threadId: number): Promise<number> {
  const rows = await db
    .select({ id: missionReservations.id })
    .from(missionReservations)
    .where(eq(missionReservations.threadId, threadId));
  return rows.length;
}

/** Reservation counts for several missions at once — for filtering a board listing without one query per thread. */
export async function getReservationCountsForThreads(threadIds: number[]): Promise<Map<number, number>> {
  if (threadIds.length === 0) return new Map();
  const rows = await db
    .select({ threadId: missionReservations.threadId })
    .from(missionReservations)
    .where(inArray(missionReservations.threadId, threadIds));
  const counts = new Map<number, number>();
  for (const r of rows) {
    counts.set(r.threadId, (counts.get(r.threadId) ?? 0) + 1);
  }
  return counts;
}

export async function isReservedBy(threadId: number, characterId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: missionReservations.id })
    .from(missionReservations)
    .where(and(eq(missionReservations.threadId, threadId), eq(missionReservations.characterId, characterId)));
  return Boolean(row);
}

export async function getReservationsForMission(threadId: number) {
  return db
    .select({
      characterId: missionReservations.characterId,
      name: characters.name,
      slug: characters.slug,
    })
    .from(missionReservations)
    .innerJoin(characters, eq(missionReservations.characterId, characters.id))
    .where(eq(missionReservations.threadId, threadId))
    .orderBy(missionReservations.createdAt);
}

/** Everyone with a character, for the "new mission posted" broadcast notification. */
export async function getAllCharacterIds(): Promise<number[]> {
  const rows = await db.select({ id: characters.id }).from(characters);
  return rows.map((r) => r.id);
}

export async function getMissionBoardId(): Promise<number | null> {
  const [row] = await db.select({ id: boards.id }).from(boards).where(eq(boards.slug, "missions"));
  return row?.id ?? null;
}

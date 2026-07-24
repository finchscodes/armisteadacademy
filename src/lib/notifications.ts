import { eq, desc, and, count } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";

type NotificationType =
  | "thread_reply"
  | "relation_request"
  | "homework_graded"
  | "wall_post"
  | "mission_posted"
  | "trade_proposed"
  | "item_gifted";

export async function createNotification(
  characterId: number,
  type: NotificationType,
  message: string,
  link: string
) {
  await db.insert(notifications).values({ characterId, type, message, link });
}

/** Same notification to several characters at once (e.g. every other participant in a thread). */
export async function createNotifications(
  characterIds: number[],
  type: NotificationType,
  message: string,
  link: string
) {
  if (characterIds.length === 0) return;
  await db.insert(notifications).values(
    characterIds.map((characterId) => ({ characterId, type, message, link }))
  );
}

export async function getUnreadNotificationCount(characterId: number): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(notifications)
    .where(and(eq(notifications.characterId, characterId), eq(notifications.isRead, false)));
  return row?.total ?? 0;
}

export async function getNotifications(characterId: number, limit = 15) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.characterId, characterId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

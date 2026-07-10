"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { getNotifications } from "@/lib/notifications";

export async function markAllNotificationsReadAction() {
  const { characterId } = await requireSessionAndCharacter();

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.characterId, characterId), eq(notifications.isRead, false)));

  revalidatePath("/", "layout");
}

/** Polled by the notification bell so new notifications show up without a full page reload. */
export async function getMyNotificationsAction() {
  const { characterId } = await requireSessionAndCharacter();
  const rows = await getNotifications(characterId);
  return rows.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }));
}

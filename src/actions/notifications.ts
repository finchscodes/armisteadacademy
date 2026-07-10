"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";

export async function markAllNotificationsReadAction() {
  const { characterId } = await requireSessionAndCharacter();

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.characterId, characterId), eq(notifications.isRead, false)));

  revalidatePath("/", "layout");
}

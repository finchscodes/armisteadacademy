"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { threads, missionReservations } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { getReservationCount } from "@/lib/missions";

export type MissionActionState = { error?: string; success?: string } | undefined;

/** Reserves one spot on a mission — blocked once it's full or past its deadline. */
export async function reserveMissionSpotAction(
  _prevState: MissionActionState,
  formData: FormData
): Promise<MissionActionState> {
  const { characterId } = await requireSessionAndCharacter();
  const threadId = Number(formData.get("threadId"));
  if (!threadId) return { error: "Mission not found" };

  const [thread] = await db
    .select({ slug: threads.slug, missionDeadline: threads.missionDeadline, missionMaxSpots: threads.missionMaxSpots })
    .from(threads)
    .where(eq(threads.id, threadId));
  if (!thread) return { error: "Mission not found" };

  if (thread.missionDeadline && thread.missionDeadline <= new Date()) {
    return { error: "The deadline for this mission has passed" };
  }

  if (thread.missionMaxSpots != null) {
    const count = await getReservationCount(threadId);
    if (count >= thread.missionMaxSpots) {
      return { error: "This mission is already full" };
    }
  }

  const [existing] = await db
    .select({ id: missionReservations.id })
    .from(missionReservations)
    .where(and(eq(missionReservations.threadId, threadId), eq(missionReservations.characterId, characterId)));
  if (existing) return { error: "You already reserved a spot on this mission" };

  await db.insert(missionReservations).values({ threadId, characterId });

  revalidatePath(`/t/${thread.slug}`);
  revalidatePath("/b/missions");
  return { success: "Spot reserved" };
}

/** Cancels a character's own reservation on a mission. */
export async function unreserveMissionSpotAction(
  _prevState: MissionActionState,
  formData: FormData
): Promise<MissionActionState> {
  const { characterId } = await requireSessionAndCharacter();
  const threadId = Number(formData.get("threadId"));
  if (!threadId) return { error: "Mission not found" };

  const [thread] = await db.select({ slug: threads.slug }).from(threads).where(eq(threads.id, threadId));
  if (!thread) return { error: "Mission not found" };

  await db
    .delete(missionReservations)
    .where(and(eq(missionReservations.threadId, threadId), eq(missionReservations.characterId, characterId)));

  revalidatePath(`/t/${thread.slug}`);
  revalidatePath("/b/missions");
  return { success: "Reservation cancelled" };
}

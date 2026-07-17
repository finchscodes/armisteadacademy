"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { gameTime } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getCurrentGameDate, dayIndexFromDate, QUARTER_ORDER, QUARTER_WEEKS } from "@/lib/game-time";

export type GameTimeActionState = { error?: string; success?: string } | undefined;

/**
 * Deliberately stricter than requireAdmin() elsewhere in this app — this is
 * the one control surface explicitly meant to exclude management jobs too,
 * true site admins only.
 */
async function requireTrueAdmin() {
  const session = await getSession();
  if (!session || !session.isAdmin) {
    throw new Error("Not authorized");
  }
  return session;
}

export async function togglePauseGameTimeAction(formData: FormData) {
  await requireTrueAdmin();
  const pause = formData.get("pause") === "true";

  // Make sure we're caught up before pausing (or resuming with a clean
  // "last advanced" baseline) so no days get silently skipped or double-counted.
  await getCurrentGameDate();
  await db.update(gameTime).set({ isPaused: pause, lastAdvancedAt: new Date() }).where(eq(gameTime.id, 1));

  revalidatePath("/admin/game-time");
  revalidatePath("/");
}

const setTimeSchema = z.object({
  year: z.coerce.number().int().min(1),
  quarter: z.enum(QUARTER_ORDER as [string, ...string[]]),
  week: z.coerce.number().int().min(1),
  dayOfWeek: z.coerce.number().int().min(1).max(7),
});

export async function setGameTimeAction(
  _prevState: GameTimeActionState,
  formData: FormData
): Promise<GameTimeActionState> {
  await requireTrueAdmin();

  const parsed = setTimeSchema.safeParse({
    year: formData.get("year"),
    quarter: formData.get("quarter"),
    week: formData.get("week"),
    dayOfWeek: formData.get("dayOfWeek"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { year, quarter, week, dayOfWeek } = parsed.data;
  const maxWeek = QUARTER_WEEKS[quarter as keyof typeof QUARTER_WEEKS];
  if (week > maxWeek) {
    return { error: `${quarter} only has ${maxWeek} weeks` };
  }

  const dayIndex = dayIndexFromDate(year, quarter as never, week, dayOfWeek);

  await db.update(gameTime).set({ dayIndex, lastAdvancedAt: new Date() }).where(eq(gameTime.id, 1));

  revalidatePath("/admin/game-time");
  revalidatePath("/");
  return { success: "Time updated" };
}

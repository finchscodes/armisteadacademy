import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { gameTime } from "@/db/schema";
import { getCurrentGameDate } from "@/lib/game-time";
import { GameTimeControls } from "@/components/game-time-controls";
import { getCurrentUser } from "@/lib/current-user";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

export default async function AdminGameTimePage() {
  const current = await getCurrentUser();
  // True admin only — deliberately not open to management jobs, unlike
  // most of the rest of the admin panel.
  if (!current?.session.isAdmin) redirect("/admin");

  const date = await getCurrentGameDate();
  const [row] = await db.select({ isPaused: gameTime.isPaused }).from(gameTime).where(eq(gameTime.id, 1));

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl text-parchment-100 mb-1">Game time</h1>
      <p className="text-sm text-ink-400 mb-6">
        Advances automatically (1 real day = 1 game day) unless paused. Admin only.
      </p>
      <GameTimeControls date={date} isPaused={row?.isPaused ?? false} />
    </div>
  );
}

import { getCurrentGameDate } from "@/lib/game-time";

export async function GameTimeWidget() {
  const date = await getCurrentGameDate();

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-ink-700">
        <h2 className="font-ui text-xs uppercase tracking-widest text-ink-400">Current Date</h2>
      </div>
      <div className="p-4 text-center">
        <p className="font-display text-lg text-brass-400">
          {date.quarter[0].toUpperCase() + date.quarter.slice(1)} &middot; Week {date.week}
        </p>
        <p className="text-sm text-ink-300">
          {date.dayName}, Year {date.year}
        </p>
      </div>
    </div>
  );
}

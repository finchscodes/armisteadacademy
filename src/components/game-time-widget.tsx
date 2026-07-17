import { getCurrentGameDate } from "@/lib/game-time";
import { CalendarIcon } from "@/components/nav-icons";

export async function GameTimeWidget() {
  const date = await getCurrentGameDate();

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg p-3 flex items-center gap-3">
      <div className="shrink-0 w-11 h-11 rounded-full bg-brass-500/15 border border-brass-500/30 flex items-center justify-center">
        <CalendarIcon className="w-5 h-5 text-brass-400" />
      </div>
      <div className="min-w-0">
        <p className="font-display text-base text-parchment-100 leading-tight truncate">
          Year {date.year}
        </p>
        <p className="text-sm text-steel-400 leading-tight">
          Week {date.week} ({date.quarter[0].toUpperCase() + date.quarter.slice(1)})
        </p>
      </div>
    </div>
  );
}

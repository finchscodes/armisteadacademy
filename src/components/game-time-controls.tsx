"use client";

import { useState, useTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import { togglePauseGameTimeAction, setGameTimeAction } from "@/actions/game-time";
import { QUARTER_ORDER, QUARTER_WEEKS, DAY_NAMES, type Quarter, type GameDate } from "@/lib/game-calendar";
import { StyledSelect } from "@/components/styled-select";

export function GameTimeControls({ date, isPaused }: { date: GameDate; isPaused: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [setState, setFormAction, setPending] = useActionState(setGameTimeAction, undefined);

  const [year, setYear] = useState(String(date.year));
  const [quarter, setQuarter] = useState<Quarter>(date.quarter);
  const [week, setWeek] = useState(String(date.week));
  const [dayOfWeek, setDayOfWeek] = useState(String(date.dayOfWeek));

  function handleTogglePause() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("pause", String(!isPaused));
      await togglePauseGameTimeAction(formData);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="bg-ink-900 border border-ink-700 rounded-lg p-6 text-center">
        <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">Currently</p>
        <p className="font-display text-2xl text-brass-400">
          Year {date.year} &middot; {date.quarter[0].toUpperCase() + date.quarter.slice(1)} &middot; Week {date.week}
        </p>
        <p className="text-sm text-ink-300 mt-1">{date.dayName}</p>
        {isPaused && <p className="text-xs text-claret-500 mt-2 uppercase tracking-wider">Paused</p>}
      </div>

      <button
        type="button"
        onClick={handleTogglePause}
        disabled={pending}
        className="w-full text-sm bg-ink-800 border border-ink-600 text-parchment-100 px-4 py-2.5 rounded-md hover:border-brass-500/50 transition-colors disabled:opacity-60"
      >
        {pending ? "..." : isPaused ? "Resume time progression" : "Pause time progression"}
      </button>

      <div className="bg-ink-900 border border-ink-700 rounded-lg p-4">
        <p className="text-sm font-medium mb-3">Manually set time</p>
        <form
          action={(fd) => {
            setFormAction(fd);
            router.refresh();
          }}
          className="space-y-3"
        >
          <input type="hidden" name="quarter" value={quarter} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-ink-400 mb-1">Year</label>
              <input
                name="year"
                type="number"
                min={1}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-ink-400 mb-1">Quarter</label>
              <StyledSelect
                value={quarter}
                onChange={(v) => {
                  setQuarter(v as Quarter);
                  setWeek("1");
                }}
                options={QUARTER_ORDER.map((q) => ({ value: q, label: q[0].toUpperCase() + q.slice(1) }))}
              />
            </div>
            <div>
              <label className="block text-[11px] text-ink-400 mb-1">Week</label>
              <StyledSelect
                value={week}
                onChange={setWeek}
                options={Array.from({ length: QUARTER_WEEKS[quarter] }, (_, i) => ({
                  value: String(i + 1),
                  label: `Week ${i + 1}`,
                }))}
              />
              <input type="hidden" name="week" value={week} />
            </div>
            <div>
              <label className="block text-[11px] text-ink-400 mb-1">Day</label>
              <StyledSelect
                value={dayOfWeek}
                onChange={setDayOfWeek}
                options={DAY_NAMES.map((d, i) => ({ value: String(i + 1), label: d }))}
              />
              <input type="hidden" name="dayOfWeek" value={dayOfWeek} />
            </div>
          </div>
          {setState?.error && <p className="text-xs text-claret-500">{setState.error}</p>}
          {setState?.success && <p className="text-xs text-green-500">{setState.success}</p>}
          <button
            type="submit"
            disabled={setPending}
            className="text-sm bg-brass-500 text-ink-950 px-4 py-2 rounded-md font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
          >
            {setPending ? "Saving..." : "Set time"}
          </button>
        </form>
      </div>
    </div>
  );
}

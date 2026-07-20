"use client";

import { useEffect, useRef, useState } from "react";
import { getMyLevelAction } from "@/actions/level-check";

const CHECK_INTERVAL_MS = 30 * 1000;
const STORAGE_PREFIX = "armistead:lastSeenLevel:";

function specialNote(level: number): string | null {
  if (level === 3) return "You can now access the Grading Bin.";
  if (level === 10) return "You can now use /me in chat — try \"/me dances\" to see how it looks.";
  return null;
}

export function LevelUpWatcher() {
  const [popup, setPopup] = useState<{ level: number; note: string | null } | null>(null);
  const checkedOnce = useRef(false);

  useEffect(() => {
    async function check() {
      let result;
      try {
        result = await getMyLevelAction();
      } catch (err) {
        console.error("LevelUpWatcher check failed:", err);
        return;
      }
      if (!result) return;

      const key = STORAGE_PREFIX + result.characterId;
      const stored = localStorage.getItem(key);
      const lastSeen = stored ? Number(stored) : null;

      if (lastSeen === null) {
        // First time we've ever checked this character — just record the
        // baseline, don't congratulate them for XP they earned before this
        // feature existed.
        localStorage.setItem(key, String(result.level));
        return;
      }

      if (result.level > lastSeen) {
        setPopup({ level: result.level, note: specialNote(result.level) });
        localStorage.setItem(key, String(result.level));
      } else if (result.level !== lastSeen) {
        localStorage.setItem(key, String(result.level));
      }
    }

    if (!checkedOnce.current) {
      checkedOnce.current = true;
      check();
    }
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  if (!popup) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-ink-900 border border-gunmetal-500 rounded-lg shadow-2xl shadow-black/60 max-w-sm w-full p-6 text-center">
        <p className="text-4xl mb-2">🎉</p>
        <h2 className="font-display text-2xl text-gunmetal-400 mb-1">Level Up!</h2>
        <p className="text-parchment-100 text-sm mb-1">
          You&apos;ve reached <span className="text-gunmetal-400 font-medium">Level {popup.level}</span>.
        </p>
        {popup.note && <p className="text-ink-400 text-xs mt-2">{popup.note}</p>}
        <button
          onClick={() => setPopup(null)}
          className="mt-5 bg-gunmetal-500 text-ink-950 rounded-md px-5 py-2 text-sm font-medium hover:bg-gunmetal-400 transition-colors"
        >
          Nice
        </button>
      </div>
    </div>
  );
}

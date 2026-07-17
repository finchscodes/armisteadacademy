"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { tierLabel, tierColor, type GradeTier } from "@/lib/grading";

type Result = {
  id: number;
  finalTier: string | null;
  grade: number | null;
  payout: number | null;
  gradedAt: Date | null;
  lessonId: number;
  lessonTitle: string;
  boardName: string;
};

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function MyResultsByClass({ results }: { results: Result[] }) {
  const classes = useMemo(() => [...new Set(results.map((r) => r.boardName))].sort(), [results]);
  const [selected, setSelected] = useState("all");

  const filtered = selected === "all" ? results : results.filter((r) => r.boardName === selected);

  if (results.length === 0) {
    return <p className="text-sm text-ink-400">Nothing graded yet — submit some homework first.</p>;
  }

  return (
    <div>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1.5 mb-3 focus:outline-none focus:border-gunmetal-500"
      >
        <option value="all">All classes ({results.length})</option>
        {classes.map((c) => (
          <option key={c} value={c}>
            {c} ({results.filter((r) => r.boardName === c).length})
          </option>
        ))}
      </select>

      <div className="bg-ink-900 border border-ink-700 rounded-lg divide-y divide-ink-700">
        {filtered.map((s) => (
          <Link
            key={s.id}
            href={`/lesson/${s.lessonId}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-ink-800/60 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm text-parchment-100">{s.lessonTitle}</p>
              <p className="text-xs text-ink-400 mt-0.5">
                {s.boardName} &middot; {s.gradedAt ? timeAgo(s.gradedAt) : ""}
              </p>
            </div>
            <div className="text-right shrink-0 ml-3">
              {s.finalTier && (
                <p className="text-sm font-medium" style={{ color: tierColor(s.finalTier as GradeTier) }}>
                  {tierLabel(s.finalTier as GradeTier)}
                </p>
              )}
              <p className="text-xs text-gunmetal-400">
                {s.grade} &middot; {s.payout} dollars
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

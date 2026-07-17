"use client";

import { useState } from "react";

export function ProfileTabs({
  backstory,
  appearance,
  wall,
  topics,
  topicsCount,
  arsenal,
  arsenalCount,
}: {
  backstory: React.ReactNode;
  appearance: React.ReactNode;
  wall: React.ReactNode;
  topics: React.ReactNode;
  topicsCount: number;
  arsenal: React.ReactNode;
  arsenalCount: number;
}) {
  const [tab, setTab] = useState<"backstory" | "appearance" | "wall" | "topics" | "arsenal">("wall");

  const tabs = [
    { key: "wall" as const, label: "Wall" },
    { key: "appearance" as const, label: "Dossier" },
    { key: "backstory" as const, label: "Transcript" },
    { key: "topics" as const, label: `Topics (${topicsCount})` },
    { key: "arsenal" as const, label: `Arsenal (${arsenalCount})` },
  ];

  return (
    <div>
      <div className="flex gap-1 border-b border-ink-700 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`text-sm px-4 py-2.5 border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? "border-gunmetal-500 text-gunmetal-400"
                : "border-transparent text-ink-400 hover:text-parchment-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "backstory" && backstory}
      {tab === "appearance" && appearance}
      {tab === "wall" && wall}
      {tab === "topics" && topics}
      {tab === "arsenal" && arsenal}
    </div>
  );
}

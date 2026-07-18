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
  pets,
  petsCount,
}: {
  backstory: React.ReactNode;
  appearance: React.ReactNode;
  wall: React.ReactNode;
  topics: React.ReactNode;
  topicsCount: number;
  arsenal: React.ReactNode;
  arsenalCount: number;
  pets: React.ReactNode;
  petsCount: number;
}) {
  const [tab, setTab] = useState<"backstory" | "appearance" | "wall" | "topics" | "arsenal" | "pets">("wall");

  const tabs = [
    { key: "wall" as const, label: "Wall" },
    { key: "appearance" as const, label: "Dossier" },
    { key: "backstory" as const, label: "Transcript" },
    { key: "topics" as const, label: `Topics (${topicsCount})` },
    { key: "arsenal" as const, label: `Arsenal (${arsenalCount})` },
    { key: "pets" as const, label: `Pets (${petsCount})` },
  ];

  return (
    <div>
      <div className="flex gap-0 border-b border-ink-700 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`text-[11px] px-2 py-1.5 border-b-2 -mb-px whitespace-nowrap transition-colors ${
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
      {tab === "pets" && pets}
    </div>
  );
}

"use client";

import { useState } from "react";

export function ProfileTabs({
  overview,
  topics,
  relations,
  topicsCount,
  relationsCount,
}: {
  overview: React.ReactNode;
  topics: React.ReactNode;
  relations: React.ReactNode;
  topicsCount: number;
  relationsCount: number;
}) {
  const [tab, setTab] = useState<"overview" | "topics" | "relations">("overview");

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "topics" as const, label: `Topics (${topicsCount})` },
    { key: "relations" as const, label: `Relations (${relationsCount})` },
  ];

  return (
    <div>
      <div className="flex gap-1 border-b border-ink-700 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`text-sm px-4 py-2.5 border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? "border-brass-500 text-brass-400"
                : "border-transparent text-ink-400 hover:text-parchment-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && overview}
      {tab === "topics" && topics}
      {tab === "relations" && relations}
    </div>
  );
}

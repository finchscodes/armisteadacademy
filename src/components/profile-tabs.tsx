"use client";

import { useState } from "react";

export function ProfileTabs({
  overview,
  backstory,
  topics,
  topicsCount,
}: {
  overview: React.ReactNode;
  backstory: React.ReactNode;
  topics: React.ReactNode;
  topicsCount: number;
}) {
  const [tab, setTab] = useState<"overview" | "backstory" | "topics">("overview");

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "backstory" as const, label: "Backstory" },
    { key: "topics" as const, label: `Topics (${topicsCount})` },
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
      {tab === "backstory" && backstory}
      {tab === "topics" && topics}
    </div>
  );
}

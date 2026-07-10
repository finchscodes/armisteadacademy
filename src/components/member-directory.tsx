"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CharacterBadge } from "./character-badge";
import { CharacterHoverCard } from "./character-hover-card";

type Member = {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
  major: string;
};

export function MemberDirectory({ members }: { members: Member[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q)
    );
  }, [members, query]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name..."
        autoComplete="off"
        className="w-full max-w-sm rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm mb-4 focus:outline-none focus:border-brass-500"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-ink-400">No one matches that search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((m) => (
            <Link
              key={m.id}
              href={`/c/${m.slug}`}
              className="bg-ink-900 border border-ink-700 rounded-lg p-4 flex items-center gap-3 hover:border-brass-500/50 transition-colors"
            >
              <CharacterHoverCard characterId={m.id} slug={m.slug} className="relative shrink-0">
                <CharacterBadge name={m.name} avatarUrl={m.avatarUrl} size="sm" />
              </CharacterHoverCard>
              <div className="min-w-0">
                <p className="text-sm text-parchment-100 truncate">
                  {m.firstName} {m.lastName}
                </p>
                <p className="text-xs text-ink-400 truncate">{m.major}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

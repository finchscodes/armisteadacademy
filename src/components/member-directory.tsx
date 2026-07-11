"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getMajorColor } from "@/lib/majors";
import { jobColor } from "@/lib/roles";
import { hallLabel, hallColor } from "@/lib/halls";
import { CharacterHoverCard } from "@/components/character-hover-card";

type Member = {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
  age: number;
  major: string;
  hall: string | null;
  year: string;
  characterJob: string;
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
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          {filtered.map((m) => {
            const avatarColor = getMajorColor(m.major) ?? "#7f95a3";
            const nameColor = jobColor(m.characterJob as never) ?? undefined;
            return (
              <div key={m.id} className="bg-ink-900 border border-ink-700 overflow-hidden group">
                <Link href={`/c/${m.slug}`} className="block relative aspect-[4/3] bg-ink-800 overflow-hidden">
                  {m.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.avatarUrl}
                      alt={m.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-2xl font-display"
                      style={{ backgroundColor: `${avatarColor}26`, color: avatarColor }}
                    >
                      {m.firstName.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-transparent to-transparent" />
                </Link>
                <div className="p-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-ink-400 truncate">
                    {m.firstName}
                  </p>
                  <CharacterHoverCard characterId={m.id} slug={m.slug} className="relative block">
                    <Link
                      href={`/c/${m.slug}`}
                      className="font-display text-base -mt-1 block truncate hover:underline"
                      style={{ color: nameColor }}
                    >
                      {m.lastName}
                    </Link>
                  </CharacterHoverCard>
                  <div className="mt-2 pt-2 border-t border-ink-800 space-y-1 text-[11px] leading-tight">
                    <div className="flex items-start gap-2">
                      <span className="text-ink-400">Age</span>
                      <span className="text-parchment-200 ml-auto">{m.age}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-ink-400 shrink-0">Major</span>
                      <span className="ml-auto text-right" style={{ color: getMajorColor(m.major) ?? undefined }}>
                        {m.major}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-ink-400">Year</span>
                      <span className="text-parchment-200 ml-auto">{m.year}</span>
                    </div>
                    {m.hall && (
                      <div className="flex items-start gap-2">
                        <span className="text-ink-400">Hall</span>
                        <span className="ml-auto text-right" style={{ color: hallColor(m.hall) ?? undefined }}>
                          {hallLabel(m.hall)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

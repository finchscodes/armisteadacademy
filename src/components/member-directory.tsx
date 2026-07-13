"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getMajorColor } from "@/lib/majors";
import { jobColor } from "@/lib/roles";
import { hallLabel, hallColor } from "@/lib/halls";
import { CharacterHoverCard } from "@/components/character-hover-card";
import { StyledSelect } from "@/components/styled-select";

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

const ALL = "__all";

export function MemberDirectory({ members }: { members: Member[] }) {
  const [query, setQuery] = useState("");
  const [majorFilter, setMajorFilter] = useState(ALL);
  const [hallFilter, setHallFilter] = useState(ALL);
  const [yearFilter, setYearFilter] = useState(ALL);
  const [ageFilter, setAgeFilter] = useState(ALL);

  const majorOptions = useMemo(
    () => [...new Set(members.map((m) => m.major))].sort(),
    [members]
  );
  const hallOptions = useMemo(
    () => [...new Set(members.map((m) => m.hall).filter((h): h is string => Boolean(h)))].sort(),
    [members]
  );
  const yearOptions = useMemo(() => [...new Set(members.map((m) => m.year))].sort(), [members]);
  const ageOptions = useMemo(
    () => [...new Set(members.map((m) => m.age))].sort((a, b) => a - b),
    [members]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (q && !`${m.firstName} ${m.lastName}`.toLowerCase().includes(q) && !m.name.toLowerCase().includes(q)) {
        return false;
      }
      if (majorFilter !== ALL && m.major !== majorFilter) return false;
      if (hallFilter !== ALL && m.hall !== hallFilter) return false;
      if (yearFilter !== ALL && m.year !== yearFilter) return false;
      if (ageFilter !== ALL && String(m.age) !== ageFilter) return false;
      return true;
    });
  }, [members, query, majorFilter, hallFilter, yearFilter, ageFilter]);

  const hasActiveFilters = majorFilter !== ALL || hallFilter !== ALL || yearFilter !== ALL || ageFilter !== ALL;

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="block text-[11px] text-ink-400 mb-1">Search</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name..."
            autoComplete="off"
            className="w-48 rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500"
          />
        </div>
        <div className="w-40">
          <label className="block text-[11px] text-ink-400 mb-1">Major</label>
          <StyledSelect
            value={majorFilter}
            onChange={setMajorFilter}
            options={[{ value: ALL, label: "All majors" }, ...majorOptions.map((m) => ({ value: m, label: m }))]}
          />
        </div>
        <div className="w-36">
          <label className="block text-[11px] text-ink-400 mb-1">Hall</label>
          <StyledSelect
            value={hallFilter}
            onChange={setHallFilter}
            options={[
              { value: ALL, label: "All halls" },
              ...hallOptions.map((h) => ({ value: h, label: hallLabel(h) })),
            ]}
          />
        </div>
        <div className="w-32">
          <label className="block text-[11px] text-ink-400 mb-1">Year</label>
          <StyledSelect
            value={yearFilter}
            onChange={setYearFilter}
            options={[{ value: ALL, label: "All years" }, ...yearOptions.map((y) => ({ value: y, label: y }))]}
          />
        </div>
        <div className="w-24">
          <label className="block text-[11px] text-ink-400 mb-1">Age</label>
          <StyledSelect
            value={ageFilter}
            onChange={setAgeFilter}
            options={[
              { value: ALL, label: "Any" },
              ...ageOptions.map((a) => ({ value: String(a), label: String(a) })),
            ]}
          />
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setMajorFilter(ALL);
              setHallFilter(ALL);
              setYearFilter(ALL);
              setAgeFilter(ALL);
            }}
            className="text-xs text-ink-400 hover:text-brass-400 transition-colors pb-2.5"
          >
            Clear filters
          </button>
        )}
      </div>

      <p className="text-xs text-ink-500 mb-3">
        {filtered.length} of {members.length} members
      </p>

      {filtered.length === 0 ? (
        <p className="text-sm text-ink-400">No one matches that search.</p>
      ) : (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          {filtered.map((m) => {
            const avatarColor = getMajorColor(m.major) ?? "#7f95a3";
            const nameColor = jobColor(m.characterJob as never) ?? undefined;
            return (
              <div key={m.id} className="bg-ink-900 border border-ink-700 rounded-lg overflow-hidden group">
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

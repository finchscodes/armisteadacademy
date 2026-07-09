"use client";

import { useActionState } from "react";
import { adminUpdateCharacterYearAction } from "@/actions/admin";

const YEAR_OPTIONS = [
  { value: "auto", label: "Auto (from lessons taken)" },
  { value: "1st Year", label: "1st Year" },
  { value: "2nd Year", label: "2nd Year" },
  { value: "3rd Year", label: "3rd Year" },
  { value: "4th Year", label: "4th Year" },
  { value: "5th Year", label: "5th Year" },
  { value: "Graduate", label: "Graduate" },
];

export function AdminYearEditor({
  characterId,
  userId,
  currentYearOverride,
}: {
  characterId: number;
  userId: number;
  currentYearOverride: string | null;
}) {
  const [state, formAction, pending] = useActionState(adminUpdateCharacterYearAction, undefined);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="characterId" value={characterId} />
      <input type="hidden" name="userId" value={userId} />
      <select
        name="yearOverride"
        defaultValue={currentYearOverride ?? "auto"}
        className="text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1 focus:outline-none focus:border-brass-500"
      >
        {YEAR_OPTIONS.map((y) => (
          <option key={y.value} value={y.value}>
            {y.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="text-xs bg-brass-500 text-ink-950 px-2 py-1 rounded font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
      >
        {pending ? "..." : "Set"}
      </button>
      {state?.error && <span className="text-xs text-claret-500">{state.error}</span>}
    </form>
  );
}

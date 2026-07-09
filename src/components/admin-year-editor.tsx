"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [value, setValue] = useState(currentYearOverride ?? "auto");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSet() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("characterId", String(characterId));
      formData.set("userId", String(userId));
      formData.set("yearOverride", value);
      const result = await adminUpdateCharacterYearAction(undefined, formData);
      if (result?.error) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1 focus:outline-none focus:border-brass-500"
      >
        {YEAR_OPTIONS.map((y) => (
          <option key={y.value} value={y.value}>
            {y.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleSet}
        disabled={pending}
        className="text-xs bg-brass-500 text-ink-950 px-2 py-1 rounded font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
      >
        {pending ? "..." : "Set"}
      </button>
      {error && <span className="text-xs text-claret-500">{error}</span>}
    </div>
  );
}

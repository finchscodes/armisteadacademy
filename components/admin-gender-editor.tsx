"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminUpdateCharacterGenderAction } from "@/actions/admin";
import { GENDER_OPTIONS } from "@/lib/character-options";

export function AdminGenderEditor({
  characterId,
  userId,
  currentGender,
}: {
  characterId: number;
  userId: number;
  currentGender: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(currentGender ?? GENDER_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSet() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("characterId", String(characterId));
      formData.set("userId", String(userId));
      formData.set("gender", value);
      const result = await adminUpdateCharacterGenderAction(undefined, formData);
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
        {GENDER_OPTIONS.map((g) => (
          <option key={g} value={g}>
            {g}
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

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminUpdateCharacterHallAction } from "@/actions/admin";
import { HALL_VALUES, hallLabel } from "@/lib/halls";

export function AdminHallEditor({
  characterId,
  userId,
  currentHall,
}: {
  characterId: number;
  userId: number;
  currentHall: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(currentHall ?? HALL_VALUES[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSet() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("characterId", String(characterId));
      formData.set("userId", String(userId));
      formData.set("hall", value);
      const result = await adminUpdateCharacterHallAction(undefined, formData);
      if (result?.error) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1 focus:outline-none focus:border-gunmetal-500"
      >
        {HALL_VALUES.map((h) => (
          <option key={h} value={h}>
            {hallLabel(h)}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleSet}
        disabled={pending}
        className="text-xs bg-gunmetal-500 text-ink-950 px-2 py-1 rounded font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
      >
        {pending ? "..." : "Set"}
      </button>
      {error && <span className="text-xs text-claret-500">{error}</span>}
    </div>
  );
}

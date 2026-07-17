"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminUpdateCharacterMajorAction } from "@/actions/admin";
import { MAJORS } from "@/lib/majors";

export function AdminMajorEditor({
  characterId,
  userId,
  currentMajor,
}: {
  characterId: number;
  userId: number;
  currentMajor: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(currentMajor);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSet() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("characterId", String(characterId));
      formData.set("userId", String(userId));
      formData.set("major", value);
      const result = await adminUpdateCharacterMajorAction(undefined, formData);
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
        {MAJORS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
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

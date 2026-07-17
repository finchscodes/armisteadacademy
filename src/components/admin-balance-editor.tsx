"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminAdjustCharacterBalanceAction } from "@/actions/admin";

export function AdminBalanceEditor({
  characterId,
  userId,
  currentBalance,
}: {
  characterId: number;
  userId: number;
  currentBalance: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(currentBalance));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSet() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("characterId", String(characterId));
      formData.set("userId", String(userId));
      formData.set("targetBalance", value);
      const result = await adminAdjustCharacterBalanceAction(undefined, formData);
      if (result?.error) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        max={1000000}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1 w-24 focus:outline-none focus:border-gunmetal-500"
      />
      <span className="text-xs text-ink-400">dollars</span>
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

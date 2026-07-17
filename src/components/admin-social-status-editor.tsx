"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminUpdateCharacterSocialStatusAction } from "@/actions/admin";
import { SOCIAL_STATUS_OPTIONS } from "@/lib/character-options";

export function AdminSocialStatusEditor({
  characterId,
  userId,
  currentSocialStatus,
}: {
  characterId: number;
  userId: number;
  currentSocialStatus: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(currentSocialStatus ?? SOCIAL_STATUS_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSet() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("characterId", String(characterId));
      formData.set("userId", String(userId));
      formData.set("socialStatus", value);
      const result = await adminUpdateCharacterSocialStatusAction(undefined, formData);
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
        {SOCIAL_STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
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

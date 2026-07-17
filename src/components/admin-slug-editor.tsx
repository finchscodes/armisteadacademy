"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminUpdateCharacterSlugAction } from "@/actions/admin";

export function AdminSlugEditor({
  characterId,
  userId,
  currentSlug,
}: {
  characterId: number;
  userId: number;
  currentSlug: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(currentSlug);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSet() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("characterId", String(characterId));
      formData.set("userId", String(userId));
      formData.set("slug", value);
      const result = await adminUpdateCharacterSlugAction(undefined, formData);
      if (result?.error) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ink-500">/c/</span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value.toLowerCase())}
        className="text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1 flex-1 min-w-0 focus:outline-none focus:border-gunmetal-500"
      />
      <button
        type="button"
        onClick={handleSet}
        disabled={pending}
        className="text-xs bg-gunmetal-500 text-ink-950 px-2 py-1 rounded font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60 shrink-0"
      >
        {pending ? "..." : "Set"}
      </button>
      {error && <span className="text-xs text-claret-500">{error}</span>}
    </div>
  );
}

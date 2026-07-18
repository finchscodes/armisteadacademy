"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminResetNeedsAction } from "@/actions/needs";

export function AdminNeedsReset({
  characterId,
  currentHunger,
  currentThirst,
}: {
  characterId: number;
  currentHunger: number;
  currentThirst: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleReset() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("characterId", String(characterId));
      await adminResetNeedsAction(formData);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ink-300">
        {currentHunger}% / {currentThirst}%
      </span>
      <button
        type="button"
        onClick={handleReset}
        disabled={pending}
        className="text-xs bg-ink-800 border border-ink-600 text-parchment-100 px-2 py-1 rounded-md hover:border-gunmetal-500/50 transition-colors disabled:opacity-60"
      >
        {pending ? "..." : "Reset to 100%"}
      </button>
    </div>
  );
}

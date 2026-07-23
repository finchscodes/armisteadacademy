"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminUpdateIgJobTitleAction } from "@/actions/admin";

export function AdminIgJobEditor({ characterId, igJobTitle }: { characterId: number; igJobTitle: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(igJobTitle ?? "");
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("characterId", String(characterId));
      formData.set("igJobTitle", value);
      await adminUpdateIgJobTitleAction(undefined, formData);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. Field Handler"
        className="flex-1 min-w-0 text-xs rounded-md border border-ink-600 bg-ink-800 px-2 py-1 focus:outline-none focus:border-gunmetal-500"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        className="text-xs bg-ink-800 border border-ink-600 text-parchment-100 px-2 py-1 rounded-md hover:border-gunmetal-500/50 transition-colors disabled:opacity-60"
      >
        {pending ? "..." : "Save"}
      </button>
    </div>
  );
}

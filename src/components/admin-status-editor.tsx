"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminAddCharacterStatusAction, adminRemoveCharacterStatusAction } from "@/actions/admin";

type StatusRow = { id: number; label: string };

export function AdminStatusEditor({
  characterId,
  userId,
  currentStatuses,
}: {
  characterId: number;
  userId: number;
  currentStatuses: StatusRow[];
}) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("characterId", String(characterId));
      formData.set("userId", String(userId));
      formData.set("label", label);
      const result = await adminAddCharacterStatusAction(undefined, formData);
      if (result?.error) setError(result.error);
      else setLabel("");
      router.refresh();
    });
  }

  function handleRemove(statusId: number) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("statusId", String(statusId));
      formData.set("userId", String(userId));
      await adminRemoveCharacterStatusAction(formData);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {currentStatuses.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {currentStatuses.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1.5 text-xs bg-ink-800 border border-ink-600 rounded-full pl-2.5 pr-1 py-1"
            >
              {s.label}
              <button
                type="button"
                onClick={() => handleRemove(s.id)}
                disabled={pending}
                className="w-4 h-4 rounded-full bg-ink-700 hover:bg-claret-600 text-parchment-100 flex items-center justify-center leading-none disabled:opacity-50"
                data-tooltip="Remove"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Site Founder"
          className="text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1 focus:outline-none focus:border-gunmetal-500 w-40"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={pending || !label.trim()}
          className="text-xs bg-gunmetal-500 text-ink-950 px-2 py-1 rounded font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
        >
          {pending ? "..." : "Add status"}
        </button>
      </div>
      {error && <span className="text-xs text-claret-500">{error}</span>}
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { adminUpdateCharacterAgeAction } from "@/actions/admin";
import { AGE_OPTIONS } from "@/lib/character-options";

export function AdminAgeEditor({
  characterId,
  userId,
  currentAge,
}: {
  characterId: number;
  userId: number;
  currentAge: number;
}) {
  const [state, formAction, pending] = useActionState(adminUpdateCharacterAgeAction, undefined);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="characterId" value={characterId} />
      <input type="hidden" name="userId" value={userId} />
      <select
        name="age"
        defaultValue={currentAge}
        className="text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1 focus:outline-none focus:border-brass-500"
      >
        {AGE_OPTIONS.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="text-xs bg-brass-500 text-ink-950 px-2 py-1 rounded font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
      >
        {pending ? "..." : "Set"}
      </button>
      {state?.error && <span className="text-xs text-claret-500">{state.error}</span>}
    </form>
  );
}

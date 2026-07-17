"use client";

import { useActionState } from "react";
import { updateHallBlurbAction } from "@/actions/admin";

export function HallBlurbForm({ hall, blurb }: { hall: string; blurb: string }) {
  const [state, formAction, pending] = useActionState(updateHallBlurbAction, undefined);

  return (
    <form action={formAction} className="space-y-2 bg-ink-900 border border-ink-700 rounded-lg p-4">
      <input type="hidden" name="hall" value={hall} />
      <label className="block text-xs font-medium text-ink-400" htmlFor={`blurb-${hall}`}>
        Hall blurb (admin only — not visible to the Resident Advisor)
      </label>
      <textarea
        id={`blurb-${hall}`}
        name="blurb"
        rows={4}
        defaultValue={blurb}
        placeholder="Lore/info about this hall itself — history, reputation, what it's known for."
        className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
      />
      {state?.error && <p className="text-xs text-claret-500">{state.error}</p>}
      {state?.success && <p className="text-xs text-gunmetal-400">{state.success}</p>}
      <button
        type="submit"
        disabled={pending}
        className="text-sm bg-ink-800 border border-ink-600 text-parchment-100 px-4 py-2 rounded-md hover:border-gunmetal-500/50 transition-colors disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save blurb"}
      </button>
    </form>
  );
}

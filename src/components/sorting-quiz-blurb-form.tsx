"use client";

import { useActionState } from "react";
import { updateSortingQuizBlurbAction } from "@/actions/admin";

export function SortingQuizBlurbForm({ blurb }: { blurb: string }) {
  const [state, formAction, pending] = useActionState(updateSortingQuizBlurbAction, undefined);

  return (
    <form action={formAction} className="space-y-2 bg-ink-900 border border-ink-700 rounded-lg p-4">
      <label className="block text-xs font-medium text-ink-400" htmlFor="sorting-quiz-blurb">
        Sorting quiz intro blurb — shown at the top of the quiz, before the questions
      </label>
      <textarea
        id="sorting-quiz-blurb"
        name="content"
        rows={4}
        defaultValue={blurb}
        placeholder="Set the scene before someone takes the quiz — how sorting works, what to expect, anything they should know first."
        className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500"
      />
      {state?.error && <p className="text-xs text-claret-500">{state.error}</p>}
      {state?.success && <p className="text-xs text-brass-400">{state.success}</p>}
      <button
        type="submit"
        disabled={pending}
        className="text-sm bg-ink-800 border border-ink-600 text-parchment-100 px-4 py-2 rounded-md hover:border-brass-500/50 transition-colors disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save blurb"}
      </button>
    </form>
  );
}

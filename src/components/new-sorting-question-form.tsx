"use client";

import { useActionState } from "react";
import { adminAddSortingQuestionAction } from "@/actions/admin";

export function NewSortingQuestionForm() {
  const [state, formAction, pending] = useActionState(adminAddSortingQuestionAction, undefined);

  return (
    <form action={formAction} className="flex gap-2 bg-ink-900 border border-ink-700 rounded-lg p-4">
      <input
        name="questionText"
        placeholder="e.g. When a plan falls apart, you..."
        required
        className="flex-1 text-sm bg-ink-800 border border-ink-600 rounded-md px-3 py-2 focus:outline-none focus:border-brass-500"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-sm bg-brass-500 text-ink-950 px-4 py-2 rounded-md font-medium hover:bg-brass-400 transition-colors disabled:opacity-60 shrink-0"
      >
        {pending ? "Adding..." : "Add question"}
      </button>
      {state?.error && <p className="text-xs text-claret-500 self-center ml-2">{state.error}</p>}
    </form>
  );
}

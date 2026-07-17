"use client";

import { useActionState } from "react";
import { submitHomeworkAction } from "@/actions/lessons";

export function SubmitHomeworkForm({ lessonId }: { lessonId: number }) {
  const [state, formAction, pending] = useActionState(submitHomeworkAction, undefined);

  return (
    <form action={formAction} className="space-y-3 bg-ink-900 border border-ink-700 rounded-lg p-5">
      <input type="hidden" name="lessonId" value={lessonId} />
      <label className="block text-sm font-medium" htmlFor="content">
        Your answer
      </label>
      <textarea
        id="content"
        name="content"
        required
        rows={8}
        className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-gunmetal-500"
      />
      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-gunmetal-500 text-ink-950 rounded-md px-5 py-2.5 font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Submitting..." : "Submit homework"}
      </button>
    </form>
  );
}

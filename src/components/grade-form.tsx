"use client";

import { useActionState } from "react";
import { gradeSubmissionAction } from "@/actions/lessons";

export function GradeForm({ submissionId }: { submissionId: number }) {
  const [state, formAction, pending] = useActionState(gradeSubmissionAction, undefined);

  return (
    <form action={formAction} className="space-y-3 mt-3 border-t border-ink-700 pt-3">
      <input type="hidden" name="submissionId" value={submissionId} />
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium" htmlFor={`grade-${submissionId}`}>
          Grade
        </label>
        <input
          id={`grade-${submissionId}`}
          name="grade"
          type="number"
          min={0}
          max={100}
          required
          defaultValue={80}
          className="w-20 rounded-md border border-ink-600 bg-ink-800 px-2 py-1 focus:outline-none focus:border-brass-500"
        />
        <span className="text-xs text-ink-400">/ 100</span>
      </div>
      <textarea
        name="feedback"
        placeholder="Feedback (optional)"
        rows={3}
        className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500"
      />
      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="text-sm bg-brass-500 text-ink-950 px-4 py-1.5 rounded-md font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Submitting grade..." : "Submit grade"}
      </button>
    </form>
  );
}

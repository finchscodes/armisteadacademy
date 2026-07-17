"use client";

import { useActionState } from "react";
import { instructorGradeSubmissionAction } from "@/actions/lessons";
import { GRADE_TIER_VALUES, tierLabel, type GradeTier } from "@/lib/grading";

export function InstructorGradeForm({
  submissionId,
  currentTier,
}: {
  submissionId: number;
  currentTier: GradeTier | null;
}) {
  const [state, formAction, pending] = useActionState(instructorGradeSubmissionAction, undefined);

  return (
    <form action={formAction} className="space-y-3 mt-3 border-t border-ink-700 pt-3">
      <input type="hidden" name="submissionId" value={submissionId} />
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor={`tier-${submissionId}`}>
          {currentTier ? "Change grade" : "Grade"}
        </label>
        <select
          id={`tier-${submissionId}`}
          name="tier"
          required
          defaultValue={currentTier ?? "good"}
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
        >
          {GRADE_TIER_VALUES.map((t) => (
            <option key={t} value={t}>
              {tierLabel(t)}
            </option>
          ))}
        </select>
      </div>
      <textarea
        name="feedback"
        placeholder="Feedback (optional)"
        rows={3}
        className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
      />
      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="text-sm bg-gunmetal-500 text-ink-950 px-4 py-1.5 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Saving..." : currentTier ? "Update grade" : "Finalize grade"}
      </button>
    </form>
  );
}

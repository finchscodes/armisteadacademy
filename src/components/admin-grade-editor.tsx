"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminUpdateSubmissionGradeAction } from "@/actions/admin";
import { GRADE_TIER_VALUES, tierLabel, type GradeTier } from "@/lib/grading";

export function AdminGradeEditor({
  submissionId,
  currentTier,
}: {
  submissionId: number;
  currentTier: GradeTier;
}) {
  const router = useRouter();
  const [tier, setTier] = useState<GradeTier>(currentTier);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSet() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("submissionId", String(submissionId));
      formData.set("tier", tier);
      const result = await adminUpdateSubmissionGradeAction(undefined, formData);
      if (result?.error) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={tier}
        onChange={(e) => setTier(e.target.value as GradeTier)}
        className="text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1 focus:outline-none focus:border-gunmetal-500"
      >
        {GRADE_TIER_VALUES.map((t) => (
          <option key={t} value={t}>
            {tierLabel(t)}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleSet}
        disabled={pending || tier === currentTier}
        className="text-xs bg-gunmetal-500 text-ink-950 px-2 py-1 rounded font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
      >
        {pending ? "..." : "Set"}
      </button>
      {error && <span className="text-xs text-claret-500">{error}</span>}
    </div>
  );
}

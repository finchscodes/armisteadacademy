"use client";

import { useTransition } from "react";
import { claimSubmissionAction } from "@/actions/lessons";

export function ClaimButton({ submissionId }: { submissionId: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => claimSubmissionAction(formData))}
    >
      <input type="hidden" name="submissionId" value={submissionId} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm bg-brass-500 text-ink-950 px-4 py-1.5 rounded-md font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Claiming..." : "Claim to grade"}
      </button>
    </form>
  );
}

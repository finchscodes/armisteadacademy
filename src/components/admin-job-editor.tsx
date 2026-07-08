"use client";

import { useActionState } from "react";
import { adminUpdateCharacterJobAction } from "@/actions/admin";
import { JOB_VALUES, jobLabel } from "@/lib/roles";

export function AdminJobEditor({
  characterId,
  userId,
  currentJob,
}: {
  characterId: number;
  userId: number;
  currentJob: string;
}) {
  const [state, formAction, pending] = useActionState(adminUpdateCharacterJobAction, undefined);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="characterId" value={characterId} />
      <input type="hidden" name="userId" value={userId} />
      <select
        name="job"
        defaultValue={currentJob}
        className="text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1 focus:outline-none focus:border-brass-500"
      >
        {JOB_VALUES.map((j) => (
          <option key={j} value={j}>
            {jobLabel(j)}
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

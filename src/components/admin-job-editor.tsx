"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminUpdateCharacterJobAction } from "@/actions/admin";
import { JOB_VALUES, jobLabel } from "@/lib/roles";

export function AdminJobEditor({
  characterId,
  userId,
  currentJob,
  currentJobTitle,
}: {
  characterId: number;
  userId: number;
  currentJob: string;
  currentJobTitle: string | null;
}) {
  const router = useRouter();
  const [job, setJob] = useState(currentJob);
  const [title, setTitle] = useState(currentJobTitle ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSet() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("characterId", String(characterId));
      formData.set("userId", String(userId));
      formData.set("job", job);
      formData.set("jobTitle", title);
      const result = await adminUpdateCharacterJobAction(undefined, formData);
      if (result?.error) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={job}
        onChange={(e) => setJob(e.target.value)}
        className="text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1 focus:outline-none focus:border-brass-500"
      >
        {JOB_VALUES.map((j) => (
          <option key={j} value={j}>
            {jobLabel(j)}
          </option>
        ))}
      </select>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Custom title (optional)"
        className="text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1 focus:outline-none focus:border-brass-500 w-40"
      />
      <button
        type="button"
        onClick={handleSet}
        disabled={pending}
        className="text-xs bg-brass-500 text-ink-950 px-2 py-1 rounded font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
      >
        {pending ? "..." : "Set"}
      </button>
      {error && <span className="text-xs text-claret-500">{error}</span>}
    </div>
  );
}

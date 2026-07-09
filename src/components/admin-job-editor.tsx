"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminAddCharacterJobAction, adminRemoveCharacterJobAction } from "@/actions/admin";
import { JOB_VALUES, jobLabel } from "@/lib/roles";

type JobRow = { id: number; job: string; jobTitle: string | null };

export function AdminJobEditor({
  characterId,
  userId,
  currentJobs,
}: {
  characterId: number;
  userId: number;
  currentJobs: JobRow[];
}) {
  const router = useRouter();
  const [job, setJob] = useState<string>(JOB_VALUES.find((j) => j !== "none") ?? "none");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("characterId", String(characterId));
      formData.set("userId", String(userId));
      formData.set("job", job);
      formData.set("jobTitle", title);
      const result = await adminAddCharacterJobAction(undefined, formData);
      if (result?.error) setError(result.error);
      else setTitle("");
      router.refresh();
    });
  }

  function handleRemove(jobRowId: number) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("jobRowId", String(jobRowId));
      formData.set("userId", String(userId));
      await adminRemoveCharacterJobAction(formData);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {currentJobs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {currentJobs.map((j) => (
            <span
              key={j.id}
              className="inline-flex items-center gap-1.5 text-xs bg-ink-800 border border-ink-600 rounded-full pl-2.5 pr-1 py-1"
            >
              {jobLabel(j.job as never)}
              {j.jobTitle && <span className="text-ink-400">&middot; {j.jobTitle}</span>}
              <button
                type="button"
                onClick={() => handleRemove(j.id)}
                disabled={pending}
                className="w-4 h-4 rounded-full bg-ink-700 hover:bg-claret-600 text-parchment-100 flex items-center justify-center leading-none disabled:opacity-50"
                title="Remove"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={job}
          onChange={(e) => setJob(e.target.value)}
          className="text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1 focus:outline-none focus:border-brass-500"
        >
          {JOB_VALUES.filter((j) => j !== "none").map((j) => (
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
          onClick={handleAdd}
          disabled={pending}
          className="text-xs bg-brass-500 text-ink-950 px-2 py-1 rounded font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
        >
          {pending ? "..." : "Add job"}
        </button>
      </div>
      {error && <span className="text-xs text-claret-500">{error}</span>}
    </div>
  );
}

"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { adminAddCharacterJobAction, adminRemoveCharacterJobAction } from "@/actions/admin";
import { JOB_VALUES, jobLabel } from "@/lib/roles";

type JobRow = { id: number; job: string; jobTitle: string | null; scopeBoardId: number | null; scopeBoardName: string | null };
type BoardOption = { id: number; name: string; kind: string; restrictedToHall: string | null };

// Which jobs are tied to one specific board, and which board kind qualifies.
const SCOPE_RULES: Record<string, { boardKind: string; hallOnly?: boolean }> = {
  writer: { boardKind: "article" },
  instructor: { boardKind: "class" },
  assistant_instructor: { boardKind: "class" },
  field_agent: { boardKind: "article", hallOnly: true },
};

export function AdminJobEditor({
  characterId,
  userId,
  currentJobs,
  boards,
}: {
  characterId: number;
  userId: number;
  currentJobs: JobRow[];
  boards: BoardOption[];
}) {
  const router = useRouter();
  const [job, setJob] = useState<string>(JOB_VALUES.find((j) => j !== "none") ?? "none");
  const [scopeBoardId, setScopeBoardId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const scopeRule = SCOPE_RULES[job];
  const scopeOptions = useMemo(() => {
    if (!scopeRule) return [];
    return boards.filter((b) => b.kind === scopeRule.boardKind && (!scopeRule.hallOnly || b.restrictedToHall));
  }, [boards, scopeRule]);

  function handleJobChange(nextJob: string) {
    setJob(nextJob);
    setScopeBoardId("");
    setTitleTouched(false);
    setTitle("");
  }

  function handleScopeChange(nextScopeBoardId: string) {
    setScopeBoardId(nextScopeBoardId);
    if (titleTouched) return;
    const board = scopeOptions.find((b) => String(b.id) === nextScopeBoardId);
    setTitle(board ? `${jobLabel(job as never)} of ${board.name}` : "");
  }

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("characterId", String(characterId));
      formData.set("userId", String(userId));
      formData.set("job", job);
      formData.set("jobTitle", title);
      if (scopeBoardId) formData.set("scopeBoardId", scopeBoardId);
      const result = await adminAddCharacterJobAction(undefined, formData);
      if (result?.error) setError(result.error);
      else {
        setTitle("");
        setScopeBoardId("");
        setTitleTouched(false);
      }
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
              {j.scopeBoardName && <span className="text-brass-400">&middot; {j.scopeBoardName}</span>}
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
          onChange={(e) => handleJobChange(e.target.value)}
          className="text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1 focus:outline-none focus:border-brass-500"
        >
          {JOB_VALUES.filter((j) => j !== "none").map((j) => (
            <option key={j} value={j}>
              {jobLabel(j)}
            </option>
          ))}
        </select>
        {scopeRule && (
          <select
            value={scopeBoardId}
            onChange={(e) => handleScopeChange(e.target.value)}
            className="text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1 focus:outline-none focus:border-brass-500"
          >
            <option value="">
              {scopeRule.hallOnly ? "Which hall?" : scopeRule.boardKind === "class" ? "Which class?" : "Which board?"}
            </option>
            {scopeOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setTitleTouched(true);
          }}
          placeholder="Custom title (optional)"
          className="text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1 focus:outline-none focus:border-brass-500 w-40"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={pending || (!!scopeRule && !scopeBoardId)}
          className="text-xs bg-brass-500 text-ink-950 px-2 py-1 rounded font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
        >
          {pending ? "..." : "Add job"}
        </button>
      </div>
      {scopeRule && !scopeBoardId && (
        <p className="text-[11px] text-ink-400">
          {jobLabel(job as never)} needs a specific {scopeRule.hallOnly ? "hall" : scopeRule.boardKind} to grant
          access to.
        </p>
      )}
      {error && <span className="text-xs text-claret-500">{error}</span>}
    </div>
  );
}

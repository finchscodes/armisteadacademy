"use client";

import { useActionState } from "react";
import { grantArticlePermissionAction, revokeArticlePermissionAction } from "@/actions/admin";

type Granted = { id: number; characterFirstName: string; characterLastName: string };

export function ArticleBoardPermissionCard({
  boardId,
  boardName,
  granted,
}: {
  boardId: number;
  boardName: string;
  granted: Granted[];
}) {
  const [state, formAction, pending] = useActionState(grantArticlePermissionAction, undefined);

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg p-4">
      <h3 className="font-display text-parchment-100 mb-2">{boardName}</h3>
      <p className="text-xs text-ink-400 mb-3">
        Head Staff and up can always post here. Grant posting rights to anyone else below.
      </p>

      {granted.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-3">
          {granted.map((g) => (
            <span
              key={g.id}
              className="inline-flex items-center gap-1.5 text-xs bg-ink-800 border border-ink-600 rounded-full pl-2.5 pr-1 py-1"
            >
              {g.characterFirstName} {g.characterLastName}
              <form action={revokeArticlePermissionAction} className="inline">
                <input type="hidden" name="grantId" value={g.id} />
                <button
                  type="submit"
                  className="w-4 h-4 rounded-full bg-ink-700 hover:bg-claret-600 text-parchment-100 flex items-center justify-center leading-none"
                  title="Revoke"
                >
                  &times;
                </button>
              </form>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-ink-400 mb-3">No extra grants — management only, so far.</p>
      )}

      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="boardId" value={boardId} />
        <input
          name="firstName"
          placeholder="First name"
          required
          className="flex-1 min-w-0 text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1.5 focus:outline-none focus:border-brass-500"
        />
        <input
          name="lastName"
          placeholder="Last name"
          required
          className="flex-1 min-w-0 text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1.5 focus:outline-none focus:border-brass-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="text-xs bg-brass-500 text-ink-950 px-3 py-1.5 rounded font-medium hover:bg-brass-400 transition-colors disabled:opacity-60 shrink-0"
        >
          {pending ? "..." : "Grant"}
        </button>
      </form>
      <p className="text-[10px] text-ink-400 mt-1">By legal name, not code name.</p>
      {state?.error && <p className="text-xs text-claret-500 mt-1">{state.error}</p>}
      {state?.success && <p className="text-xs text-brass-400 mt-1">{state.success}</p>}
    </div>
  );
}

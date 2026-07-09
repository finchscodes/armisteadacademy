"use client";

import { useActionState } from "react";
import { assignClassAction, unassignClassAction } from "@/actions/admin";

type Assigned = { id: number; characterFirstName: string; characterLastName: string; characterSlug: string };

export function ClassAssignmentCard({
  boardId,
  boardName,
  assigned,
}: {
  boardId: number;
  boardName: string;
  assigned: Assigned[];
}) {
  const [state, formAction, pending] = useActionState(assignClassAction, undefined);

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg p-4">
      <h3 className="font-display text-parchment-100 mb-2">{boardName}</h3>

      {assigned.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-3">
          {assigned.map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center gap-1.5 text-xs bg-ink-800 border border-ink-600 rounded-full pl-2.5 pr-1 py-1"
            >
              {a.characterFirstName} {a.characterLastName}
              <form action={unassignClassAction} className="inline">
                <input type="hidden" name="assignmentId" value={a.id} />
                <button
                  type="submit"
                  className="w-4 h-4 rounded-full bg-ink-700 hover:bg-claret-600 text-parchment-100 flex items-center justify-center leading-none"
                  title="Remove"
                >
                  &times;
                </button>
              </form>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-ink-400 mb-3">No instructors assigned.</p>
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
          {pending ? "..." : "Assign"}
        </button>
      </form>
      <p className="text-[10px] text-ink-400 mt-1">By legal name, not code name.</p>
      {state?.error && <p className="text-xs text-claret-500 mt-1">{state.error}</p>}
      {state?.success && <p className="text-xs text-brass-400 mt-1">{state.success}</p>}
    </div>
  );
}

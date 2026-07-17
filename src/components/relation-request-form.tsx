"use client";

import { useActionState } from "react";
import { sendRelationRequestAction } from "@/actions/relations";
import { RELATION_TYPES, relationLabel } from "@/lib/relations";

export function RelationRequestForm() {
  const [state, formAction, pending] = useActionState(sendRelationRequestAction, undefined);

  return (
    <form action={formAction} className="bg-ink-900 border border-ink-700 rounded-lg p-4 space-y-3">
      <p className="text-sm font-medium text-parchment-100">Send a relation request</p>
      <div className="flex flex-wrap gap-2">
        <input
          name="toFirstName"
          placeholder="Their first name"
          required
          className="flex-1 min-w-[8rem] text-sm bg-ink-800 border border-ink-600 rounded-md px-3 py-2 focus:outline-none focus:border-gunmetal-500"
        />
        <input
          name="toLastName"
          placeholder="Their last name"
          required
          className="flex-1 min-w-[8rem] text-sm bg-ink-800 border border-ink-600 rounded-md px-3 py-2 focus:outline-none focus:border-gunmetal-500"
        />
        <select
          name="relationType"
          required
          className="text-sm bg-ink-800 border border-ink-600 rounded-md px-3 py-2 focus:outline-none focus:border-gunmetal-500"
        >
          {RELATION_TYPES.map((t) => (
            <option key={t} value={t}>
              {relationLabel(t)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="text-sm bg-gunmetal-500 text-ink-950 px-4 py-2 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
        >
          {pending ? "Sending..." : "Send"}
        </button>
      </div>
      <p className="text-[11px] text-ink-400">
        Pick the type from your side — e.g. pick &quot;Parent of&quot; if you&apos;re the parent;
        they&apos;ll see it as &quot;Child of&quot; you.
      </p>
      {state?.error && <p className="text-xs text-claret-500">{state.error}</p>}
      {state?.success && <p className="text-xs text-gunmetal-400">{state.success}</p>}
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { createThreadAction } from "@/actions/forum";

export function NewThreadForm({ boardSlug }: { boardSlug: string }) {
  const [state, formAction, pending] = useActionState(createThreadAction, undefined);

  return (
    <form action={formAction} className="space-y-4 bg-ink-900 border border-ink-700 rounded-lg p-6">
      <input type="hidden" name="boardSlug" value={boardSlug} />

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="title">
          Thread title
        </label>
        <input
          id="title"
          name="title"
          required
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="content">
          Opening post
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={10}
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
        />
      </div>

      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-brass-500 text-ink-950 rounded-md px-5 py-2.5 font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Posting..." : "Post thread"}
      </button>
    </form>
  );
}

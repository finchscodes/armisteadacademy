"use client";

import { useActionState } from "react";
import { createPostAction } from "@/actions/forum";

export function ReplyForm({ threadSlug }: { threadSlug: string }) {
  const [state, formAction, pending] = useActionState(createPostAction, undefined);

  return (
    <form action={formAction} className="space-y-3 bg-ink-900 border border-ink-700 rounded-lg p-5">
      <input type="hidden" name="threadSlug" value={threadSlug} />
      <label className="block text-sm font-medium" htmlFor="content">
        Reply
      </label>
      <textarea
        id="content"
        name="content"
        required
        rows={6}
        className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
      />
      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-brass-500 text-ink-950 rounded-md px-5 py-2.5 font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Posting..." : "Post reply"}
      </button>
    </form>
  );
}

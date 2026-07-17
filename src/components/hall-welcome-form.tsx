"use client";

import { useActionState } from "react";
import { updateHallWelcomeAction } from "@/actions/admin";
import { RichTextEditor } from "@/components/rich-text-editor";

export function HallWelcomeForm({
  hall,
  title,
  content,
  characterId,
}: {
  hall: string;
  title: string;
  content: string;
  characterId: number | null;
}) {
  const [state, formAction, pending] = useActionState(updateHallWelcomeAction, undefined);

  return (
    <form action={formAction} className="space-y-3 bg-ink-900 border border-ink-700 rounded-lg p-4">
      <input type="hidden" name="hall" value={hall} />
      {characterId && <input type="hidden" name="characterId" value={characterId} />}

      <div>
        <label className="block text-xs font-medium mb-1" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          defaultValue={title}
          required
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Message</label>
        <RichTextEditor name="content" initialValue={content} />
      </div>
      {state?.error && <p className="text-xs text-claret-500">{state.error}</p>}
      {state?.success && <p className="text-xs text-gunmetal-400">{state.success}</p>}
      <button
        type="submit"
        disabled={pending}
        className="text-sm bg-gunmetal-500 text-ink-950 px-4 py-2 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}

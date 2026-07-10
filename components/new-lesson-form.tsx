"use client";

import { useActionState } from "react";
import { createLessonAction } from "@/actions/lessons";
import { RichTextEditor } from "@/components/rich-text-editor";

export function NewLessonForm({ boardSlug }: { boardSlug: string }) {
  const [state, formAction, pending] = useActionState(createLessonAction, undefined);

  return (
    <form action={formAction} className="space-y-4 bg-ink-900 border border-ink-700 rounded-lg p-6">
      <input type="hidden" name="boardSlug" value={boardSlug} />

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="title">
          Lesson title
        </label>
        <input
          id="title"
          name="title"
          required
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Assignment prompt</label>
        <RichTextEditor name="prompt" placeholder="Write the assignment..." />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="rewardMin">
            Min reward
          </label>
          <input
            id="rewardMin"
            name="rewardMin"
            type="number"
            min={0}
            defaultValue={10}
            required
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="rewardMax">
            Max reward
          </label>
          <input
            id="rewardMax"
            name="rewardMax"
            type="number"
            min={0}
            defaultValue={25}
            required
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="graderFee">
            Grader fee
          </label>
          <input
            id="graderFee"
            name="graderFee"
            type="number"
            min={0}
            defaultValue={5}
            required
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
          />
        </div>
      </div>

      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-brass-500 text-ink-950 rounded-md px-5 py-2.5 font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Posting..." : "Post lesson"}
      </button>
    </form>
  );
}

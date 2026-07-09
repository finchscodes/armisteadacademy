"use client";

import { useActionState } from "react";
import { updateLessonAction } from "@/actions/lessons";

export function EditLessonForm({
  lessonId,
  title,
  prompt,
  rewardMin,
  rewardMax,
  graderFee,
}: {
  lessonId: number;
  title: string;
  prompt: string;
  rewardMin: number;
  rewardMax: number;
  graderFee: number;
}) {
  const [state, formAction, pending] = useActionState(updateLessonAction, undefined);

  return (
    <form action={formAction} className="space-y-4 bg-ink-900 border border-ink-700 rounded-lg p-6">
      <input type="hidden" name="lessonId" value={lessonId} />

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="title">
          Lesson title
        </label>
        <input
          id="title"
          name="title"
          defaultValue={title}
          required
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="prompt">
          Assignment prompt
        </label>
        <textarea
          id="prompt"
          name="prompt"
          defaultValue={prompt}
          required
          rows={8}
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
        />
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
            defaultValue={rewardMin}
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
            defaultValue={rewardMax}
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
            defaultValue={graderFee}
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
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}

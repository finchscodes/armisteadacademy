"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createThreadAction } from "@/actions/forum";
import { RichTextEditor } from "@/components/rich-text-editor";

export function NewThreadForm({ boardSlug }: { boardSlug: string }) {
  const [state, formAction, pending] = useActionState(createThreadAction, undefined);
  const [showDetails, setShowDetails] = useState(false);

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
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="text-xs text-brass-400 hover:underline"
        >
          {showDetails ? "− Hide scene details" : "+ Add scene details (location, time, surroundings)"}
        </button>
      </div>

      {showDetails && (
        <div className="space-y-3 border border-ink-700 rounded-lg p-4 bg-ink-800/40">
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="location">
              Location
            </label>
            <input
              id="location"
              name="location"
              placeholder="e.g. The Dining Hall"
              className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="timeSetting">
              Time
            </label>
            <input
              id="timeSetting"
              name="timeSetting"
              placeholder="e.g. Late evening, a week after midterms"
              className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="surroundings">
              Surroundings
            </label>
            <textarea
              id="surroundings"
              name="surroundings"
              rows={3}
              placeholder="Weather, mood, who's around, anything setting the scene"
              className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Opening post</label>
        <RichTextEditor name="content" />
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

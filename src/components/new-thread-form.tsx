"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createThreadAction } from "@/actions/forum";
import { RichTextEditor } from "@/components/rich-text-editor";
import { PhoneMessageComposer } from "@/components/phone-message-composer";
import { RATING_VALUES, RATING_META } from "@/lib/thread-rating";

export function NewThreadForm({
  boardSlug,
  isArticle = false,
  isPhone = false,
}: {
  boardSlug: string;
  isArticle?: boolean;
  isPhone?: boolean;
}) {
  const [state, formAction, pending] = useActionState(createThreadAction, undefined);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <form action={formAction} className="space-y-4 bg-ink-900 border border-ink-700 rounded-lg p-6">
      <input type="hidden" name="boardSlug" value={boardSlug} />

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="title">
          {isArticle ? "Article title" : isPhone ? "Conversation title" : "Thread title"}
        </label>
        <input
          id="title"
          name="title"
          required
          placeholder={isPhone ? "e.g. Texts with Celeste" : undefined}
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
        />
      </div>

      {!isArticle && !isPhone && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="rating">
              Rating
            </label>
            <select
              id="rating"
              name="rating"
              defaultValue={RATING_VALUES[0]}
              required
              className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500"
            >
              {RATING_VALUES.map((r) => (
                <option key={r} value={r}>
                  {RATING_META[r].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="text-xs text-brass-400 hover:underline"
            >
              {showDetails ? "− Hide details" : "+ Add details (location, time, surroundings)"}
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
              <div>
                <label className="block text-xs font-medium mb-1" htmlFor="ooc">
                  OOC notes
                </label>
                <textarea
                  id="ooc"
                  name="ooc"
                  rows={2}
                  placeholder="Anything out-of-character — triggers, pacing, plotting notes, etc."
                  className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500"
                />
              </div>
            </div>
          )}
        </>
      )}

      {isArticle && (
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="scheduledFor">
            Publish
          </label>
          <input
            id="scheduledFor"
            name="scheduledFor"
            type="datetime-local"
            className="rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500"
          />
          <p className="text-[11px] text-ink-400 mt-1">
            Leave blank to publish immediately, or pick a future date/time to schedule it — it
            stays hidden from everyone but management until then.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          {isArticle ? "Article body" : isPhone ? "First message" : "Opening post"}
        </label>
        {isPhone ? <PhoneMessageComposer /> : <RichTextEditor name="content" />}
      </div>

      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-brass-500 text-ink-950 rounded-md px-5 py-2.5 font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Posting..." : isArticle ? "Post article" : isPhone ? "Start conversation" : "Post thread"}
      </button>
    </form>
  );
}

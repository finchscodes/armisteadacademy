"use client";

import { useState, useActionState } from "react";
import { createPostAction } from "@/actions/forum";
import { RichTextEditor } from "@/components/rich-text-editor";
import { RollModifierInput } from "@/components/roll-modifier-input";

export function ReplyForm({ threadSlug }: { threadSlug: string }) {
  const [state, formAction, pending] = useActionState(createPostAction, undefined);
  const [showOoc, setShowOoc] = useState(false);
  const [showRoll, setShowRoll] = useState(false);

  return (
    <form action={formAction} className="space-y-3 bg-ink-900 border border-ink-700 rounded-lg p-5">
      <input type="hidden" name="threadSlug" value={threadSlug} />
      <label className="block text-sm font-medium">Reply</label>
      <RichTextEditor name="content" placeholder="Write your reply..." />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowOoc((v) => !v)}
          className="text-xs text-gunmetal-400 hover:underline"
        >
          {showOoc ? "− Hide OOC" : "+ Add OOC"}
        </button>
        <button
          type="button"
          onClick={() => setShowRoll((v) => !v)}
          className="text-xs text-gunmetal-400 hover:underline"
        >
          {showRoll ? "− Remove roll" : "+ Add a roll (1d10)"}
        </button>
      </div>

      {showOoc && (
        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="ooc">
            OOC notes
          </label>
          <textarea
            id="ooc"
            name="ooc"
            rows={2}
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
          />
        </div>
      )}

      {showRoll && (
        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="rollModifier">
            Roll modifier
          </label>
          <div className="flex items-center gap-2">
            <RollModifierInput />
            <p className="text-[11px] text-ink-400">
              The die (1d10) is rolled automatically when you post — this is just your bonus or
              penalty.
            </p>
          </div>
        </div>
      )}

      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-gunmetal-500 text-ink-950 rounded-md px-5 py-2.5 font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Posting..." : "Post reply"}
      </button>
    </form>
  );
}

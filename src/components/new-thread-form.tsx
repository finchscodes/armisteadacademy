"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createThreadAction } from "@/actions/forum";
import { RichTextEditor } from "@/components/rich-text-editor";
import { PhoneMessageComposer } from "@/components/phone-message-composer";
import { EmailComposerFields } from "@/components/email-composer-fields";
import { RollModifierInput } from "@/components/roll-modifier-input";
import { RATING_VALUES, RATING_META } from "@/lib/thread-rating";

export function NewThreadForm({
  boardSlug,
  isArticle = false,
  isPhone = false,
  isEmail = false,
  isSocial = false,
}: {
  boardSlug: string;
  isArticle?: boolean;
  isPhone?: boolean;
  isEmail?: boolean;
  isSocial?: boolean;
}) {
  const [state, formAction, pending] = useActionState(createThreadAction, undefined);
  const [showDetails, setShowDetails] = useState(false);
  const [showRoll, setShowRoll] = useState(false);

  return (
    <form action={formAction} className="space-y-4 bg-ink-900 border border-ink-700 rounded-lg p-6">
      <input type="hidden" name="boardSlug" value={boardSlug} />

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="title">
          {isArticle
            ? "Article title"
            : isPhone
              ? "Conversation title"
              : isEmail
                ? "Title (for the topic list)"
                : isSocial
                  ? "Handle"
                  : "Thread title"}
        </label>
        <input
          id="title"
          name="title"
          required
          placeholder={isPhone ? "e.g. Texts with Celeste" : isEmail ? "e.g. Check In" : isSocial ? "e.g. @codename" : undefined}
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-gunmetal-500"
        />
      </div>

      {!isArticle && !isEmail && !isSocial && (
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="rating">
            Rating
          </label>
          <select
            id="rating"
            name="rating"
            defaultValue={RATING_VALUES[0]}
            required
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
          >
            {RATING_VALUES.map((r) => (
              <option key={r} value={r}>
                {RATING_META[r].label}
              </option>
            ))}
          </select>
        </div>
      )}

      {!isArticle && !isPhone && !isEmail && !isSocial && (
        <>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="text-xs text-gunmetal-400 hover:underline"
            >
              {showDetails ? "− Hide details" : "+ Add details (location, time, surroundings)"}
            </button>
            <button
              type="button"
              onClick={() => setShowRoll((v) => !v)}
              className="text-xs text-gunmetal-400 hover:underline"
            >
              {showRoll ? "− Remove roll" : "+ Add a roll (1d10)"}
            </button>
          </div>

          {showRoll && (
            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="rollModifier">
                Roll modifier
              </label>
              <div className="flex items-center gap-2">
                <RollModifierInput />
                <p className="text-[11px] text-ink-400">
                  The die (1d10) is rolled automatically when you post — this is just your bonus
                  or penalty.
                </p>
              </div>
            </div>
          )}

          {showDetails && (
            <div className="space-y-3 border border-ink-700 rounded-lg p-4 bg-ink-800/40">
              <div>
                <label className="block text-xs font-medium mb-1" htmlFor="location">
                  Location
                </label>
                <input
                  id="location"
                  name="location"
                  className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" htmlFor="timeSetting">
                  Time
                </label>
                <input
                  id="timeSetting"
                  name="timeSetting"
                  className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
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
                  className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
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
                  className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
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
            className="rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
          />
          <p className="text-[11px] text-ink-400 mt-1">
            Leave blank to publish immediately, or pick a future date/time to schedule it — it
            stays hidden from everyone but management until then.
          </p>
        </div>
      )}

      {isEmail ? (
        <EmailComposerFields />
      ) : (
        <div>
          <label className="block text-sm font-medium mb-1">
            {isArticle ? "Article body" : isPhone ? "First message" : isSocial ? "Bio / description" : "Opening post"}
          </label>
          {isPhone ? <PhoneMessageComposer /> : <RichTextEditor name="content" placeholder={isSocial ? "Optional" : undefined} />}
        </div>
      )}

      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-gunmetal-500 text-ink-950 rounded-md px-5 py-2.5 font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
      >
        {pending
          ? "Posting..."
          : isArticle
            ? "Post article"
            : isPhone
              ? "Start conversation"
              : isEmail
                ? "Send"
                : "Post thread"}
      </button>
    </form>
  );
}

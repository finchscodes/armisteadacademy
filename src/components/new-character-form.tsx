"use client";

import { useActionState, useState } from "react";
import { createCharacterAction } from "@/actions/characters";
import { MajorSelect } from "@/components/major-select";
import { FaceclaimUpload } from "@/components/faceclaim-upload";
import { AGE_OPTIONS, DEFAULT_AGE, GENDER_OPTIONS, SOCIAL_STATUS_OPTIONS } from "@/lib/character-options";
import { HALL_VALUES, hallLabel, HALL_META } from "@/lib/halls";
import { RichTextEditor } from "@/components/rich-text-editor";

type Question = { id: number; questionText: string; answers: { id: number; answerText: string; hall: string }[] };

export function NewCharacterForm({ questions }: { questions: Question[] }) {
  const [state, formAction, pending] = useActionState(createCharacterAction, undefined);
  const [hallMode, setHallMode] = useState<"direct" | "quiz">("direct");
  const quizUsable = questions.length > 0 && questions.every((q) => q.answers.length > 0);

  return (
    <form action={formAction} className="space-y-4 bg-ink-900 border border-ink-700 rounded-lg p-6">
      <div className="border border-ink-700 rounded-lg p-4 bg-ink-800/40">
        <p className="text-xs uppercase tracking-wider text-ink-400 mb-3">
          Legal name, age, gender &amp; social status — set once, cannot be changed later
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="firstName">
              First
            </label>
            <input
              id="firstName"
              name="firstName"
              required
              className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="middleName">
              Middle
            </label>
            <input
              id="middleName"
              name="middleName"
              placeholder="Optional"
              className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="lastName">
              Last
            </label>
            <input
              id="lastName"
              name="lastName"
              required
              className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="age">
              Age
            </label>
            <select
              id="age"
              name="age"
              defaultValue={DEFAULT_AGE}
              className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
            >
              {AGE_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="gender">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              defaultValue={GENDER_OPTIONS[0]}
              className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
            >
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-xs font-medium mb-1" htmlFor="socialStatus">
            Social status
          </label>
          <select
            id="socialStatus"
            name="socialStatus"
            defaultValue={SOCIAL_STATUS_OPTIONS[0]}
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
          >
            {SOCIAL_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border border-ink-700 rounded-lg p-4 bg-ink-800/40">
        <p className="text-xs uppercase tracking-wider text-ink-400 mb-3">
          Hall — set once, admin can change it later
        </p>
        <div className="flex gap-4 mb-3 text-sm">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={hallMode === "direct"}
              onChange={() => setHallMode("direct")}
            />
            Choose directly
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={hallMode === "quiz"}
              onChange={() => setHallMode("quiz")}
              disabled={!quizUsable}
            />
            Take the sorting quiz{!quizUsable && " (not set up yet)"}
          </label>
        </div>

        <input type="hidden" name="hallMode" value={hallMode} />

        {hallMode === "direct" ? (
          <div className="grid grid-cols-2 gap-2">
            {HALL_VALUES.map((h) => (
              <label
                key={h}
                className="flex items-start gap-2 text-sm border border-ink-600 rounded-md px-3 py-2 cursor-pointer hover:border-gunmetal-500/50"
              >
                <input type="radio" name="hall" value={h} defaultChecked={h === HALL_VALUES[0]} className="mt-0.5" />
                <span className="font-medium" style={{ color: HALL_META[h].color }}>
                  {hallLabel(h)}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div className="text-sm text-ink-200 bg-ink-900/60 border border-ink-700 rounded-md px-3 py-3">
            You&apos;ll take the sorting quiz right after you enroll. Your hall shows as{" "}
            <span className="text-gunmetal-400">Pending</span> until then — you can still chat and
            explore Armistead in the meantime.
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="name">
          Code name
        </label>
        <input
          id="name"
          name="name"
          required
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-gunmetal-500"
        />
        <p className="text-[11px] text-ink-400 mt-1">
          This one you can change later, along with your faceclaim.
        </p>
      </div>

      <FaceclaimUpload name="avatarUrl" />

      <MajorSelect />

      <div>
        <label className="block text-sm font-medium mb-1">Bio / Transcript</label>
        <RichTextEditor name="bio" placeholder="Optional — this shows on your character's public profile" />
      </div>

      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-gunmetal-500 text-ink-950 rounded-md py-2.5 font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Creating..." : "Create character"}
      </button>
    </form>
  );
}

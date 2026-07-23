"use client";

import { useActionState } from "react";
import { chooseMajorAction } from "@/actions/characters";
import { SELECTABLE_MAJORS } from "@/lib/majors";

export function MajorChoiceGate({ characterId, characterName }: { characterId: number; characterName: string }) {
  const [state, formAction, pending] = useActionState(chooseMajorAction, undefined);

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="font-display text-3xl text-gunmetal-400 mb-2">Choose a major</h1>
      <p className="text-sm text-ink-400 mb-6">
        {characterName} is now a 2nd year and needs to declare a major before continuing.
      </p>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="characterId" value={characterId} />
        <div className="grid sm:grid-cols-2 gap-3">
          {SELECTABLE_MAJORS.map((m) => (
            <label
              key={m.value}
              className="flex items-start gap-3 bg-ink-900 border border-ink-700 rounded-lg p-4 cursor-pointer hover:border-gunmetal-500/50 transition-colors has-[:checked]:border-gunmetal-500"
            >
              <input type="radio" name="major" value={m.value} required className="mt-1" />
              <div>
                <p className="text-sm font-medium" style={{ color: m.color }}>
                  {m.label}
                </p>
                <p className="text-xs text-ink-400 mt-0.5">{m.description}</p>
              </div>
            </label>
          ))}
        </div>

        {state?.error && <p className="text-sm text-claret-500">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="bg-gunmetal-500 text-ink-950 rounded-md px-5 py-2.5 font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
        >
          {pending ? "Saving..." : "Confirm major"}
        </button>
      </form>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { adoptPetAction } from "@/actions/pets";

const SUGGESTED_SPECIES = [
  "Owl",
  "Cat",
  "Toad",
  "Rat",
  "Raven",
  "Ferret",
  "Rabbit",
  "Snake",
  "Fox",
];

export default function NewPetPage() {
  const [state, formAction, pending] = useActionState(adoptPetAction, undefined);

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display text-3xl text-brass-400 mb-1">Adopt a pet</h1>
      <p className="text-ink-400 text-sm mb-6">Give it a name and a bit of character.</p>

      <form action={formAction} className="space-y-4 bg-ink-900 border border-ink-700 rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="species">
            Species
          </label>
          <input
            id="species"
            name="species"
            required
            list="species-suggestions"
            placeholder="e.g. Owl, or type your own"
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
          />
          <datalist id="species-suggestions">
            {SUGGESTED_SPECIES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="bio">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            placeholder="Optional"
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
          />
        </div>

        {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-brass-500 text-ink-950 rounded-md py-2.5 font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
        >
          {pending ? "Adopting..." : "Adopt"}
        </button>
      </form>
    </div>
  );
}

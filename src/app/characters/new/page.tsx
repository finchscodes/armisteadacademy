"use client";

import { useActionState } from "react";
import { createCharacterAction } from "@/actions/characters";

export default function NewCharacterPage() {
  const [state, formAction, pending] = useActionState(createCharacterAction, undefined);

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display text-3xl text-brass-400 mb-1">Create a character</h1>
      <p className="text-ink-400 text-sm mb-6">
        You can create more later. Each character has its own threads, posts, and galleon
        balance.
      </p>

      <form action={formAction} className="space-y-4 bg-ink-900 border border-ink-700 rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">
            Character name
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="house">
              House / Faction
            </label>
            <input
              id="house"
              name="house"
              placeholder="Optional"
              className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="yearOrRole">
              Year / Role
            </label>
            <input
              id="yearOrRole"
              name="yearOrRole"
              placeholder="e.g. 3rd Year, Professor"
              className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="faceclaim">
            Faceclaim
          </label>
          <input
            id="faceclaim"
            name="faceclaim"
            placeholder="Optional"
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="bio">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={5}
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
          {pending ? "Creating..." : "Create character"}
        </button>
      </form>
    </div>
  );
}

"use client";

import { useActionState, useTransition } from "react";
import { adminAddSpotlightAction, adminRemoveSpotlightAction } from "@/actions/admin";

type Entry = {
  id: number;
  blurb: string;
  characterFirstName: string;
  characterLastName: string;
};

export function SpotlightForm({ entries }: { entries: Entry[] }) {
  const [state, formAction, pending] = useActionState(adminAddSpotlightAction, undefined);
  const [removePending, startRemove] = useTransition();

  return (
    <div className="space-y-4">
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between bg-ink-900 border border-ink-700 rounded-lg px-4 py-2.5"
            >
              <div>
                <p className="text-sm text-parchment-100">
                  {e.characterFirstName} {e.characterLastName}
                </p>
                <p className="text-xs text-ink-400">{e.blurb}</p>
              </div>
              <form
                action={(fd) => startRemove(() => adminRemoveSpotlightAction(fd))}
                className="shrink-0 ml-3"
              >
                <input type="hidden" name="entryId" value={e.id} />
                <button
                  type="submit"
                  disabled={removePending}
                  className="text-xs text-ink-400 hover:text-claret-500 transition-colors disabled:opacity-60"
                >
                  Remove
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      {entries.length < 2 && (
        <form action={formAction} className="space-y-3 bg-ink-900 border border-ink-700 rounded-lg p-4">
          <p className="text-sm font-medium text-parchment-100">Add to spotlight</p>
          <div className="flex gap-2">
            <input
              name="firstName"
              placeholder="First name"
              required
              className="flex-1 text-sm bg-ink-800 border border-ink-600 rounded-md px-3 py-2 focus:outline-none focus:border-gunmetal-500"
            />
            <input
              name="lastName"
              placeholder="Last name"
              required
              className="flex-1 text-sm bg-ink-800 border border-ink-600 rounded-md px-3 py-2 focus:outline-none focus:border-gunmetal-500"
            />
          </div>
          <textarea
            name="blurb"
            placeholder="Why are they being showcased?"
            rows={3}
            required
            className="w-full text-sm bg-ink-800 border border-ink-600 rounded-md px-3 py-2 focus:outline-none focus:border-gunmetal-500"
          />
          {state?.error && <p className="text-xs text-claret-500">{state.error}</p>}
          {state?.success && <p className="text-xs text-gunmetal-400">{state.success}</p>}
          <button
            type="submit"
            disabled={pending}
            className="text-sm bg-gunmetal-500 text-ink-950 px-4 py-2 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
          >
            {pending ? "Adding..." : "Add"}
          </button>
        </form>
      )}
    </div>
  );
}

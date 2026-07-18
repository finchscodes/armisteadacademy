"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { updateThreadSettingsAction } from "@/actions/forum";
import { RATING_VALUES, RATING_META } from "@/lib/thread-rating";

export function EditThreadSettingsButton({
  threadId,
  title,
  location,
  timeSetting,
  surroundings,
  ooc,
  rating,
}: {
  threadId: number;
  title: string;
  location: string | null;
  timeSetting: string | null;
  surroundings: string | null;
  ooc: string | null;
  rating: number | null;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateThreadSettingsAction, undefined);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-ink-400 hover:text-gunmetal-400 transition-colors"
      >
        Edit topic
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-start justify-center overflow-y-auto py-10 px-4">
      <form
        action={async (fd) => {
          await formAction(fd);
          router.refresh();
        }}
        className="bg-ink-900 border border-ink-700 rounded-lg p-6 w-full max-w-lg space-y-4"
      >
        <input type="hidden" name="threadId" value={threadId} />
        <h2 className="font-display text-lg text-parchment-100">Edit topic</h2>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="edit-title">
            Title
          </label>
          <input
            id="edit-title"
            name="title"
            defaultValue={title}
            required
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="edit-rating">
            Rating
          </label>
          <select
            id="edit-rating"
            name="rating"
            defaultValue={rating ?? ""}
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
          >
            <option value="">None</option>
            {RATING_VALUES.map((r) => (
              <option key={r} value={r}>
                {RATING_META[r].label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="edit-location">
              Location
            </label>
            <input
              id="edit-location"
              name="location"
              defaultValue={location ?? ""}
              className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="edit-timeSetting">
              Time
            </label>
            <input
              id="edit-timeSetting"
              name="timeSetting"
              defaultValue={timeSetting ?? ""}
              className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="edit-surroundings">
            Surroundings
          </label>
          <textarea
            id="edit-surroundings"
            name="surroundings"
            rows={3}
            defaultValue={surroundings ?? ""}
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="edit-ooc">
            OOC notes
          </label>
          <textarea
            id="edit-ooc"
            name="ooc"
            rows={2}
            defaultValue={ooc ?? ""}
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
          />
        </div>

        {state?.error && <p className="text-sm text-claret-500">{state.error}</p>}
        {state?.success && <p className="text-sm text-green-500">{state.success}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="bg-gunmetal-500 text-ink-950 rounded-md px-5 py-2 text-sm font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm text-ink-400 hover:text-parchment-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { adminUpdateBoardAction } from "@/actions/admin";
import { FaceclaimUpload } from "@/components/faceclaim-upload";

export function EditBoardForm({
  boardId,
  name,
  description,
  imageUrl,
  isClass = false,
  restrictedYearMin,
  restrictedYearMax,
  clearance,
}: {
  boardId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isClass?: boolean;
  restrictedYearMin?: number | null;
  restrictedYearMax?: number | null;
  clearance?: string | null;
}) {
  const [state, formAction, pending] = useActionState(adminUpdateBoardAction, undefined);

  return (
    <form action={formAction} className="space-y-4 bg-ink-900 border border-ink-700 rounded-lg p-6">
      <input type="hidden" name="boardId" value={boardId} />

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={name}
          required
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-gunmetal-500"
        />
      </div>

      {isClass && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="restrictedYearMin">
              Minimum year (optional)
            </label>
            <input
              id="restrictedYearMin"
              name="restrictedYearMin"
              type="number"
              min={1}
              defaultValue={restrictedYearMin ?? ""}
              placeholder="e.g. 3 for 3rd year and up"
              className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="restrictedYearMax">
              Maximum year (optional)
            </label>
            <input
              id="restrictedYearMax"
              name="restrictedYearMax"
              type="number"
              min={1}
              defaultValue={restrictedYearMax ?? ""}
              placeholder="e.g. 1 for 1st years only"
              className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="clearance">
          Clearance (optional, flavor text)
        </label>
        <input
          id="clearance"
          name="clearance"
          defaultValue={clearance ?? ""}
          placeholder="e.g. Level 3 Clearance Required"
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
        />
        <p className="text-[11px] text-ink-400 mt-1">Purely decorative — nothing enforces this.</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={description ?? ""}
          rows={4}
          placeholder="Shown at the top of the board page. Leave blank for none."
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
        />
      </div>

      <FaceclaimUpload name="imageUrl" initialUrl={imageUrl} label="Board image" wide />

      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}
      {state?.success && <p className="text-gunmetal-400 text-sm">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-gunmetal-500 text-ink-950 rounded-md px-5 py-2.5 font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}

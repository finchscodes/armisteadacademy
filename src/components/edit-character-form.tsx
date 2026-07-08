"use client";

import { useActionState } from "react";
import { updateCharacterAction } from "@/actions/characters";
import { MajorSelect } from "@/components/major-select";
import { FaceclaimUpload } from "@/components/faceclaim-upload";
import { UNDECIDED_MAJOR } from "@/lib/majors";

export function EditCharacterForm({
  characterId,
  legalName,
  name,
  major,
  avatarUrl,
  bio,
}: {
  characterId: number;
  legalName: string;
  name: string;
  major: string;
  avatarUrl: string | null;
  bio: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateCharacterAction, undefined);
  const majorIsLocked = major !== UNDECIDED_MAJOR;

  return (
    <form action={formAction} className="space-y-4 bg-ink-900 border border-ink-700 rounded-lg p-6">
      <input type="hidden" name="characterId" value={characterId} />

      <div className="border border-ink-700 rounded-lg p-4 bg-ink-800/40">
        <p className="text-xs uppercase tracking-wider text-ink-400 mb-1">Legal name</p>
        <p className="text-sm text-parchment-100">{legalName}</p>
        <p className="text-[11px] text-ink-400 mt-1">Locked — this can never be changed.</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="name">
          Code name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={name}
          required
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
        />
      </div>

      <FaceclaimUpload name="avatarUrl" initialUrl={avatarUrl} />

      {majorIsLocked ? (
        <div className="border border-ink-700 rounded-lg p-4 bg-ink-800/40">
          <p className="text-xs uppercase tracking-wider text-ink-400 mb-1">Major</p>
          <p className="text-sm text-parchment-100">{major}</p>
          <p className="text-[11px] text-ink-400 mt-1">
            Locked — a major can only be chosen once. Contact an admin if this needs to change.
          </p>
        </div>
      ) : (
        <MajorSelect initialValue={major} />
      )}

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="bio">
          Bio / Backstory
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={6}
          defaultValue={bio ?? ""}
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
        />
      </div>

      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-brass-500 text-ink-950 rounded-md px-5 py-2.5 font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}

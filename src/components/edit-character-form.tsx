"use client";

import { useActionState } from "react";
import { updateCharacterAction } from "@/actions/characters";
import { MajorSelect } from "@/components/major-select";
import { FaceclaimUpload } from "@/components/faceclaim-upload";
import { UNDECIDED_MAJOR } from "@/lib/majors";
import { GENDER_OPTIONS, SOCIAL_STATUS_OPTIONS } from "@/lib/character-options";

export function EditCharacterForm({
  characterId,
  legalName,
  age,
  name,
  major,
  avatarUrl,
  bio,
  gender,
  socialStatus,
  personality,
  appearance,
}: {
  characterId: number;
  legalName: string;
  age: number;
  name: string;
  major: string;
  avatarUrl: string | null;
  bio: string | null;
  gender: string | null;
  socialStatus: string | null;
  personality: string | null;
  appearance: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateCharacterAction, undefined);
  const majorIsLocked = major !== UNDECIDED_MAJOR;

  return (
    <form action={formAction} className="space-y-4 bg-ink-900 border border-ink-700 rounded-lg p-6">
      <input type="hidden" name="characterId" value={characterId} />

      <div className="border border-ink-700 rounded-lg p-4 bg-ink-800/40">
        <p className="text-xs uppercase tracking-wider text-ink-400 mb-1">Legal name &amp; age</p>
        <p className="text-sm text-parchment-100">
          {legalName} &middot; {age}
        </p>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="gender">
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            defaultValue={gender ?? ""}
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500"
          >
            <option value="">Not set</option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="socialStatus">
            Social status
          </label>
          <select
            id="socialStatus"
            name="socialStatus"
            defaultValue={socialStatus ?? ""}
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500"
          >
            <option value="">Not set</option>
            {SOCIAL_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

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

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="personality">
          Personality
        </label>
        <textarea
          id="personality"
          name="personality"
          rows={4}
          defaultValue={personality ?? ""}
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="appearance">
          Appearance
        </label>
        <textarea
          id="appearance"
          name="appearance"
          rows={4}
          defaultValue={appearance ?? ""}
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

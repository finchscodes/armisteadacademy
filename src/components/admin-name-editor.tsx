"use client";

import { useActionState } from "react";
import { adminUpdateCharacterNameAction } from "@/actions/admin";

export function AdminNameEditor({
  characterId,
  userId,
  firstName,
  middleName,
  lastName,
}: {
  characterId: number;
  userId: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
}) {
  const [state, formAction, pending] = useActionState(adminUpdateCharacterNameAction, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="characterId" value={characterId} />
      <input type="hidden" name="userId" value={userId} />
      <input
        name="firstName"
        defaultValue={firstName}
        required
        placeholder="First"
        className="w-24 text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1 focus:outline-none focus:border-brass-500"
      />
      <input
        name="middleName"
        defaultValue={middleName ?? ""}
        placeholder="Middle"
        className="w-24 text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1 focus:outline-none focus:border-brass-500"
      />
      <input
        name="lastName"
        defaultValue={lastName}
        required
        placeholder="Last"
        className="w-24 text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1 focus:outline-none focus:border-brass-500"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-xs bg-brass-500 text-ink-950 px-2 py-1 rounded font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
      >
        {pending ? "..." : "Save name"}
      </button>
      {state?.error && <span className="text-xs text-claret-500">{state.error}</span>}
      {state?.success && <span className="text-xs text-brass-400">{state.success}</span>}
    </form>
  );
}

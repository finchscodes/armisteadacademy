"use client";

import { useRef } from "react";
import { setActiveCharacterAction } from "@/actions/characters";

type Character = { id: number; name: string; house: string | null };

export function CharacterSwitcher({
  characters,
  activeCharacterId,
}: {
  characters: Character[];
  activeCharacterId: number | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  if (characters.length === 0) return null;

  return (
    <form ref={formRef} action={setActiveCharacterAction} className="flex items-center gap-2">
      <span className="text-[11px] uppercase tracking-wider text-ink-400 hidden sm:inline">
        Posting as
      </span>
      <select
        name="characterId"
        defaultValue={activeCharacterId ?? characters[0].id}
        onChange={() => formRef.current?.requestSubmit()}
        className="bg-ink-800 border border-ink-600 rounded-md px-2 py-1.5 text-sm text-parchment-100 focus:outline-none focus:border-brass-500"
      >
        {characters.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {c.house ? ` — ${c.house}` : ""}
          </option>
        ))}
      </select>
    </form>
  );
}

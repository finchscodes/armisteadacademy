"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setActiveCharacterAction } from "@/actions/characters";

type Character = { id: number; firstName: string; lastName: string };

export function CharacterSwitcher({
  characters,
  activeCharacterId,
}: {
  characters: Character[];
  activeCharacterId: number | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (characters.length === 0) return null;

  const current = activeCharacterId ?? characters[0].id;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const characterId = e.target.value;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("characterId", characterId);
      await setActiveCharacterAction(formData);
      // Re-fetch every server component (nav bar, feed, whatever page we're on)
      // so the whole site reflects the newly-active character immediately.
      router.refresh();
    });
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      disabled={pending}
      className="bg-ink-800 border border-ink-600 rounded-md px-2 py-1.5 text-sm text-parchment-100 focus:outline-none focus:border-brass-500 w-full disabled:opacity-60"
    >
      {characters.map((c) => (
        <option key={c.id} value={c.id}>
          {c.firstName} {c.lastName}
        </option>
      ))}
    </select>
  );
}

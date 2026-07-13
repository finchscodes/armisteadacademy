"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setActiveCharacterAction } from "@/actions/characters";
import { StyledSelect } from "@/components/styled-select";

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
  const [error, setError] = useState<string | null>(null);

  if (characters.length === 0) return null;

  const current = String(activeCharacterId ?? characters[0].id);

  function handleChange(characterId: string) {
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("characterId", characterId);
        await setActiveCharacterAction(formData);
        // setActiveCharacterAction already revalidates the whole layout
        // server-side — this just makes sure the client's own router cache
        // (e.g. back/forward navigation state) doesn't serve a stale page.
        router.refresh();
      } catch {
        setError("Couldn't switch characters — try again.");
      }
    });
  }

  return (
    <div>
      <StyledSelect
        value={current}
        onChange={handleChange}
        disabled={pending}
        options={characters.map((c) => ({
          value: String(c.id),
          label: `${c.firstName} ${c.lastName}`,
        }))}
      />
      {error && <p className="text-xs text-claret-500 mt-1">{error}</p>}
    </div>
  );
}

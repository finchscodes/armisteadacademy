"use client";

import { useTransition } from "react";
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

  if (characters.length === 0) return null;

  const current = String(activeCharacterId ?? characters[0].id);

  function handleChange(characterId: string) {
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
    <StyledSelect
      value={current}
      onChange={handleChange}
      disabled={pending}
      options={characters.map((c) => ({
        value: String(c.id),
        label: `${c.firstName} ${c.lastName}`,
      }))}
    />
  );
}

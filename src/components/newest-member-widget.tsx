import Link from "next/link";
import { getNewestCharacter } from "@/lib/characters";
import { getCharacterYearLabel } from "@/lib/year";
import { getMajorColor } from "@/lib/majors";
import { CharacterHoverCard } from "@/components/character-hover-card";
import { CharacterBadge } from "@/components/character-badge";

export async function NewestMemberWidget() {
  const character = await getNewestCharacter();
  if (!character) return null;

  const year = await getCharacterYearLabel(character.id, character.major, character.yearOverride);
  const color = getMajorColor(character.major) ?? "#7f95a3";

  return (
    <div className="bg-ink-900 border border-ink-700">
      <div className="px-4 py-2.5 border-b border-ink-700">
        <h2 className="font-ui text-xs uppercase tracking-widest text-ink-400">Newest Member</h2>
      </div>
      <CharacterHoverCard
        characterId={character.id}
        slug={character.slug}
        className="relative p-4 flex items-center gap-3 min-w-0"
      >
        <Link href={`/c/${character.slug}`} className="shrink-0">
          <CharacterBadge name={character.name} avatarUrl={character.avatarUrl} />
        </Link>
        <div className="min-w-0">
          <Link
            href={`/c/${character.slug}`}
            className="text-sm font-medium hover:underline"
            style={{ color }}
          >
            {character.firstName} {character.lastName}
          </Link>
          <p className="text-xs text-ink-400 mt-1">
            {character.major} &middot; {year}
          </p>
        </div>
      </CharacterHoverCard>
    </div>
  );
}

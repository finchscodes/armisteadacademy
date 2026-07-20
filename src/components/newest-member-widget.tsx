import Link from "next/link";
import { getNewestCharacter } from "@/lib/characters";
import { getCharacterYearLabel } from "@/lib/year";
import { getMajorColor } from "@/lib/majors";
import { jobColor } from "@/lib/roles";
import { getPrimaryJob } from "@/lib/character-jobs";
import { CharacterHoverCard } from "@/components/character-hover-card";
import { CharacterBadge } from "@/components/character-badge";

export async function NewestMemberWidget() {
  let character, year, primaryJob;
  try {
    character = await getNewestCharacter();
    if (!character) return null;

    [year, primaryJob] = await Promise.all([
      getCharacterYearLabel(character.id, character.major, character.yearOverride),
      getPrimaryJob(character.id),
    ]);
  } catch (err) {
    console.error("NewestMemberWidget failed to load:", err);
    return null;
  }
  const avatarColor = getMajorColor(character.major) ?? "#7f95a3";
  const nameColor = jobColor(primaryJob) ?? undefined;

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-ink-700">
        <h2 className="font-ui text-xs uppercase tracking-widest text-ink-400">Newest Member</h2>
      </div>
      <div className="p-4 flex items-center gap-3">
        <Link href={`/c/${character.slug}`} className="shrink-0">
          <CharacterBadge name={character.name} avatarUrl={character.avatarUrl} />
        </Link>
        <div className="min-w-0">
          <CharacterHoverCard characterId={character.id} slug={character.slug} className="relative block">
            <Link
              href={`/c/${character.slug}`}
              className="text-sm font-medium hover:underline"
              style={{ color: nameColor }}
            >
              {character.firstName} {character.lastName}
            </Link>
          </CharacterHoverCard>
          <p className="text-xs mt-1" style={{ color: avatarColor }}>
            {character.major} &middot; {year}
          </p>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { getSpotlightEntries } from "@/actions/admin";
import { CharacterBadge } from "./character-badge";
import { CharacterHoverCard } from "./character-hover-card";

export async function SpotlightWidget() {
  const entries = await getSpotlightEntries();
  if (entries.length === 0) return null;

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-brass-600 to-brass-500 px-4 py-2.5">
        <h2 className="font-display text-ink-950">Spotlight of the Week</h2>
      </div>
      <div className="p-4 space-y-4">
        {entries.map((e) => (
          <div key={e.id} className="flex gap-3">
            <CharacterHoverCard characterId={e.characterId} slug={e.characterSlug} className="relative shrink-0">
              <Link href={`/c/${e.characterSlug}`}>
                <CharacterBadge name={e.characterName} avatarUrl={e.characterAvatarUrl} />
              </Link>
            </CharacterHoverCard>
            <div className="min-w-0">
              <Link
                href={`/c/${e.characterSlug}`}
                className="text-sm font-medium text-parchment-100 hover:text-brass-400"
              >
                {e.characterFirstName} {e.characterLastName}
              </Link>
              <p className="text-xs text-ink-400 mt-1 leading-relaxed">{e.blurb}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

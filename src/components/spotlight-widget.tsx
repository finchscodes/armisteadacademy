import Link from "next/link";
import { getSpotlightEntries } from "@/actions/admin";
import { CharacterBadge } from "./character-badge";
import { CharacterHoverCard } from "./character-hover-card";
import { jobColor } from "@/lib/roles";
import { getMajorColor } from "@/lib/majors";

export async function SpotlightWidget() {
  const entries = await getSpotlightEntries();
  if (entries.length === 0) return null;

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-ink-700">
        <h2 className="font-ui text-xs uppercase tracking-widest text-ink-400">
          Spotlight of the Week
        </h2>
      </div>
      <div className="p-4 space-y-4">
        {entries.map((e) => {
          const nameColor = jobColor(e.characterJob) ?? getMajorColor(e.characterMajor) ?? undefined;
          return (
            <div key={e.id} className="flex gap-3">
              <Link href={`/c/${e.characterSlug}`} className="shrink-0">
                <CharacterBadge name={e.characterName} avatarUrl={e.characterAvatarUrl} />
              </Link>
              <div className="min-w-0">
                <CharacterHoverCard characterId={e.characterId} slug={e.characterSlug} className="relative block">
                  <Link
                    href={`/c/${e.characterSlug}`}
                    className="text-sm font-medium hover:underline"
                    style={{ color: nameColor }}
                  >
                    {e.characterFirstName} {e.characterLastName}
                  </Link>
                </CharacterHoverCard>
                <p className="text-xs text-ink-400 mt-1 leading-relaxed">{e.blurb}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

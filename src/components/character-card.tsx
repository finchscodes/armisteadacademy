import Link from "next/link";
import { CharacterBadge } from "./character-badge";
import { getCharacterBalance } from "@/lib/economy";
import { getCharacterLevelProgress } from "@/lib/xp";
import { getCharacterYearLabel } from "@/lib/year";
import { jobColor, type CharacterJob } from "@/lib/roles";

export async function CharacterCard({
  character,
}: {
  character: {
    id: number;
    name: string;
    slug: string;
    major: string;
    firstName: string;
    lastName: string;
    job: CharacterJob;
    yearOverride: string | null;
    avatarUrl: string | null;
  };
}) {
  const [balance, levelProgress, yearLabel] = await Promise.all([
    getCharacterBalance(character.id),
    getCharacterLevelProgress(character.id),
    getCharacterYearLabel(character.id, character.major, character.yearOverride),
  ]);

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg p-5 flex items-center gap-4">
      <Link href={`/c/${character.slug}`}>
        <CharacterBadge name={character.name} avatarUrl={character.avatarUrl} />
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/c/${character.slug}`}
          className="font-display text-xl text-parchment-100 hover:underline"
          style={{ color: jobColor(character.job) ?? undefined }}
        >
          {character.firstName} {character.lastName}
        </Link>
        <p className="text-xs text-ink-400">&ldquo;{character.name}&rdquo;</p>
        <p className="text-sm text-brass-400 mt-0.5">{character.major}</p>
        <p className="text-xs text-ink-400">{yearLabel}</p>
      </div>
      <div className="text-right shrink-0 space-y-1">
        <p className="text-sm text-brass-400">{balance} dollars</p>
        <p className="text-xs text-ink-400">
          Level {levelProgress.level} &middot; {levelProgress.xpIntoLevel}/
          {levelProgress.nextLevelFloor - levelProgress.currentLevelFloor} xp
        </p>
      </div>
    </div>
  );
}

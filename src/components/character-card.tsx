import Link from "next/link";
import { CharacterBadge } from "./character-badge";
import { getCharacterBalance } from "@/lib/economy";
import { getCharacterLevelProgress } from "@/lib/xp";
import { getCharacterYearLabel } from "@/lib/year";

export async function CharacterCard({
  character,
}: {
  character: { id: number; name: string; slug: string; major: string; avatarUrl: string | null };
}) {
  const [balance, levelProgress, yearLabel] = await Promise.all([
    getCharacterBalance(character.id),
    getCharacterLevelProgress(character.id),
    getCharacterYearLabel(character.id, character.major),
  ]);

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg p-5 flex items-center gap-4">
      <Link href={`/c/${character.slug}`}>
        <CharacterBadge name={character.name} avatarUrl={character.avatarUrl} />
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/c/${character.slug}`}
          className="font-display text-xl text-parchment-100 hover:text-brass-400 transition-colors"
        >
          {character.name}
        </Link>
        <p className="text-sm text-brass-400">{character.major}</p>
        <p className="text-xs text-ink-400">{yearLabel}</p>
      </div>
      <div className="text-right shrink-0 space-y-1">
        <p className="text-sm text-brass-400">{balance} galleons</p>
        <p className="text-xs text-ink-400">
          Level {levelProgress.level} &middot; {levelProgress.xpIntoLevel}/
          {levelProgress.nextLevelFloor - levelProgress.currentLevelFloor} xp
        </p>
      </div>
    </div>
  );
}

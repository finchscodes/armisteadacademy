import Link from "next/link";
import { notFound } from "next/navigation";
import { getCharacterBySlug } from "@/lib/characters";
import { getCharacterLevelProgress } from "@/lib/xp";
import { getCharacterYearLabel } from "@/lib/year";
import { getMajorDescription } from "@/lib/majors";
import { getSession } from "@/lib/auth";
import { CharacterBadge } from "@/components/character-badge";

export default async function CharacterProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const character = await getCharacterBySlug(slug);
  if (!character) notFound();

  const [levelProgress, yearLabel, session] = await Promise.all([
    getCharacterLevelProgress(character.id),
    getCharacterYearLabel(character.id, character.major),
    getSession(),
  ]);
  const majorDescription = getMajorDescription(character.major);
  const legalName = [character.firstName, character.middleName, character.lastName]
    .filter(Boolean)
    .join(" ");
  const isOwner = session?.userId === character.userId;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-ink-900 border border-ink-700 rounded-lg p-6">
        <div className="flex items-start gap-5">
          <CharacterBadge name={character.name} avatarUrl={character.avatarUrl} />
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl text-parchment-100">{character.name}</h1>
            <p className="text-xs text-ink-400 mt-0.5">{legalName}</p>
            <p className="text-sm text-brass-400 mt-1">{character.major}</p>
            <p className="text-xs text-ink-400 mt-1">{yearLabel}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-ink-400 border border-ink-600 rounded px-2 py-1">
              Level {levelProgress.level}
            </span>
            {isOwner && (
              <Link href={`/c/${character.slug}/edit`} className="text-xs text-brass-400 hover:underline">
                Edit
              </Link>
            )}
          </div>
        </div>

        {majorDescription && (
          <p className="text-xs text-ink-400 italic mt-4 border-t border-ink-700 pt-4 leading-relaxed">
            {majorDescription}
          </p>
        )}

        <div className="border-t border-ink-700 mt-4 pt-4">
          <h2 className="font-display text-sm uppercase tracking-wider text-ink-400 mb-2">
            Backstory
          </h2>
          {character.bio ? (
            <p className="whitespace-pre-wrap leading-relaxed text-parchment-100/95 text-sm">
              {character.bio}
            </p>
          ) : (
            <p className="text-sm text-ink-400 italic">No backstory written yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

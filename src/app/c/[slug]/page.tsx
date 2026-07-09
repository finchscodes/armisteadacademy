import Link from "next/link";
import { notFound } from "next/navigation";
import { getCharacterBySlug } from "@/lib/characters";
import { getCharacterLevelProgress } from "@/lib/xp";
import { getCharacterYearLabel } from "@/lib/year";
import { getMajorDescription } from "@/lib/majors";
import { jobColor, jobLabel } from "@/lib/roles";
import { getJobsForCharacter, getPrimaryJob } from "@/lib/character-jobs";
import { getCurrentUser } from "@/lib/current-user";
import { getParticipatedThreads } from "@/lib/topics";
import {
  getAcceptedRelations,
  getIncomingRequests,
  getOutgoingRequests,
} from "@/lib/character-relations";
import { CharacterBadge } from "@/components/character-badge";
import { ProfileTabs } from "@/components/profile-tabs";
import { AcceptedRelationsList } from "@/components/accepted-relations-list";
import { IncomingRequestsList, OutgoingRequestsList } from "@/components/relation-request-lists";
import { RelationRequestForm } from "@/components/relation-request-form";

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default async function CharacterProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const character = await getCharacterBySlug(slug);
  if (!character) notFound();

  const [levelProgress, yearLabel, current, jobs, primaryJob, topics, acceptedRelations] =
    await Promise.all([
      getCharacterLevelProgress(character.id),
      getCharacterYearLabel(character.id, character.major, character.yearOverride),
      getCurrentUser(),
      getJobsForCharacter(character.id),
      getPrimaryJob(character.id),
      getParticipatedThreads(character.id),
      getAcceptedRelations(character.id),
    ]);

  const majorDescription = getMajorDescription(character.major);
  const legalName = [character.firstName, character.middleName, character.lastName]
    .filter(Boolean)
    .join(" ");
  const isOwner = current?.session.userId === character.userId;
  const nameColor = jobColor(primaryJob) ?? undefined;

  const [incomingRequests, outgoingRequests] = isOwner
    ? await Promise.all([getIncomingRequests(character.id), getOutgoingRequests(character.id)])
    : [[], []];

  const overview = (
    <div className="bg-ink-900 border border-ink-700 rounded-lg p-6">
      <div className="flex items-start gap-5">
        <CharacterBadge name={character.name} avatarUrl={character.avatarUrl} />
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl text-parchment-100" style={{ color: nameColor }}>
            {legalName}
          </h1>
          <p className="text-xs text-ink-400 mt-0.5">&ldquo;{character.name}&rdquo;</p>
          {jobs.length > 0 && (
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
              {jobs.map((j) => (
                <span
                  key={j.id}
                  className="text-sm font-medium"
                  style={{ color: jobColor(j.job) ?? undefined }}
                >
                  {j.jobTitle || jobLabel(j.job)}
                </span>
              ))}
            </div>
          )}
          <p className="text-sm text-brass-400 mt-1">{character.major}</p>
          <p className="text-xs text-ink-400 mt-1">{yearLabel}</p>
          {(character.gender || character.socialStatus) && (
            <p className="text-xs text-ink-400 mt-1">
              {[character.gender, character.socialStatus].filter(Boolean).join(" · ")}
            </p>
          )}
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

      {acceptedRelations.length > 0 && (
        <div className="border-t border-ink-700 mt-4 pt-4">
          <h2 className="font-display text-sm uppercase tracking-wider text-ink-400 mb-2">
            Relations
          </h2>
          <AcceptedRelationsList relations={acceptedRelations} canRemove={false} compact />
        </div>
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

      {character.personality && (
        <div className="border-t border-ink-700 mt-4 pt-4">
          <h2 className="font-display text-sm uppercase tracking-wider text-ink-400 mb-2">
            Personality
          </h2>
          <p className="whitespace-pre-wrap leading-relaxed text-parchment-100/95 text-sm">
            {character.personality}
          </p>
        </div>
      )}

      {character.appearance && (
        <div className="border-t border-ink-700 mt-4 pt-4">
          <h2 className="font-display text-sm uppercase tracking-wider text-ink-400 mb-2">
            Appearance
          </h2>
          <p className="whitespace-pre-wrap leading-relaxed text-parchment-100/95 text-sm">
            {character.appearance}
          </p>
        </div>
      )}
    </div>
  );

  const topicsTab = (
    <div className="bg-ink-900 border border-ink-700 rounded-lg divide-y divide-ink-700">
      {topics.length === 0 ? (
        <p className="px-4 py-6 text-sm text-ink-400 text-center">Hasn&apos;t posted anywhere yet.</p>
      ) : (
        topics.map((t) => (
          <Link
            key={t.threadId}
            href={`/t/${t.threadSlug}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-ink-800/60 transition-colors"
          >
            <div>
              <p className="text-parchment-100 text-sm">{t.threadTitle}</p>
              <p className="text-xs text-ink-400 mt-0.5">{t.boardName}</p>
            </div>
            <p className="text-xs text-ink-400 shrink-0 ml-3">{timeAgo(t.lastPostAt)}</p>
          </Link>
        ))
      )}
    </div>
  );

  const relationsTab = (
    <div className="space-y-6">
      {isOwner && <RelationRequestForm />}
      {isOwner && incomingRequests.length > 0 && <IncomingRequestsList requests={incomingRequests} />}
      {isOwner && outgoingRequests.length > 0 && <OutgoingRequestsList requests={outgoingRequests} />}
      <div className="space-y-2">
        {isOwner && <p className="text-sm font-medium text-parchment-100">All relations</p>}
        <AcceptedRelationsList relations={acceptedRelations} canRemove={isOwner} />
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <ProfileTabs
        overview={overview}
        topics={topicsTab}
        relations={relationsTab}
        topicsCount={topics.length}
        relationsCount={acceptedRelations.length}
      />
    </div>
  );
}

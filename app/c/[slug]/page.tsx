import Link from "next/link";
import { notFound } from "next/navigation";
import { getCharacterBySlug } from "@/lib/characters";
import { getCharacterLevelProgress } from "@/lib/xp";
import { getCharacterYearLabel } from "@/lib/year";
import { jobColor, jobLabel } from "@/lib/roles";
import { getJobsForCharacter, getPrimaryJob } from "@/lib/character-jobs";
import { getCurrentUser } from "@/lib/current-user";
import { getParticipatedThreads } from "@/lib/topics";
import { getStatusesForCharacter } from "@/lib/character-statuses";
import { hallLabel, hallColor } from "@/lib/halls";
import { getMajorColor } from "@/lib/majors";
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

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

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

  const [levelProgress, yearLabel, current, jobs, primaryJob, topics, acceptedRelations, statuses] =
    await Promise.all([
      getCharacterLevelProgress(character.id),
      getCharacterYearLabel(character.id, character.major, character.yearOverride),
      getCurrentUser(),
      getJobsForCharacter(character.id),
      getPrimaryJob(character.id),
      getParticipatedThreads(character.id),
      getAcceptedRelations(character.id),
      getStatusesForCharacter(character.id),
    ]);

  const legalName = [character.firstName, character.middleName, character.lastName]
    .filter(Boolean)
    .join(" ");
  const isOwner = current?.session.userId === character.userId;
  const nameColor = jobColor(primaryJob) ?? undefined;
  const majorColorHex = getMajorColor(character.major) ?? "#d9b64a";

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
          <p className="text-xs text-ink-400 mt-0.5">{character.name}</p>
          {statuses.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {statuses.map((s) => (
                <span
                  key={s.id}
                  className="text-xs rounded-full px-2.5 py-0.5 border"
                  style={{
                    color: majorColorHex,
                    backgroundColor: `${majorColorHex}26`,
                    borderColor: `${majorColorHex}4d`,
                  }}
                >
                  {s.label}
                </span>
              ))}
            </div>
          )}
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
          <p className="text-sm mt-1" style={{ color: getMajorColor(character.major) ?? undefined }}>
            {character.major}
          </p>
          <p className="text-xs text-ink-400 mt-1">{yearLabel}</p>
          {character.hall && (
            <p className="text-sm font-medium mt-1" style={{ color: hallColor(character.hall) ?? undefined }}>
              {hallLabel(character.hall)}
            </p>
          )}
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

      <div className="border-t border-ink-700 mt-4 pt-4">
        <h2 className="font-display text-sm uppercase tracking-wider text-ink-400 mb-2">
          Relations
        </h2>
        <div className="space-y-4">
          {isOwner && <RelationRequestForm />}
          {isOwner && incomingRequests.length > 0 && <IncomingRequestsList requests={incomingRequests} />}
          {isOwner && outgoingRequests.length > 0 && <OutgoingRequestsList requests={outgoingRequests} />}
          <AcceptedRelationsList relations={acceptedRelations} canRemove={isOwner} />
        </div>
      </div>
    </div>
  );

  const backstoryTab = (
    <div className="bg-ink-900 border border-ink-700 rounded-lg p-6">
      {character.bio ? (
        <p className="whitespace-pre-wrap leading-relaxed text-parchment-100/95 text-sm">
          {character.bio}
        </p>
      ) : (
        <p className="text-sm text-ink-400 italic">No backstory written yet.</p>
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
            <div className="min-w-0">
              <p className="text-parchment-100 text-sm">{t.threadTitle}</p>
              <p className="text-xs text-ink-400 mt-0.5">
                {t.boardName} &middot; {t.replyCount} {t.replyCount === 1 ? "reply" : "replies"}
              </p>
            </div>
            {t.lastPoster && (
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <div className="text-right">
                  <p className="text-[11px] text-ink-400">Last reply &middot; {timeAgo(t.lastPoster.createdAt)}</p>
                  <p
                    className="text-xs font-medium"
                    style={{ color: jobColor(t.lastPoster.characterJob) ?? "#f6efdc" }}
                  >
                    {t.lastPoster.characterFirstName} {t.lastPoster.characterLastName}
                  </p>
                </div>
                <CharacterBadge
                  name={t.lastPoster.characterName}
                  avatarUrl={t.lastPoster.characterAvatarUrl}
                  size="sm"
                />
              </div>
            )}
          </Link>
        ))
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <ProfileTabs
        overview={overview}
        backstory={backstoryTab}
        topics={topicsTab}
        topicsCount={topics.length}
      />
    </div>
  );
}

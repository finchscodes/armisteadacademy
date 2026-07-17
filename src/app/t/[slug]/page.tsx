import Link from "next/link";
import { notFound } from "next/navigation";
import { getThreadBySlug } from "@/lib/forum";
import { getYearNumbersForCharacters, yearLabelForOverrideOrYearNumber } from "@/lib/year";
import { getReactionsForPosts, getCommentsForPosts } from "@/lib/post-interactions";
import { jobColor, MANAGEMENT_JOBS } from "@/lib/roles";
import { getPrimaryJobsForCharacters, characterHasAnyJob } from "@/lib/character-jobs";
import { canModeratePosts, canPostArticle, canViewBoard } from "@/lib/article-boards";
import { nowMs } from "@/lib/time";
import { getCurrentUser } from "@/lib/current-user";
import { CharacterBadge } from "@/components/character-badge";
import { ReplyForm } from "@/components/reply-form";
import { PhoneReplyForm } from "@/components/phone-reply-form";
import { EmailReplyForm } from "@/components/email-reply-form";
import { EditablePhonePost } from "@/components/editable-phone-post";
import { EmailView } from "@/components/email-view";
import { LetterView } from "@/components/letter-view";
import { TopicCommentSection } from "@/components/topic-comment-section";
import { DeletePostButton, DeleteThreadButton } from "@/components/delete-buttons";
import { ToggleThreadLockButton } from "@/components/toggle-thread-lock-button";
import { PostInteractions } from "@/components/post-interactions";
import { ArticleInteractions } from "@/components/article-interactions";
import { EditablePost } from "@/components/editable-post";
import { CharacterHoverCard } from "@/components/character-hover-card";
import { ratingLabel, ratingColor, RATING_META } from "@/lib/thread-rating";
import { getMajorColor } from "@/lib/majors";
import { getFollowerCount, isFollowingThread, getFollowingCount, getPostCount, getRecentPhotoPosts } from "@/lib/social";
import { SocialProfileHeader } from "@/components/social-profile-header";
import { SocialPostCard } from "@/components/social-post-card";
import { SocialReplyForm } from "@/components/social-reply-form";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function ThreadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [data, current] = await Promise.all([getThreadBySlug(slug), getCurrentUser()]);
  if (!data) notFound();

  const { thread, board, posts } = data;
  const session = current?.session ?? null;
  const openingPostId = posts[0]?.id;
  const postIds = posts.map((p) => p.id);
  const viewerCharacterId = current?.activeCharacter?.id ?? null;
  const canModerate =
    Boolean(session?.isAdmin) || (viewerCharacterId ? await canModeratePosts(viewerCharacterId) : false);
  const canModerateComments =
    Boolean(session?.isAdmin) ||
    (viewerCharacterId ? await characterHasAnyJob(viewerCharacterId, [...MANAGEMENT_JOBS, "chief_editor"]) : false);

  if (board?.restrictedToHall) {
    const allowed =
      Boolean(session?.isAdmin) ||
      (viewerCharacterId ? await canViewBoard(viewerCharacterId, board.id) : false);
    if (!allowed) notFound();
  }

  // A scheduled-future article is only visible to whoever can post on this
  // board (management/granted writers) and its author — same rule as the
  // board listing, just enforced here too so a direct link can't bypass it.
  const now = nowMs();
  const isScheduledFuture = Boolean(thread.scheduledFor && thread.scheduledFor.getTime() > now);
  if (isScheduledFuture) {
    const isAuthor = thread.characterId === viewerCharacterId;
    const canSeeScheduled =
      Boolean(session?.isAdmin) ||
      isAuthor ||
      (viewerCharacterId ? await canPostArticle(viewerCharacterId, board?.id ?? -1) : false);
    if (!canSeeScheduled) notFound();
  }

  const [uniqueCharacterIds, reactionsByPost, commentsByPost] = await Promise.all([
    Promise.resolve([...new Set(posts.map((p) => p.characterId))]),
    getReactionsForPosts(postIds, viewerCharacterId),
    getCommentsForPosts(postIds),
  ]);
  // Phone boards: "my side" (right, highlighted) is whichever character the
  // *viewer* is currently playing, but only if that character has actually
  // posted in this conversation — otherwise everyone shows as the other
  // party (left, grey), since the viewer isn't part of this text thread.
  const viewerParticipates = Boolean(
    viewerCharacterId && posts.some((p) => p.characterId === viewerCharacterId)
  );
  // Every character who's posted here — offered as "who's being called"
  // targets in the call composer, and to resolve a call's callee avatar.
  const phoneParticipants = [...new Map(posts.map((p) => [p.characterId, p])).values()].map((p) => ({
    id: p.characterId,
    name: `${p.characterFirstName} ${p.characterLastName}`,
    avatarUrl: p.characterAvatarUrl,
  }));
  const [yearNumberMap, jobsByCharacter] = await Promise.all([
    getYearNumbersForCharacters(uniqueCharacterIds),
    getPrimaryJobsForCharacters(uniqueCharacterIds),
  ]);

  const isSocial = board?.kind === "social";
  const socialData = isSocial
    ? await (async () => {
        const [followerCount, followingCount, following, postCount, recentPhotos] = await Promise.all([
          getFollowerCount(thread.id),
          getFollowingCount(thread.characterId),
          viewerCharacterId ? isFollowingThread(viewerCharacterId, thread.id) : Promise.resolve(false),
          getPostCount(thread.id, openingPostId ?? -1),
          getRecentPhotoPosts(thread.id, openingPostId ?? -1),
        ]);
        return { followerCount, followingCount, following, postCount, recentPhotos };
      })()
    : null;

  const sceneDetails = [
    thread.location && { label: "Location", value: thread.location },
    thread.timeSetting && { label: "Time", value: thread.timeSetting },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        {board ? (
          <Link href={`/b/${board.slug}`} className="text-sm text-ink-400 hover:text-gunmetal-400">
            &larr; {board.name}
          </Link>
        ) : (
          <span />
        )}
        {canModerate && (
          <div className="flex items-center gap-3">
            {board?.kind !== "article" && (
              <ToggleThreadLockButton threadId={thread.id} isLocked={thread.isLocked} />
            )}
            <DeleteThreadButton threadId={thread.id} />
          </div>
        )}
      </div>
      <h1 className="font-display text-3xl text-gunmetal-400 mb-2">{thread.title}</h1>

      {isScheduledFuture && thread.scheduledFor && (
        <p className="text-xs uppercase tracking-wider text-gunmetal-400 border border-gunmetal-500/40 rounded-lg px-3 py-2 mb-4 inline-block">
          Scheduled to publish {thread.scheduledFor.toLocaleDateString()} at{" "}
          {thread.scheduledFor.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          &nbsp;— only visible to you right now
        </p>
      )}

      {thread.rating && (
        <p
          className="inline-block text-xs font-medium border rounded-full px-3 py-1 mb-3"
          style={{ color: ratingColor(thread.rating) ?? undefined, borderColor: `${ratingColor(thread.rating)}66` }}
          data-tooltip={RATING_META[thread.rating]?.description}
        >
          {ratingLabel(thread.rating)}
        </p>
      )}

      {(sceneDetails.length > 0 || thread.surroundings) && (
        <div className="bg-ink-900/60 border border-ink-700 rounded-lg px-4 py-3 mb-4 text-sm">
          {sceneDetails.length > 0 && (
            <p className="text-ink-300">
              {sceneDetails.map((d, i) => (
                <span key={d.label}>
                  {i > 0 && <span className="text-ink-600 mx-2">&middot;</span>}
                  <span className="text-ink-400">{d.label}: </span>
                  {d.value}
                </span>
              ))}
            </p>
          )}
          {thread.surroundings && (
            <p className="text-ink-400 italic mt-1 whitespace-pre-wrap">{thread.surroundings}</p>
          )}
        </div>
      )}

      {thread.ooc && (
        <div className="bg-ink-800/40 border border-dashed border-ink-600 rounded-lg px-4 py-3 mb-6 text-sm">
          <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">OOC</p>
          <p className="text-ink-300 whitespace-pre-wrap">{thread.ooc}</p>
        </div>
      )}

      <div className="space-y-4 mb-8">
        {posts.map((post) => {
          const yearLabel = yearLabelForOverrideOrYearNumber(
            post.characterYearOverride,
            yearNumberMap.get(post.characterId) ?? 1
          );
          const isArticle = board?.kind === "article";
          const isPhone = board?.kind === "phone";
          const isEmail = board?.kind === "email";

          if (isSocial && socialData) {
            if (post.id === openingPostId) {
              return (
                <SocialProfileHeader
                  key={post.id}
                  threadId={thread.id}
                  threadSlug={thread.slug}
                  handle={thread.title}
                  avatarUrl={post.characterAvatarUrl}
                  description={post.content}
                  postCount={socialData.postCount}
                  followerCount={socialData.followerCount}
                  followingCount={socialData.followingCount}
                  isFollowing={socialData.following}
                  canFollow={Boolean(viewerCharacterId) && viewerCharacterId !== thread.characterId}
                  recentPhotos={socialData.recentPhotos}
                />
              );
            }
            const canDeleteThis =
              Boolean(session) &&
              ((session!.userId === post.authorUserId && post.id !== openingPostId) ||
                session!.isAdmin ||
                canModerate);
            return (
              <SocialPostCard
                key={post.id}
                postId={post.id}
                characterName={`${post.characterFirstName} ${post.characterLastName}`}
                characterSlug={post.characterSlug}
                characterAvatarUrl={post.characterAvatarUrl}
                characterId={post.characterId}
                characterJob={jobsByCharacter.get(post.characterId) ?? "none"}
                imageUrl={post.imageUrl}
                content={post.content}
                createdAt={post.createdAt}
                canDelete={canDeleteThis}
                reactions={reactionsByPost.get(post.id) ?? []}
                comments={commentsByPost.get(post.id) ?? []}
                canInteract={Boolean(viewerCharacterId)}
              />
            );
          }

          if (isEmail) {
            const canEditThis = Boolean(session) && (session!.userId === post.authorUserId || canModerate);
            const canDeleteThis =
              Boolean(session) &&
              ((session!.userId === post.authorUserId && post.id !== openingPostId) ||
                session!.isAdmin ||
                canModerate);
            const senderJob = jobsByCharacter.get(post.characterId) ?? "none";
            if (post.emailFormat === "letter") {
              return (
                <LetterView
                  key={post.id}
                  postId={post.id}
                  content={post.content}
                  editedAt={post.editedAt}
                  canEdit={canEditThis}
                  canDelete={canDeleteThis}
                  isOpeningPost={post.id === openingPostId}
                  letterTo={post.letterTo}
                  letterFrom={post.letterFrom}
                  senderCharacterId={post.characterId}
                  senderName={`${post.characterFirstName} ${post.characterLastName}`}
                  senderSlug={post.characterSlug}
                  senderAvatarUrl={post.characterAvatarUrl}
                  senderJob={senderJob}
                  postedAt={post.createdAt}
                />
              );
            }
            return (
              <EmailView
                key={post.id}
                postId={post.id}
                content={post.content}
                editedAt={post.editedAt}
                canEdit={canEditThis}
                canDelete={canDeleteThis}
                isOpeningPost={post.id === openingPostId}
                subject={thread.title}
                senderCharacterId={post.characterId}
                senderName={`${post.characterFirstName} ${post.characterLastName}`}
                senderSlug={post.characterSlug}
                senderAvatarUrl={post.characterAvatarUrl}
                senderJob={senderJob}
                postedAt={post.createdAt}
              />
            );
          }

          if (isPhone) {
            // "My side" (right) is the viewer's own active character, but
            // only if they've actually posted here — otherwise every
            // message shows as the other party (left).
            const side: "left" | "right" =
              viewerParticipates && post.characterId === viewerCharacterId ? "right" : "left";
            const canEditThis = Boolean(session) && (session!.userId === post.authorUserId || canModerate);
            const canDeleteThis =
              Boolean(session) &&
              ((session!.userId === post.authorUserId && post.id !== openingPostId) ||
                session!.isAdmin ||
                canModerate);

            return (
              <div key={post.id} className={`flex gap-3 ${side === "right" ? "flex-row-reverse" : ""}`}>
                <Link href={`/c/${post.characterSlug}`} className="shrink-0">
                  <CharacterBadge name={post.characterName} avatarUrl={post.characterAvatarUrl} size="sm" />
                </Link>
                <div className={`flex-1 min-w-0 flex flex-col ${side === "right" ? "items-end" : "items-start"}`}>
                  <div className={`flex items-center gap-2 mb-1 ${side === "right" ? "flex-row-reverse" : ""}`}>
                    <CharacterHoverCard characterId={post.characterId} slug={post.characterSlug}>
                      <Link
                        href={`/c/${post.characterSlug}`}
                        className="text-sm font-medium hover:underline"
                        style={{ color: jobColor(jobsByCharacter.get(post.characterId) ?? "none") ?? "#f6efdc" }}
                      >
                        {post.characterFirstName} {post.characterLastName}
                      </Link>
                    </CharacterHoverCard>
                    <span className="text-[11px] text-ink-400">{formatDate(post.createdAt)}</span>
                    {canDeleteThis && (
                      <DeletePostButton postId={post.id} isOpeningPost={post.id === openingPostId} />
                    )}
                  </div>
                  <EditablePhonePost
                    postId={post.id}
                    content={post.content}
                    editedAt={post.editedAt}
                    canEdit={canEditThis}
                    side={side}
                    participants={phoneParticipants.filter((p) => p.id !== post.characterId)}
                  />
                </div>
              </div>
            );
          }

          return (
            <div key={post.id}>
              <article className="bg-ink-900 border border-ink-700 rounded-lg p-5 flex gap-4">
                {!isArticle && (
                  <div className="shrink-0 flex flex-col items-center gap-2 w-24 text-center">
                    <CharacterHoverCard
                      characterId={post.characterId}
                      slug={post.characterSlug}
                      className="relative flex flex-col items-center gap-2"
                    >
                      <Link href={`/c/${post.characterSlug}`}>
                        <CharacterBadge name={post.characterName} avatarUrl={post.characterAvatarUrl} />
                      </Link>
                      <div>
                        <Link
                          href={`/c/${post.characterSlug}`}
                          className="text-sm text-parchment-100 hover:underline"
                          style={{ color: jobColor(jobsByCharacter.get(post.characterId) ?? "none") ?? undefined, lineHeight: 1.3 }}
                        >
                          {post.characterFirstName} {post.characterLastName}
                        </Link>
                        <p className="text-[11px] text-ink-400 leading-tight mt-1">
                          {post.characterMajor}
                          {yearLabel && (
                            <>
                              <br />
                              {yearLabel}
                            </>
                          )}
                        </p>
                      </div>
                    </CharacterHoverCard>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-ink-400">{formatDate(post.createdAt)}</p>
                    {session &&
                      ((session.userId === post.authorUserId && post.id !== openingPostId) ||
                        session.isAdmin ||
                        canModerate) && (
                        <DeletePostButton
                          postId={post.id}
                          isOpeningPost={post.id === openingPostId}
                        />
                      )}
                  </div>
                  <EditablePost
                    postId={post.id}
                    content={post.content}
                    editedAt={post.editedAt}
                    canEdit={Boolean(session) && (session!.userId === post.authorUserId || canModerate)}
                    ooc={isArticle ? undefined : post.ooc}
                    rollValue={isArticle ? undefined : post.rollValue}
                    rollModifier={isArticle ? undefined : post.rollModifier}
                    majorColor={isArticle ? undefined : getMajorColor(post.characterMajor)}
                  />
                  {!isArticle && (
                    <PostInteractions
                      postId={post.id}
                      reactions={reactionsByPost.get(post.id) ?? []}
                      comments={commentsByPost.get(post.id) ?? []}
                      canInteract={Boolean(viewerCharacterId)}
                    />
                  )}
                </div>
              </article>

              {isArticle && (
                <ArticleInteractions
                  postId={post.id}
                  reactions={reactionsByPost.get(post.id) ?? []}
                  comments={commentsByPost.get(post.id) ?? []}
                  canInteract={Boolean(viewerCharacterId)}
                  canModerateComments={canModerateComments}
                  posterCharacterId={post.characterId}
                  posterName={`${post.characterFirstName} ${post.characterLastName}`}
                  posterSlug={post.characterSlug}
                  posterJob={jobsByCharacter.get(post.characterId) ?? "none"}
                  postedAt={post.createdAt}
                />
              )}
            </div>
          );
        })}
      </div>

      {thread.isLocked ? (
        <p className="text-center text-sm text-ink-400 border border-ink-700 rounded-lg py-4">
          This thread is locked.
        </p>
      ) : board?.kind === "article" ? null : board?.kind === "phone" ? (
        <PhoneReplyForm
          threadSlug={thread.slug}
          participants={phoneParticipants.filter((p) => p.id !== viewerCharacterId)}
        />
      ) : board?.kind === "email" ? (
        <EmailReplyForm threadSlug={thread.slug} />
      ) : board?.kind === "social" ? (
        <SocialReplyForm threadSlug={thread.slug} />
      ) : (
        <ReplyForm threadSlug={thread.slug} />
      )}

      {(board?.kind === "phone" || board?.kind === "email" || board?.kind === "social") && openingPostId && (
        <TopicCommentSection
          postId={openingPostId}
          comments={commentsByPost.get(openingPostId) ?? []}
          canInteract={Boolean(viewerCharacterId)}
          canModerateComments={canModerateComments}
        />
      )}
    </div>
  );
}

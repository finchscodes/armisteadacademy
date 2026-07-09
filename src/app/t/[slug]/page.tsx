import Link from "next/link";
import { notFound } from "next/navigation";
import { getThreadBySlug } from "@/lib/forum";
import { getLessonsTakenCounts, yearLabelForOverrideOrLessons } from "@/lib/year";
import { getReactionsForPosts, getCommentsForPosts } from "@/lib/post-interactions";
import { jobColor } from "@/lib/roles";
import { getPrimaryJobsForCharacters } from "@/lib/character-jobs";
import { canModeratePosts } from "@/lib/article-boards";
import { getCurrentUser } from "@/lib/current-user";
import { CharacterBadge } from "@/components/character-badge";
import { ReplyForm } from "@/components/reply-form";
import { DeletePostButton, DeleteThreadButton } from "@/components/delete-buttons";
import { PostInteractions } from "@/components/post-interactions";
import { ArticleInteractions } from "@/components/article-interactions";
import { EditablePost } from "@/components/editable-post";

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

  const [uniqueCharacterIds, reactionsByPost, commentsByPost] = await Promise.all([
    Promise.resolve([...new Set(posts.map((p) => p.characterId))]),
    getReactionsForPosts(postIds, viewerCharacterId),
    getCommentsForPosts(postIds),
  ]);
  const [lessonsTakenMap, jobsByCharacter] = await Promise.all([
    getLessonsTakenCounts(uniqueCharacterIds),
    getPrimaryJobsForCharacters(uniqueCharacterIds),
  ]);

  const sceneDetails = [
    thread.location && { label: "Location", value: thread.location },
    thread.timeSetting && { label: "Time", value: thread.timeSetting },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        {board ? (
          <Link href={`/b/${board.slug}`} className="text-sm text-ink-400 hover:text-brass-400">
            &larr; {board.name}
          </Link>
        ) : (
          <span />
        )}
        {session?.isAdmin && <DeleteThreadButton threadId={thread.id} />}
      </div>
      <h1 className="font-display text-3xl text-brass-400 mb-2">{thread.title}</h1>

      {(sceneDetails.length > 0 || thread.surroundings) && (
        <div className="bg-ink-900/60 border border-ink-700 rounded-lg px-4 py-3 mb-6 text-sm">
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

      <div className="space-y-4 mb-8">
        {posts.map((post) => {
          const yearLabel = yearLabelForOverrideOrLessons(
            post.characterYearOverride,
            post.characterMajor,
            lessonsTakenMap.get(post.characterId) ?? 0
          );
          const isArticle = board?.kind === "article";

          return (
            <div key={post.id}>
              <article className="bg-ink-900 border border-ink-700 rounded-lg p-5 flex gap-4">
                <div className="shrink-0 flex flex-col items-center gap-2 w-24 text-center">
                  <Link href={`/c/${post.characterSlug}`}>
                    <CharacterBadge name={post.characterName} avatarUrl={post.characterAvatarUrl} />
                  </Link>
                  <div>
                    <Link
                      href={`/c/${post.characterSlug}`}
                      className="text-sm text-parchment-100 leading-tight hover:underline"
                      style={{ color: jobColor(jobsByCharacter.get(post.characterId) ?? "none") ?? undefined }}
                    >
                      {post.characterFirstName} {post.characterLastName}
                    </Link>
                    <p className="text-[11px] text-ink-400 leading-tight mt-0.5">
                      {[post.characterMajor, yearLabel].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-ink-400">{formatDate(post.createdAt)}</p>
                    {session &&
                      ((session.userId === post.authorUserId && post.id !== openingPostId) ||
                        session.isAdmin) && (
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
                  posterName={`${post.characterFirstName} ${post.characterLastName}`}
                  posterSlug={post.characterSlug}
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
      ) : board?.kind === "article" ? (
        <p className="text-center text-sm text-ink-400 border border-ink-700 rounded-lg py-4">
          Use the comments above to respond to this article.
        </p>
      ) : (
        <ReplyForm threadSlug={thread.slug} />
      )}
    </div>
  );
}

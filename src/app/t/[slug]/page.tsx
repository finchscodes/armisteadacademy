import Link from "next/link";
import { notFound } from "next/navigation";
import { getThreadBySlug } from "@/lib/forum";
import { getLessonsTakenCounts, yearLabelForLessonsTaken } from "@/lib/year";
import { jobColor } from "@/lib/roles";
import { getSession } from "@/lib/auth";
import { CharacterBadge } from "@/components/character-badge";
import { ReplyForm } from "@/components/reply-form";
import { DeletePostButton, DeleteThreadButton } from "@/components/delete-buttons";

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
  const [data, session] = await Promise.all([getThreadBySlug(slug), getSession()]);
  if (!data) notFound();

  const { thread, board, posts } = data;
  const openingPostId = posts[0]?.id;

  const uniqueCharacterIds = [...new Set(posts.map((p) => p.characterId))];
  const lessonsTakenMap = await getLessonsTakenCounts(uniqueCharacterIds);

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
      <h1 className="font-display text-3xl text-brass-400 mb-6">{thread.title}</h1>

      <div className="space-y-4 mb-8">
        {posts.map((post) => {
          const yearLabel =
            post.characterMajor === "Faculty"
              ? "Faculty"
              : yearLabelForLessonsTaken(lessonsTakenMap.get(post.characterId) ?? 0);

          return (
            <article
              key={post.id}
              className="bg-ink-900 border border-ink-700 rounded-lg p-5 flex gap-4"
            >
              <div className="shrink-0 flex flex-col items-center gap-2 w-24 text-center">
                <Link href={`/c/${post.characterSlug}`}>
                  <CharacterBadge name={post.characterName} avatarUrl={post.characterAvatarUrl} />
                </Link>
                <div>
                  <Link
                    href={`/c/${post.characterSlug}`}
                    className="text-sm text-parchment-100 leading-tight hover:underline"
                    style={{ color: jobColor(post.characterJob) ?? undefined }}
                  >
                    {post.characterName}
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
                <div className="whitespace-pre-wrap leading-relaxed text-parchment-100/95">
                  {post.content}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {thread.isLocked ? (
        <p className="text-center text-sm text-ink-400 border border-ink-700 rounded-lg py-4">
          This thread is locked.
        </p>
      ) : (
        <ReplyForm threadSlug={thread.slug} />
      )}
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getThreadBySlug } from "@/lib/forum";
import { CharacterBadge } from "@/components/character-badge";
import { ReplyForm } from "@/components/reply-form";

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
  const data = await getThreadBySlug(slug);
  if (!data) notFound();

  const { thread, board, posts } = data;

  return (
    <div>
      {board && (
        <Link href={`/b/${board.slug}`} className="text-sm text-ink-400 hover:text-brass-400">
          &larr; {board.name}
        </Link>
      )}
      <h1 className="font-display text-3xl text-brass-400 mt-2 mb-6">{thread.title}</h1>

      <div className="space-y-4 mb-8">
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-ink-900 border border-ink-700 rounded-lg p-5 flex gap-4"
          >
            <div className="shrink-0 flex flex-col items-center gap-2 w-24 text-center">
              <CharacterBadge name={post.characterName} avatarUrl={post.characterAvatarUrl} />
              <div>
                <p className="text-sm text-parchment-100 leading-tight">{post.characterName}</p>
                {(post.characterHouse || post.characterYearOrRole) && (
                  <p className="text-[11px] text-ink-400 leading-tight mt-0.5">
                    {[post.characterHouse, post.characterYearOrRole].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs text-ink-400 mb-2">{formatDate(post.createdAt)}</p>
              <div className="whitespace-pre-wrap leading-relaxed text-parchment-100/95">
                {post.content}
              </div>
            </div>
          </article>
        ))}
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

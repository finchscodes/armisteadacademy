import Link from "next/link";
import { notFound } from "next/navigation";
import { getBoardBySlug } from "@/lib/forum";
import { getLessonsForBoard } from "@/lib/lessons";
import { getCurrentUser } from "@/lib/current-user";
import { isAssignedToClass } from "@/lib/class-assignments";
import { canPostArticle } from "@/lib/article-boards";
import { nowMs } from "@/lib/time";
import { DraggableLessonList } from "@/components/draggable-lesson-list";

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

export default async function BoardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getBoardBySlug(slug);
  if (!data) notFound();

  const { board, childBoards, threads: allThreads } = data;
  const isClassBoard = board.kind === "class";
  const isArticleBoard = board.kind === "article";
  const [lessons, current] = await Promise.all([
    isClassBoard ? getLessonsForBoard(board.id) : Promise.resolve([]),
    getCurrentUser(),
  ]);
  const canPostLesson =
    isClassBoard && current
      ? current.session.isAdmin ||
        (current.activeCharacter
          ? await isAssignedToClass(current.activeCharacter.id, board.id)
          : false)
      : false;
  const canPostHere =
    isArticleBoard && current
      ? current.session.isAdmin ||
        (current.activeCharacter ? await canPostArticle(current.activeCharacter.id, board.id) : false)
      : !isClassBoard && !isArticleBoard;

  // Scheduled-future articles are hidden from everyone except management
  // (who can already post here) and the article's own author.
  const now = nowMs();
  const threads = isArticleBoard
    ? allThreads.filter((t) => {
        if (!t.scheduledFor || t.scheduledFor.getTime() <= now) return true;
        if (canPostHere) return true;
        return t.characterId === current?.activeCharacter?.id;
      })
    : allThreads;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl text-brass-400">{board.name}</h1>
          {board.description && <p className="text-ink-400 mt-1 max-w-xl">{board.description}</p>}
        </div>
        {board.kind !== "category" && !isClassBoard && canPostHere && (
          <Link
            href={`/b/${board.slug}/new`}
            className="shrink-0 text-sm bg-brass-500 text-ink-950 px-4 py-2 rounded-md font-medium hover:bg-brass-400 transition-colors"
          >
            {isArticleBoard ? "+ New article" : "+ New thread"}
          </Link>
        )}
      </div>

      {isClassBoard && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-lg text-parchment-100">Lessons</h2>
            {canPostLesson && (
              <Link
                href={`/lesson/new?board=${board.slug}`}
                className="text-xs text-brass-400 hover:underline"
              >
                + Post a lesson
              </Link>
            )}
          </div>
          {lessons.length === 0 ? (
            <p className="text-sm text-ink-400">No lessons posted yet.</p>
          ) : (
            <>
              {canPostLesson && lessons.length > 1 && (
                <p className="text-[11px] text-ink-400 mb-1.5">Drag to reorder.</p>
              )}
              <DraggableLessonList boardId={board.id} lessons={lessons} canManage={canPostLesson} />
            </>
          )}
        </div>
      )}

      {childBoards.length > 0 && (
        <div className="bg-ink-900 border border-ink-700 rounded-lg divide-y divide-ink-700 mb-6">
          {childBoards.map((cb) => (
            <Link
              key={cb.id}
              href={`/b/${cb.slug}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-ink-800/60 transition-colors"
            >
              <span className="text-parchment-100">{cb.name}</span>
              <span className="text-xs text-ink-400">Open board &rarr;</span>
            </Link>
          ))}
        </div>
      )}

      {board.kind !== "category" && !isClassBoard && (
        <div className="bg-ink-900 border border-ink-700 rounded-lg divide-y divide-ink-700">
          {threads.length === 0 ? (
            <p className="px-4 py-6 text-sm text-ink-400 text-center">
              {isArticleBoard ? "No articles posted yet." : "No threads yet."}
              {canPostHere && (
                <>
                  {" "}
                  <Link href={`/b/${board.slug}/new`} className="text-brass-400 hover:underline">
                    {isArticleBoard ? "Post the first one" : "Start the first one"}
                  </Link>
                  .
                </>
              )}
            </p>
          ) : (
            threads.map((t) => (
              <div
                key={t.id}
                className="relative flex items-center justify-between px-4 py-3 hover:bg-ink-800/60 transition-colors"
              >
                <div>
                  <p className="text-parchment-100">
                    {t.isPinned && <span className="text-brass-400 mr-1.5">&#128204;</span>}
                    <Link href={`/t/${t.slug}`} className="static">
                      {t.title}
                      <span className="absolute inset-0" />
                    </Link>
                    {t.isLocked && <span className="text-ink-400 ml-1.5 text-xs">(locked)</span>}
                    {t.scheduledFor && t.scheduledFor.getTime() > now && (
                      <span className="ml-1.5 text-[10px] uppercase tracking-wider text-brass-400 border border-brass-500/40 rounded px-1.5 py-0.5">
                        Scheduled &middot; {t.scheduledFor.toLocaleDateString()}{" "}
                        {t.scheduledFor.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-400 mt-0.5">
                    by{" "}
                    <Link
                      href={`/c/${t.characterSlug}`}
                      className="relative z-10 hover:text-brass-400"
                    >
                      {t.characterFirstName} {t.characterLastName}
                    </Link>
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-xs text-ink-400">{t.postCount} replies</p>
                  <p className="text-xs text-ink-400">{timeAgo(t.lastPostAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getBoardBySlug } from "@/lib/forum";
import { getLessonsForBoard } from "@/lib/lessons";
import { getCurrentUser } from "@/lib/current-user";
import { isAssignedToClass } from "@/lib/class-assignments";
import { isEnrolledInClass } from "@/lib/class-enrollments";
import { enrollInClassAction } from "@/actions/lessons";
import { canPostArticle, canViewBoard } from "@/lib/article-boards";
import { nowMs } from "@/lib/time";
import { getYearNumbersForCharacters } from "@/lib/year";
import { HaveAMealButton } from "@/components/have-a-meal-button";
import { jobColor } from "@/lib/roles";
import { DraggableLessonList } from "@/components/draggable-lesson-list";
import { CharacterBadge } from "@/components/character-badge";
import { CharacterHoverCard } from "@/components/character-hover-card";
import { ShopBoardView } from "@/components/shop-board-view";
import { BankBoardView } from "@/components/bank-board-view";

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

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ enrollError?: string }>;
}) {
  const { slug } = await params;
  const { enrollError } = await searchParams;
  const data = await getBoardBySlug(slug);
  if (!data) notFound();

  const { board, childBoards, threads: allThreads } = data;

  if (board.kind === "shop") {
    return <ShopBoardView boardId={board.id} boardName={board.name} boardDescription={board.description} />;
  }
  if (board.kind === "bank") {
    return <BankBoardView boardName={board.name} />;
  }

  const isClassBoard = board.kind === "class";
  const isArticleBoard = board.kind === "article";
  const isEmailBoard = board.kind === "email";
  const [lessons, current] = await Promise.all([
    isClassBoard ? getLessonsForBoard(board.id) : Promise.resolve([]),
    getCurrentUser(),
  ]);

  if (board.restrictedToHall) {
    const allowed =
      current?.session.isAdmin ||
      (current?.activeCharacter ? await canViewBoard(current.activeCharacter.id, board.id) : false);
    if (!allowed) notFound();
  }

  const canPostLesson =
    isClassBoard && current
      ? current.session.isAdmin ||
        (current.activeCharacter
          ? await isAssignedToClass(current.activeCharacter.id, board.id)
          : false)
      : false;

  // Year-restricted classes ("3rd year and up", "1st years only") — doesn't
  // apply to admins or the instructor(s) actually teaching it, and never
  // applies to grading (see lib/grading.ts, which doesn't check this at all).
  if (isClassBoard && (board.restrictedYearMin || board.restrictedYearMax) && !current?.session.isAdmin && !canPostLesson) {
    const viewerYear = current?.activeCharacter
      ? await getYearNumbersForCharacters([current.activeCharacter.id])
      : null;
    const yearNumber = viewerYear?.get(current!.activeCharacter!.id) ?? 1;
    const belowMin = board.restrictedYearMin != null && yearNumber < board.restrictedYearMin;
    const aboveMax = board.restrictedYearMax != null && yearNumber > board.restrictedYearMax;
    if (!current?.activeCharacter || belowMin || aboveMax) notFound();
  }
  const isEnrolled =
    isClassBoard && current?.activeCharacter
      ? await isEnrolledInClass(current.activeCharacter.id, board.id)
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
        <div className="flex items-start gap-4 min-w-0">
          {board.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={board.imageUrl}
              alt={board.name}
              className="w-20 h-20 sm:w-28 sm:h-20 rounded-lg object-cover border border-ink-700 shrink-0"
            />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-3xl text-gunmetal-400">{board.name}</h1>
              {board.clearance && (
                <span className="text-[10px] uppercase tracking-wider text-claret-500 border border-claret-600/40 bg-claret-600/10 rounded px-2 py-0.5">
                  {board.clearance}
                </span>
              )}
            </div>
            {board.description && (
              <p className="text-xs text-ink-400 mt-1 max-w-xl">{board.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {board.slug === "dining-hall" && current?.activeCharacter && <HaveAMealButton />}
          {board.kind !== "category" && !isClassBoard && canPostHere && (
            <Link
              href={`/b/${board.slug}/new`}
              className="shrink-0 text-sm bg-gunmetal-500 text-ink-950 px-4 py-2 rounded-md font-medium hover:bg-gunmetal-400 transition-colors"
            >
              {isArticleBoard ? "+ New article" : isEmailBoard ? "+ New email" : "+ New thread"}
            </Link>
          )}
          {isClassBoard && canPostLesson && (
            <Link
              href={`/b/${board.slug}/exam/edit`}
              className="shrink-0 text-sm bg-ink-800 border border-ink-600 text-parchment-100 px-4 py-2 rounded-md hover:border-gunmetal-500/50 transition-colors"
            >
              Edit exam
            </Link>
          )}
          {isClassBoard && !canPostLesson && isEnrolled && (
            <Link
              href={`/b/${board.slug}/exam`}
              className="shrink-0 text-sm bg-ink-800 border border-ink-600 text-parchment-100 px-4 py-2 rounded-md hover:border-gunmetal-500/50 transition-colors"
            >
              Take exam
            </Link>
          )}
        </div>
      </div>

      {isClassBoard && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-lg text-parchment-100">Lessons</h2>
            {canPostLesson && (
              <Link
                href={`/lesson/new?board=${board.slug}`}
                className="text-xs text-gunmetal-400 hover:underline"
              >
                + Post a lesson
              </Link>
            )}
          </div>
          {!isEnrolled && current?.activeCharacter && (
            <div
              className={`bg-ink-900 border border-ink-700 rounded-lg text-center ${
                canPostLesson ? "p-3 mb-4" : "p-5"
              }`}
            >
              <p className={`text-parchment-100 ${canPostLesson ? "text-xs mb-2" : "text-sm mb-3"}`}>
                {canPostLesson
                  ? "You're not enrolled in this class — enroll to have its homework count toward your grading bin."
                  : "Enroll in this class to see its lessons and submit homework."}
              </p>
              {enrollError && <p className="text-sm text-claret-500 mb-2">{enrollError}</p>}
              <form action={enrollInClassAction}>
                <input type="hidden" name="boardId" value={board.id} />
                <button
                  type="submit"
                  className={
                    canPostLesson
                      ? "text-xs bg-ink-800 border border-ink-600 text-parchment-100 px-3 py-1.5 rounded-md hover:border-gunmetal-500/50 transition-colors"
                      : "text-sm bg-gunmetal-500 text-ink-950 px-5 py-2 rounded-md font-medium hover:bg-gunmetal-400 transition-colors"
                  }
                >
                  Enroll
                </button>
              </form>
            </div>
          )}
          {!isEnrolled && !canPostLesson && !current?.activeCharacter && (
            <p className="text-sm text-ink-400">
              {current ? "Pick an active character to enroll." : "Log in to enroll in this class."}
            </p>
          )}
          {(canPostLesson || isEnrolled) &&
            (lessons.length === 0 ? (
              <p className="text-sm text-ink-400">No lessons posted yet.</p>
            ) : (
              <>
                {canPostLesson && lessons.length > 1 && (
                  <p className="text-[11px] text-ink-400 mb-1.5">Drag to reorder.</p>
                )}
                <DraggableLessonList boardId={board.id} lessons={lessons} canManage={canPostLesson} />
              </>
            ))}
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
              {isArticleBoard ? "No articles posted yet." : isEmailBoard ? "No emails yet." : "No threads yet."}
              {canPostHere && (
                <>
                  {" "}
                  <Link href={`/b/${board.slug}/new`} className="text-gunmetal-400 hover:underline">
                    {isArticleBoard ? "Post the first one" : isEmailBoard ? "Send the first one" : "Start the first one"}
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
                    {t.isPinned && <span className="text-gunmetal-400 mr-1.5">&#128204;</span>}
                    <Link href={`/t/${t.slug}`} className="static">
                      {t.title}
                      <span className="absolute inset-0" />
                    </Link>
                    {t.isLocked && <span className="text-ink-400 ml-1.5 text-xs">(locked)</span>}
                    {t.scheduledFor && t.scheduledFor.getTime() > now && (
                      <span className="ml-1.5 text-[10px] uppercase tracking-wider text-gunmetal-400 border border-gunmetal-500/40 rounded px-1.5 py-0.5">
                        Scheduled &middot; {t.scheduledFor.toLocaleDateString()}{" "}
                        {t.scheduledFor.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-400 mt-0.5">
                    by{" "}
                    <Link
                      href={`/c/${t.characterSlug}`}
                      className="relative z-10 hover:text-gunmetal-400"
                    >
                      {t.characterFirstName} {t.characterLastName}
                    </Link>
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {isArticleBoard ? (
                    <>
                      <p className="text-xs text-ink-400 text-right">{timeAgo(t.createdAt)}</p>
                      <CharacterHoverCard
                        characterId={t.characterId}
                        slug={t.characterSlug}
                        className="relative z-10 shrink-0"
                      >
                        <Link href={`/c/${t.characterSlug}`}>
                          <CharacterBadge
                            name={t.characterName}
                            avatarUrl={t.characterAvatarUrl}
                            size="sm"
                          />
                        </Link>
                      </CharacterHoverCard>
                    </>
                  ) : (
                    <>
                      <div className="text-right">
                        <p className="text-xs text-ink-400">
                          {Math.max(t.postCount - 1, 0)} {t.postCount - 1 === 1 ? "reply" : "replies"}
                        </p>
                        {t.lastPoster && (
                          <p className="text-xs mt-0.5">
                            <span className="text-ink-500">last: </span>
                            <span style={{ color: jobColor(t.lastPoster.characterJob) ?? undefined }}>
                              {t.lastPoster.characterFirstName} {t.lastPoster.characterLastName}
                            </span>
                            <span className="text-ink-500"> &middot; {timeAgo(t.lastPoster.createdAt)}</span>
                          </p>
                        )}
                      </div>
                      {t.lastPoster && (
                        <CharacterHoverCard
                          characterId={t.lastPoster.characterId}
                          slug={t.lastPoster.characterSlug}
                          className="relative z-10 shrink-0"
                        >
                          <Link href={`/c/${t.lastPoster.characterSlug}`}>
                            <CharacterBadge
                              name={t.lastPoster.characterName}
                              avatarUrl={t.lastPoster.characterAvatarUrl}
                              size="sm"
                            />
                          </Link>
                        </CharacterHoverCard>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

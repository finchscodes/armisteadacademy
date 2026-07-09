import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLessonDetail } from "@/lib/lessons";
import { getCurrentUser } from "@/lib/current-user";
import { canGradeHomework } from "@/lib/xp";
import { GRADING_LEVEL_REQUIREMENT, REQUIRED_GRADERS } from "@/db/schema";
import { isAssignedToClass } from "@/lib/class-assignments";
import { tierLabel } from "@/lib/grading";
import { SubmitHomeworkForm } from "@/components/submit-homework-form";
import { DeleteLessonButton } from "@/components/delete-buttons";
import { RichTextDisplay } from "@/components/rich-text-display";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const activeCharacterId = current.activeCharacter?.id ?? null;
  const data = await getLessonDetail(Number(id), activeCharacterId);
  if (!data) notFound();

  const { lesson, board, mySubmission, myGradesReceived, myFeedback } = data;

  const [eligibleToGrade, canManage] = await Promise.all([
    activeCharacterId ? canGradeHomework(activeCharacterId) : false,
    current.session.isAdmin ||
      (activeCharacterId ? await isAssignedToClass(activeCharacterId, lesson.boardId) : false),
  ]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        {board ? (
          <Link href={`/b/${board.slug}`} className="text-sm text-ink-400 hover:text-brass-400">
            &larr; {board.name}
          </Link>
        ) : (
          <span />
        )}
        {canManage && (
          <div className="flex items-center gap-3">
            <Link href={`/lesson/${lesson.id}/edit`} className="text-xs text-ink-400 hover:text-brass-400">
              Edit
            </Link>
            <DeleteLessonButton lessonId={lesson.id} lessonTitle={lesson.title} />
          </div>
        )}
      </div>
      <h1 className="font-display text-3xl text-brass-400 mb-1">{lesson.title}</h1>
      <p className="text-xs text-ink-400 mb-4">
        Reward: {lesson.rewardMin}&ndash;{lesson.rewardMax} dollars &middot; Grader earns{" "}
        {lesson.graderFee}
      </p>

      <div className="bg-ink-900 border border-ink-700 rounded-lg p-5 mb-8 leading-relaxed">
        <RichTextDisplay html={lesson.prompt} />
      </div>

      {/* Submit / view your own submission */}
      <section className="mb-8">
        <h2 className="font-display text-lg text-parchment-100 mb-3">Your homework</h2>
        {!mySubmission ? (
          <SubmitHomeworkForm lessonId={lesson.id} />
        ) : (
          <div className="bg-ink-900 border border-ink-700 rounded-lg p-5">
            <p className="whitespace-pre-wrap text-sm text-parchment-100/90 mb-3">
              {mySubmission.content}
            </p>
            {mySubmission.status === "graded" ? (
              <div className="border-t border-ink-700 pt-3 text-sm space-y-3">
                <p className="text-brass-400 font-medium">
                  Grade: {mySubmission.finalTier && tierLabel(mySubmission.finalTier)} &middot; +
                  {mySubmission.payout} dollars
                </p>
                {myFeedback.length > 0 && (
                  <div className="space-y-2">
                    {myFeedback.map((f, i) => (
                      <div key={i} className="text-xs text-ink-300 border-t border-ink-700/60 pt-2">
                        <span className="text-ink-400">{f.graderName}: </span>
                        <span className="text-parchment-100/80">{tierLabel(f.tier)}</span>
                        {f.feedback && <p className="mt-0.5 whitespace-pre-wrap">{f.feedback}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-ink-400 border-t border-ink-700 pt-3">
                {myGradesReceived} of {REQUIRED_GRADERS} graders have reviewed your submission so
                far. Feedback appears once grading is complete.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Opt in to grading other people's homework */}
      <section>
        <h2 className="font-display text-lg text-parchment-100 mb-2">Grade homework</h2>
        {eligibleToGrade ? (
          <Link
            href={`/lesson/${lesson.id}/grade`}
            className="inline-block text-sm bg-brass-500 text-ink-950 px-4 py-2 rounded-md font-medium hover:bg-brass-400 transition-colors"
          >
            Open the grading queue
          </Link>
        ) : (
          <p className="text-xs text-ink-400">
            Reach level {GRADING_LEVEL_REQUIREMENT} to grade homework and earn dollars for it.
          </p>
        )}
      </section>
    </div>
  );
}

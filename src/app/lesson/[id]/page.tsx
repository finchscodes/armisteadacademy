import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLessonDetail } from "@/lib/lessons";
import { getCurrentUser } from "@/lib/current-user";
import { canGradeHomework } from "@/lib/xp";
import { GRADING_LEVEL_REQUIREMENT } from "@/db/schema";
import { SubmitHomeworkForm } from "@/components/submit-homework-form";
import { ClaimButton } from "@/components/claim-button";
import { GradeForm } from "@/components/grade-form";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const activeCharacterId = current.activeCharacter?.id ?? null;
  const data = await getLessonDetail(Number(id), activeCharacterId);
  if (!data) notFound();

  const { lesson, board, mySubmission, openSubmissions, claimedByMe, graded } = data;

  const eligible = activeCharacterId ? await canGradeHomework(activeCharacterId) : false;

  return (
    <div className="max-w-2xl mx-auto">
      {board && (
        <Link href={`/b/${board.slug}`} className="text-sm text-ink-400 hover:text-brass-400">
          &larr; {board.name}
        </Link>
      )}
      <h1 className="font-display text-3xl text-brass-400 mt-2 mb-1">{lesson.title}</h1>
      <p className="text-xs text-ink-400 mb-4">
        Reward: {lesson.rewardMin}&ndash;{lesson.rewardMax} galleons &middot; Grader earns{" "}
        {lesson.graderFee}
      </p>

      <div className="bg-ink-900 border border-ink-700 rounded-lg p-5 mb-8 whitespace-pre-wrap leading-relaxed">
        {lesson.prompt}
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
              <div className="border-t border-ink-700 pt-3 text-sm">
                <p className="text-brass-400 font-medium">
                  Grade: {mySubmission.grade}/100 &middot; +{mySubmission.payout} galleons
                </p>
                {mySubmission.feedback && (
                  <p className="text-ink-200 mt-1 whitespace-pre-wrap">{mySubmission.feedback}</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-ink-400 border-t border-ink-700 pt-3">
                {mySubmission.status === "claimed" ? "Being graded..." : "Waiting for a grader"}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Submissions claimed by me, awaiting my grade */}
      {claimedByMe.length > 0 && (
        <section className="mb-8">
          <h2 className="font-display text-lg text-parchment-100 mb-3">Grading now</h2>
          <div className="space-y-3">
            {claimedByMe.map((s) => (
              <div key={s.id} className="bg-ink-900 border border-ink-700 rounded-lg p-5">
                <p className="text-xs text-ink-400 mb-2">by {s.characterName}</p>
                <p className="whitespace-pre-wrap text-sm text-parchment-100/90">{s.content}</p>
                <GradeForm submissionId={s.id} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Open submissions available to claim */}
      {openSubmissions.length > 0 && (
        <section className="mb-8">
          <h2 className="font-display text-lg text-parchment-100 mb-1">Homework to grade</h2>
          {!eligible && (
            <p className="text-xs text-ink-400 mb-3">
              Reach level {GRADING_LEVEL_REQUIREMENT} to grade homework and earn galleons for it.
            </p>
          )}
          <div className="space-y-3">
            {openSubmissions.map((s) => (
              <div key={s.id} className="bg-ink-900 border border-ink-700 rounded-lg p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-ink-400">by {s.characterName}</p>
                  {eligible && <ClaimButton submissionId={s.id} />}
                </div>
                <p className="whitespace-pre-wrap text-sm text-parchment-100/90 line-clamp-3">
                  {s.content}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Gradebook of completed grades */}
      {graded.length > 0 && (
        <section>
          <h2 className="font-display text-lg text-parchment-100 mb-3">Gradebook</h2>
          <div className="bg-ink-900 border border-ink-700 rounded-lg divide-y divide-ink-700">
            {graded.map((s) => (
              <div key={s.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <span className="text-parchment-100">{s.characterName}</span>
                <span className="text-ink-400">
                  {s.grade}/100 &middot; graded by {s.graderName ?? "unknown"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

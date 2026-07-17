import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { boards } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { isEnrolledInClass } from "@/lib/class-enrollments";
import { getExamForBoard, getExamQuestions, getExamAttempt } from "@/lib/exams";
import { getCurrentGameDate } from "@/lib/game-time";
import { TakeExamForm } from "@/components/take-exam-form";

export const dynamic = "force-dynamic";

export default async function TakeExamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (!current.activeCharacter) redirect("/characters");

  const [board] = await db.select().from(boards).where(eq(boards.slug, slug));
  if (!board || board.kind !== "class") notFound();

  const enrolled = await isEnrolledInClass(current.activeCharacter.id, board.id);
  if (!enrolled && !current.session.isAdmin) notFound();

  const date = await getCurrentGameDate();
  const exam = await getExamForBoard(board.id, date.year);

  if (date.quarter !== "summer") {
    return (
      <div className="max-w-lg mx-auto text-center">
        <p className="text-sm text-ink-400">
          Exams only open during Summer. It&apos;s currently{" "}
          {date.quarter[0].toUpperCase() + date.quarter.slice(1)}, Week {date.week}.
        </p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="max-w-lg mx-auto text-center">
        <p className="text-sm text-ink-400">No exam has been posted for {board.name} yet.</p>
      </div>
    );
  }

  const [questions, attempt] = await Promise.all([
    getExamQuestions(exam.id),
    getExamAttempt(exam.id, current.activeCharacter.id),
  ]);

  return (
    <div className="max-w-xl mx-auto">
      <Link href={`/b/${board.slug}`} className="text-sm text-ink-400 hover:text-gunmetal-400">
        &larr; {board.name}
      </Link>
      <h1 className="font-display text-2xl text-parchment-100 mt-2 mb-1">
        {board.name} — Year {exam.year} Exam
      </h1>
      <p className="text-sm text-ink-400 mb-6">Need 70% correct to pass this class for the year.</p>

      {attempt?.passed ? (
        <div className="bg-ink-900 border border-green-800 rounded-lg p-4 text-center">
          <p className="text-green-400 font-medium">
            Already passed — {attempt.score}/{attempt.totalQuestions}
          </p>
        </div>
      ) : questions.length === 0 ? (
        <p className="text-sm text-ink-400 italic">This exam has no questions yet.</p>
      ) : (
        <>
          {attempt && (
            <p className="text-xs text-ink-400 mb-3">
              Last attempt: {attempt.score}/{attempt.totalQuestions} — you can retake it.
            </p>
          )}
          <TakeExamForm examId={exam.id} questions={questions} />
        </>
      )}
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { boards } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { isAssignedToClass } from "@/lib/class-assignments";
import { getOrCreateExamForBoard, getExamQuestions } from "@/lib/exams";
import { getCurrentGameDate } from "@/lib/game-time";
import { ExamQuestionCard } from "@/components/exam-question-card";
import { NewExamQuestionForm } from "@/components/new-exam-question-form";

export const dynamic = "force-dynamic";

export default async function ExamEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const [board] = await db.select().from(boards).where(eq(boards.slug, slug));
  if (!board || board.kind !== "class") notFound();

  const allowed =
    current.session.isAdmin ||
    (current.activeCharacter ? await isAssignedToClass(current.activeCharacter.id, board.id) : false);
  if (!allowed) notFound();

  const date = await getCurrentGameDate();
  const exam = await getOrCreateExamForBoard(board.id, date.year, current.session.userId);
  const questions = await getExamQuestions(exam.id);

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/b/${board.slug}`} className="text-sm text-ink-400 hover:text-brass-400">
        &larr; {board.name}
      </Link>
      <h1 className="font-display text-2xl text-parchment-100 mt-2 mb-1">
        {board.name} — Year {exam.year} Exam
      </h1>
      <p className="text-sm text-ink-400 mb-6">
        Multiple choice. Students need 70% correct to pass this class for the year — mark the
        right answer for each question with the radio button.
      </p>

      <div className="space-y-3 mb-4">
        {questions.length === 0 ? (
          <p className="text-sm text-ink-400 italic">No questions yet.</p>
        ) : (
          questions.map((q, i) => <ExamQuestionCard key={q.id} question={q} index={i} />)
        )}
      </div>

      <NewExamQuestionForm examId={exam.id} />
    </div>
  );
}

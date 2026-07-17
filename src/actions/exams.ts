"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { exams, examQuestions, examAnswers, examAttempts, boards } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { isAssignedToClass } from "@/lib/class-assignments";
import { getExamQuestions, getOrCreateExamForBoard, maybeAdvanceYear } from "@/lib/exams";
import { getCurrentGameDate } from "@/lib/game-time";

export type ExamActionState = { error?: string; success?: string } | undefined;

async function requireCanEditExam(boardId: number) {
  const { session, characterId } = await requireSessionAndCharacter();
  const allowed = session.isAdmin || (await isAssignedToClass(characterId, boardId));
  if (!allowed) throw new Error("Not authorized");
  return { session, characterId };
}

const addQuestionSchema = z.object({
  examId: z.coerce.number().int(),
  questionText: z.string().min(1, "Question can't be empty").max(1000),
});

export async function adminAddExamQuestionAction(
  _prevState: ExamActionState,
  formData: FormData
): Promise<ExamActionState> {
  const parsed = addQuestionSchema.safeParse({
    examId: formData.get("examId"),
    questionText: formData.get("questionText"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const [exam] = await db.select({ boardId: exams.boardId }).from(exams).where(eq(exams.id, parsed.data.examId));
  if (!exam) return { error: "Exam not found" };
  await requireCanEditExam(exam.boardId);

  const existing = await db
    .select({ id: examQuestions.id })
    .from(examQuestions)
    .where(eq(examQuestions.examId, parsed.data.examId));

  await db.insert(examQuestions).values({
    examId: parsed.data.examId,
    questionText: parsed.data.questionText,
    position: existing.length,
  });

  revalidatePath("/", "layout");
  return { success: "Question added" };
}

export async function adminRemoveExamQuestionAction(formData: FormData) {
  const questionId = Number(formData.get("questionId"));
  if (!questionId) return;

  const [question] = await db
    .select({ examId: examQuestions.examId })
    .from(examQuestions)
    .where(eq(examQuestions.id, questionId));
  if (!question) return;
  const [exam] = await db.select({ boardId: exams.boardId }).from(exams).where(eq(exams.id, question.examId));
  if (!exam) return;
  await requireCanEditExam(exam.boardId);

  await db.delete(examQuestions).where(eq(examQuestions.id, questionId));
  revalidatePath("/", "layout");
}

const addAnswerSchema = z.object({
  questionId: z.coerce.number().int(),
  answerText: z.string().min(1, "Answer can't be empty").max(500),
  isCorrect: z.coerce.boolean(),
});

export async function adminAddExamAnswerAction(
  _prevState: ExamActionState,
  formData: FormData
): Promise<ExamActionState> {
  const parsed = addAnswerSchema.safeParse({
    questionId: formData.get("questionId"),
    answerText: formData.get("answerText"),
    isCorrect: formData.get("isCorrect") === "true",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const [question] = await db
    .select({ examId: examQuestions.examId })
    .from(examQuestions)
    .where(eq(examQuestions.id, parsed.data.questionId));
  if (!question) return { error: "Question not found" };
  const [exam] = await db.select({ boardId: exams.boardId }).from(exams).where(eq(exams.id, question.examId));
  if (!exam) return { error: "Exam not found" };
  await requireCanEditExam(exam.boardId);

  // Only one correct answer per question — setting a new one clears the old.
  if (parsed.data.isCorrect) {
    await db
      .update(examAnswers)
      .set({ isCorrect: false })
      .where(eq(examAnswers.questionId, parsed.data.questionId));
  }

  const existing = await db
    .select({ id: examAnswers.id })
    .from(examAnswers)
    .where(eq(examAnswers.questionId, parsed.data.questionId));

  await db.insert(examAnswers).values({
    questionId: parsed.data.questionId,
    answerText: parsed.data.answerText,
    isCorrect: parsed.data.isCorrect,
    position: existing.length,
  });

  revalidatePath("/", "layout");
  return { success: "Answer added" };
}

export async function adminSetCorrectAnswerAction(formData: FormData) {
  const answerId = Number(formData.get("answerId"));
  const questionId = Number(formData.get("questionId"));
  if (!answerId || !questionId) return;

  const [question] = await db
    .select({ examId: examQuestions.examId })
    .from(examQuestions)
    .where(eq(examQuestions.id, questionId));
  if (!question) return;
  const [exam] = await db.select({ boardId: exams.boardId }).from(exams).where(eq(exams.id, question.examId));
  if (!exam) return;
  await requireCanEditExam(exam.boardId);

  await db.update(examAnswers).set({ isCorrect: false }).where(eq(examAnswers.questionId, questionId));
  await db.update(examAnswers).set({ isCorrect: true }).where(eq(examAnswers.id, answerId));

  revalidatePath("/", "layout");
}

export async function adminRemoveExamAnswerAction(formData: FormData) {
  const answerId = Number(formData.get("answerId"));
  if (!answerId) return;

  const [answer] = await db
    .select({ questionId: examAnswers.questionId })
    .from(examAnswers)
    .where(eq(examAnswers.id, answerId));
  if (!answer) return;
  const [question] = await db
    .select({ examId: examQuestions.examId })
    .from(examQuestions)
    .where(eq(examQuestions.id, answer.questionId));
  if (!question) return;
  const [exam] = await db.select({ boardId: exams.boardId }).from(exams).where(eq(exams.id, question.examId));
  if (!exam) return;
  await requireCanEditExam(exam.boardId);

  await db.delete(examAnswers).where(eq(examAnswers.id, answerId));
  revalidatePath("/", "layout");
}

/** Fetch-or-create the current year's exam for a class board — used to land on the editor. */
export async function getOrCreateExamForBoardAction(boardId: number) {
  const { session } = await requireCanEditExam(boardId);
  const date = await getCurrentGameDate();
  const exam = await getOrCreateExamForBoard(boardId, date.year, session.userId);
  return exam;
}

/** Student exam submission — one answer id per question. */
export async function submitExamAttemptAction(formData: FormData): Promise<ExamActionState> {
  const { characterId } = await requireSessionAndCharacter();
  const examId = Number(formData.get("examId"));
  if (!examId) return { error: "Exam not found" };

  const [exam] = await db.select().from(exams).where(eq(exams.id, examId));
  if (!exam) return { error: "Exam not found" };

  const [board] = await db.select({ kind: boards.kind }).from(boards).where(eq(boards.id, exam.boardId));
  if (!board || board.kind !== "class") return { error: "Not a class exam" };

  const date = await getCurrentGameDate();
  if (date.quarter !== "summer") {
    return { error: "Exams can only be taken during Summer" };
  }
  if (exam.year !== date.year) {
    return { error: "This exam isn't for the current year" };
  }

  const questions = await getExamQuestions(examId);
  if (questions.length === 0) return { error: "This exam has no questions yet" };

  let correctCount = 0;
  for (const q of questions) {
    const submittedAnswerId = Number(formData.get(`question-${q.id}`));
    const correctAnswer = q.answers.find((a) => a.isCorrect);
    if (correctAnswer && submittedAnswerId === correctAnswer.id) correctCount++;
  }

  const passed = questions.length > 0 && correctCount / questions.length >= 0.7;

  await db.insert(examAttempts).values({
    examId,
    characterId,
    score: correctCount,
    totalQuestions: questions.length,
    passed,
  });

  const advanced = await maybeAdvanceYear(characterId, date.year);

  revalidatePath("/", "layout");
  return {
    success: passed
      ? `Passed! ${correctCount}/${questions.length}${advanced ? " — you've advanced a year!" : ""}`
      : `${correctCount}/${questions.length} — not quite enough to pass (need 70%). You can retake it.`,
  };
}

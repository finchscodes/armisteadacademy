import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { exams, examQuestions, examAnswers, examAttempts, characters } from "@/db/schema";

export const PASSING_FRACTION = 0.7; // 7/10
export const CLASSES_NEEDED_TO_ADVANCE = 6;

export async function getExamForBoard(boardId: number, year: number) {
  const [exam] = await db
    .select()
    .from(exams)
    .where(and(eq(exams.boardId, boardId), eq(exams.year, year)));
  return exam ?? null;
}

export async function getOrCreateExamForBoard(boardId: number, year: number, createdByUserId: number | null) {
  const existing = await getExamForBoard(boardId, year);
  if (existing) return existing;

  const [created] = await db.insert(exams).values({ boardId, year, createdByUserId }).returning();
  return created;
}

export type ExamQuestionWithAnswers = {
  id: number;
  questionText: string;
  position: number;
  answers: { id: number; answerText: string; isCorrect: boolean; position: number }[];
};

export async function getExamQuestions(examId: number): Promise<ExamQuestionWithAnswers[]> {
  const questions = await db
    .select()
    .from(examQuestions)
    .where(eq(examQuestions.examId, examId))
    .orderBy(examQuestions.position);
  if (questions.length === 0) return [];

  const answers = await db
    .select()
    .from(examAnswers)
    .where(
      inArray(
        examAnswers.questionId,
        questions.map((q) => q.id)
      )
    )
    .orderBy(examAnswers.position);

  return questions.map((q) => ({
    ...q,
    answers: answers.filter((a) => a.questionId === q.id),
  }));
}

/** A character's best (or only) attempt at this exam — used to show "already passed" state. */
export async function getExamAttempt(examId: number, characterId: number) {
  const attempts = await db
    .select()
    .from(examAttempts)
    .where(and(eq(examAttempts.examId, examId), eq(examAttempts.characterId, characterId)));
  if (attempts.length === 0) return null;
  // Best attempt — highest score, ties broken by most recent.
  return attempts.sort((a, b) => b.score - a.score || b.takenAt.getTime() - a.takenAt.getTime())[0];
}

/**
 * How many distinct classes a character has passed this in-game year — the
 * headline number for "6 classes to advance." Counts each board once, even
 * with multiple attempts.
 */
export async function getPassedClassCount(characterId: number, year: number): Promise<number> {
  const rows = await db
    .select({ boardId: exams.boardId, passed: examAttempts.passed })
    .from(examAttempts)
    .innerJoin(exams, eq(examAttempts.examId, exams.id))
    .where(and(eq(examAttempts.characterId, characterId), eq(exams.year, year)));

  const passedBoards = new Set(rows.filter((r) => r.passed).map((r) => r.boardId));
  return passedBoards.size;
}

/**
 * Call after recording an exam attempt — advances the character's year if
 * they've now passed enough classes this in-game year, guarded so a flurry
 * of exam attempts in the same summer can't advance them more than once.
 */
export async function maybeAdvanceYear(characterId: number, gameYear: number): Promise<boolean> {
  const [character] = await db
    .select({
      currentYearNumber: characters.currentYearNumber,
      lastYearProgressedInGameYear: characters.lastYearProgressedInGameYear,
    })
    .from(characters)
    .where(eq(characters.id, characterId));
  if (!character) return false;
  if (character.lastYearProgressedInGameYear === gameYear) return false;

  const passedCount = await getPassedClassCount(characterId, gameYear);
  if (passedCount < CLASSES_NEEDED_TO_ADVANCE) return false;

  await db
    .update(characters)
    .set({
      currentYearNumber: character.currentYearNumber + 1,
      lastYearProgressedInGameYear: gameYear,
    })
    .where(eq(characters.id, characterId));

  return true;
}

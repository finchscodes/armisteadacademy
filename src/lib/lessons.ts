import { eq, and, asc, ne, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { lessons, submissions, submissionGrades, boards, characters } from "@/db/schema";
import { REQUIRED_GRADERS } from "@/db/schema";
import type { GradeTier } from "@/lib/grading";

export async function getLessonsForBoard(boardId: number) {
  return db
    .select()
    .from(lessons)
    .where(eq(lessons.boardId, boardId))
    .orderBy(asc(lessons.position), asc(lessons.createdAt));
}

/**
 * Lesson detail for the main lesson page. Deliberately does NOT include other
 * students' submission content — that only becomes visible on the dedicated
 * grading page, which a character opts into by navigating there (and only if
 * they meet the level requirement). This page just shows the lesson itself
 * and the viewer's own submission/grading progress.
 */
export async function getLessonDetail(lessonId: number, currentCharacterId: number | null) {
  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId));
  if (!lesson) return null;

  const [board] = await db.select().from(boards).where(eq(boards.id, lesson.boardId));

  const mySubmission = currentCharacterId
    ? (
        await db
          .select()
          .from(submissions)
          .where(
            and(eq(submissions.lessonId, lessonId), eq(submissions.characterId, currentCharacterId))
          )
      )[0] ?? null
    : null;

  let myGradesReceived = 0;
  let myFeedback: { graderName: string; tier: GradeTier; feedback: string | null }[] = [];

  if (mySubmission) {
    const grades = await db
      .select({
        tier: submissionGrades.tier,
        feedback: submissionGrades.feedback,
        graderName: characters.name,
      })
      .from(submissionGrades)
      .innerJoin(characters, eq(submissionGrades.graderCharacterId, characters.id))
      .where(eq(submissionGrades.submissionId, mySubmission.id));

    myGradesReceived = grades.length;
    if (mySubmission.status === "graded") {
      myFeedback = grades;
    }
  }

  return { lesson, board, mySubmission, myGradesReceived, myFeedback };
}

/**
 * The grading queue for a lesson — every OTHER character's open submission
 * that the viewer hasn't already graded. This is what "opting in to grading"
 * reveals; it's never fetched by the main lesson page.
 */
export async function getGradingQueue(lessonId: number, graderCharacterId: number) {
  const alreadyGraded = await db
    .select({ submissionId: submissionGrades.submissionId })
    .from(submissionGrades)
    .where(eq(submissionGrades.graderCharacterId, graderCharacterId));
  const alreadyGradedIds = alreadyGraded.map((g) => g.submissionId);

  const rows = await db
    .select({
      id: submissions.id,
      content: submissions.content,
      createdAt: submissions.createdAt,
      characterId: submissions.characterId,
      characterName: characters.name,
      characterSlug: characters.slug,
    })
    .from(submissions)
    .innerJoin(characters, eq(submissions.characterId, characters.id))
    .where(
      and(
        eq(submissions.lessonId, lessonId),
        eq(submissions.status, "open"),
        ne(submissions.characterId, graderCharacterId),
        alreadyGradedIds.length > 0 ? notInArray(submissions.id, alreadyGradedIds) : undefined
      )
    )
    .orderBy(asc(submissions.createdAt));

  return rows;
}

export { REQUIRED_GRADERS };

import { eq, and, asc, desc, ne, notInArray, inArray, count } from "drizzle-orm";
import { db } from "@/db";
import { lessons, submissions, submissionGrades, boards, characters } from "@/db/schema";
import { REQUIRED_GRADERS } from "@/db/schema";
import type { GradeTier } from "@/lib/grading";
import { getEnrolledClassBoardIds } from "@/lib/class-enrollments";

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
  const [lesson] = await db.select({ boardId: lessons.boardId }).from(lessons).where(eq(lessons.id, lessonId));
  if (!lesson) return [];

  const enrolledBoardIds = await getEnrolledClassBoardIds(graderCharacterId);
  if (!enrolledBoardIds.includes(lesson.boardId)) return [];

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

/** How many submissions across enrolled classes are waiting for this character to grade. */
export async function getGradingQueueCount(graderCharacterId: number): Promise<number> {
  const enrolledBoardIds = await getEnrolledClassBoardIds(graderCharacterId);
  if (enrolledBoardIds.length === 0) return 0;

  const enrolledLessons = await db
    .select({ id: lessons.id })
    .from(lessons)
    .where(inArray(lessons.boardId, enrolledBoardIds));
  const enrolledLessonIds = enrolledLessons.map((l) => l.id);
  if (enrolledLessonIds.length === 0) return 0;

  const alreadyGraded = await db
    .select({ submissionId: submissionGrades.submissionId })
    .from(submissionGrades)
    .where(eq(submissionGrades.graderCharacterId, graderCharacterId));
  const alreadyGradedIds = alreadyGraded.map((g) => g.submissionId);

  const [row] = await db
    .select({ total: count() })
    .from(submissions)
    .where(
      and(
        eq(submissions.status, "open"),
        ne(submissions.characterId, graderCharacterId),
        inArray(submissions.lessonId, enrolledLessonIds),
        alreadyGradedIds.length > 0 ? notInArray(submissions.id, alreadyGradedIds) : undefined
      )
    );
  return row?.total ?? 0;
}

/**
 * The full "grading bin" — every open submission across this character's
 * enrolled classes waiting for them to grade. Not enrolled in a class? Its
 * homework never shows up here.
 */
export async function getFullGradingQueue(graderCharacterId: number) {
  const enrolledBoardIds = await getEnrolledClassBoardIds(graderCharacterId);
  if (enrolledBoardIds.length === 0) return [];

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
      lessonId: lessons.id,
      lessonTitle: lessons.title,
      boardName: boards.name,
      boardSlug: boards.slug,
    })
    .from(submissions)
    .innerJoin(characters, eq(submissions.characterId, characters.id))
    .innerJoin(lessons, eq(submissions.lessonId, lessons.id))
    .innerJoin(boards, eq(lessons.boardId, boards.id))
    .where(
      and(
        eq(submissions.status, "open"),
        ne(submissions.characterId, graderCharacterId),
        inArray(lessons.boardId, enrolledBoardIds),
        alreadyGradedIds.length > 0 ? notInArray(submissions.id, alreadyGradedIds) : undefined
      )
    )
    .orderBy(asc(submissions.createdAt));

  return rows;
}

/** Every one of this character's own graded submissions — what they earned and on what. */
export async function getMyGradedSubmissions(characterId: number) {
  const rows = await db
    .select({
      id: submissions.id,
      finalTier: submissions.finalTier,
      grade: submissions.grade,
      payout: submissions.payout,
      gradedAt: submissions.gradedAt,
      lessonId: lessons.id,
      lessonTitle: lessons.title,
      boardName: boards.name,
      boardSlug: boards.slug,
    })
    .from(submissions)
    .innerJoin(lessons, eq(submissions.lessonId, lessons.id))
    .innerJoin(boards, eq(lessons.boardId, boards.id))
    .where(and(eq(submissions.characterId, characterId), eq(submissions.status, "graded")))
    .orderBy(desc(submissions.gradedAt));

  return rows;
}

export { REQUIRED_GRADERS };

/** Every submission for a lesson (open or already graded) — instructors can grade or re-grade any of them. */
export async function getAllSubmissionsForLesson(lessonId: number) {
  const rows = await db
    .select({
      id: submissions.id,
      content: submissions.content,
      createdAt: submissions.createdAt,
      status: submissions.status,
      finalTier: submissions.finalTier,
      characterId: submissions.characterId,
      characterName: characters.name,
      characterSlug: characters.slug,
    })
    .from(submissions)
    .innerJoin(characters, eq(submissions.characterId, characters.id))
    .where(eq(submissions.lessonId, lessonId))
    .orderBy(asc(submissions.createdAt));
  return rows;
}

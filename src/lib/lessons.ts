import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { lessons, submissions, boards, characters } from "@/db/schema";

export async function getLessonsForBoard(boardId: number) {
  return db
    .select()
    .from(lessons)
    .where(eq(lessons.boardId, boardId))
    .orderBy(asc(lessons.createdAt));
}

export async function getLessonDetail(lessonId: number, currentCharacterId: number | null) {
  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId));
  if (!lesson) return null;

  const [board] = await db.select().from(boards).where(eq(boards.id, lesson.boardId));

  const allSubmissions = await db
    .select({
      id: submissions.id,
      content: submissions.content,
      status: submissions.status,
      grade: submissions.grade,
      feedback: submissions.feedback,
      payout: submissions.payout,
      createdAt: submissions.createdAt,
      gradedAt: submissions.gradedAt,
      characterId: submissions.characterId,
      characterName: characters.name,
      characterSlug: characters.slug,
      graderCharacterId: submissions.graderCharacterId,
    })
    .from(submissions)
    .innerJoin(characters, eq(submissions.characterId, characters.id))
    .where(eq(submissions.lessonId, lessonId))
    .orderBy(asc(submissions.createdAt));

  // Grader names: a small set of individual lookups (graderCharacterId is nullable,
  // and the grader list per lesson is tiny, so this stays simple and correct).
  const graderIds = [
    ...new Set(allSubmissions.map((s) => s.graderCharacterId).filter((id): id is number => !!id)),
  ];
  const graderMap = new Map<number, string>();
  for (const id of graderIds) {
    const [g] = await db.select({ name: characters.name }).from(characters).where(eq(characters.id, id));
    if (g) graderMap.set(id, g.name);
  }

  const mySubmission = currentCharacterId
    ? allSubmissions.find((s) => s.characterId === currentCharacterId) ?? null
    : null;

  const openSubmissions = allSubmissions.filter(
    (s) => s.status === "open" && s.characterId !== currentCharacterId
  );

  const claimedByMe = currentCharacterId
    ? allSubmissions.filter(
        (s) => s.status === "claimed" && s.graderCharacterId === currentCharacterId
      )
    : [];

  const graded = allSubmissions
    .filter((s) => s.status === "graded")
    .map((s) => ({ ...s, graderName: s.graderCharacterId ? graderMap.get(s.graderCharacterId) : null }));

  return { lesson, board, mySubmission, openSubmissions, claimedByMe, graded };
}

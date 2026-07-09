"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import {
  boards,
  lessons,
  submissions,
  submissionGrades,
  currencyLedger,
  xpLedger,
  characters,
  GRADING_LEVEL_REQUIREMENT,
  REQUIRED_GRADERS,
} from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { canGradeHomework, XP_AWARDS } from "@/lib/xp";
import { isAssignedToClass } from "@/lib/class-assignments";
import { getLessonsTakenCount, GRADUATE_LESSONS_THRESHOLD } from "@/lib/year";
import { GRADUATE_MAJOR, FACULTY_MAJOR } from "@/lib/majors";
import { GRADE_TIER_VALUES, computeConsensus } from "@/lib/grading";
import type { ActionState } from "./auth";

/* -------------------------------------------------------------------------- */
/*  Create a lesson (assigned instructors for that class, or admin)           */
/* -------------------------------------------------------------------------- */

const newLessonSchema = z.object({
  boardSlug: z.string().min(1),
  title: z.string().min(3).max(200),
  prompt: z.string().min(1).max(10000),
  rewardMin: z.coerce.number().int().min(0).max(10000),
  rewardMax: z.coerce.number().int().min(0).max(10000),
  graderFee: z.coerce.number().int().min(0).max(10000),
});

async function requireLessonPermission(session: { isAdmin: boolean }, characterId: number, boardId: number) {
  return session.isAdmin || (await isAssignedToClass(characterId, boardId));
}

export async function createLessonAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { session, characterId } = await requireSessionAndCharacter();

  const parsed = newLessonSchema.safeParse({
    boardSlug: formData.get("boardSlug"),
    title: formData.get("title"),
    prompt: formData.get("prompt"),
    rewardMin: formData.get("rewardMin"),
    rewardMax: formData.get("rewardMax"),
    graderFee: formData.get("graderFee"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { boardSlug, title, prompt, rewardMin, rewardMax, graderFee } = parsed.data;

  if (rewardMin > rewardMax) {
    return { error: "Minimum reward can't be greater than maximum reward" };
  }

  const [board] = await db.select().from(boards).where(eq(boards.slug, boardSlug));
  if (!board) return { error: "That board no longer exists" };

  const allowed = await requireLessonPermission(session, characterId, board.id);
  if (!allowed) {
    return { error: "You're not assigned to teach this class" };
  }

  const existingLessons = await db
    .select({ id: lessons.id })
    .from(lessons)
    .where(eq(lessons.boardId, board.id));

  const [lesson] = await db
    .insert(lessons)
    .values({
      boardId: board.id,
      title,
      prompt,
      createdByUserId: session.userId,
      position: existingLessons.length,
      rewardMin,
      rewardMax,
      graderFee,
    })
    .returning({ id: lessons.id });

  revalidatePath(`/b/${boardSlug}`);
  redirect(`/lesson/${lesson.id}`);
}

/* -------------------------------------------------------------------------- */
/*  Edit / delete / reorder a lesson                                          */
/* -------------------------------------------------------------------------- */

const editLessonSchema = z.object({
  lessonId: z.coerce.number().int(),
  title: z.string().min(3).max(200),
  prompt: z.string().min(1).max(10000),
  rewardMin: z.coerce.number().int().min(0).max(10000),
  rewardMax: z.coerce.number().int().min(0).max(10000),
  graderFee: z.coerce.number().int().min(0).max(10000),
});

export async function updateLessonAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { session, characterId } = await requireSessionAndCharacter();

  const parsed = editLessonSchema.safeParse({
    lessonId: formData.get("lessonId"),
    title: formData.get("title"),
    prompt: formData.get("prompt"),
    rewardMin: formData.get("rewardMin"),
    rewardMax: formData.get("rewardMax"),
    graderFee: formData.get("graderFee"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { lessonId, title, prompt, rewardMin, rewardMax, graderFee } = parsed.data;
  if (rewardMin > rewardMax) {
    return { error: "Minimum reward can't be greater than maximum reward" };
  }

  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId));
  if (!lesson) return { error: "That lesson no longer exists" };

  const allowed = await requireLessonPermission(session, characterId, lesson.boardId);
  if (!allowed) return { error: "You're not assigned to teach this class" };

  await db
    .update(lessons)
    .set({ title, prompt, rewardMin, rewardMax, graderFee })
    .where(eq(lessons.id, lessonId));

  revalidatePath(`/lesson/${lessonId}`);
  redirect(`/lesson/${lessonId}`);
}

export async function deleteLessonAction(formData: FormData) {
  const { session, characterId } = await requireSessionAndCharacter();
  const lessonId = Number(formData.get("lessonId"));
  if (!lessonId) return;

  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId));
  if (!lesson) return;

  const allowed = await requireLessonPermission(session, characterId, lesson.boardId);
  if (!allowed) return;

  const [board] = await db.select({ slug: boards.slug }).from(boards).where(eq(boards.id, lesson.boardId));
  await db.delete(lessons).where(eq(lessons.id, lessonId));

  revalidatePath(`/b/${board?.slug ?? ""}`);
  redirect(`/b/${board?.slug ?? ""}`);
}

/** Swap this lesson's position with the one above or below it in its board. */
export async function reorderLessonAction(formData: FormData) {
  const { session, characterId } = await requireSessionAndCharacter();
  const lessonId = Number(formData.get("lessonId"));
  const direction = formData.get("direction"); // "up" | "down"
  if (!lessonId || (direction !== "up" && direction !== "down")) return;

  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId));
  if (!lesson) return;

  const allowed = await requireLessonPermission(session, characterId, lesson.boardId);
  if (!allowed) return;

  const siblings = await db
    .select({ id: lessons.id })
    .from(lessons)
    .where(eq(lessons.boardId, lesson.boardId))
    .orderBy(asc(lessons.position), asc(lessons.createdAt));

  const index = siblings.findIndex((s) => s.id === lessonId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= siblings.length) return;

  // Renumber everyone to their current display-order index, then swap the two
  // being moved. This also self-heals lessons that still share the same
  // leftover default position value from before reordering existed — without
  // this, swapping two rows that both happen to be "0" is a no-op.
  for (let i = 0; i < siblings.length; i++) {
    if (i === index || i === swapIndex) continue;
    await db.update(lessons).set({ position: i }).where(eq(lessons.id, siblings[i].id));
  }
  await db.update(lessons).set({ position: swapIndex }).where(eq(lessons.id, siblings[index].id));
  await db.update(lessons).set({ position: index }).where(eq(lessons.id, siblings[swapIndex].id));

  const [board] = await db.select({ slug: boards.slug }).from(boards).where(eq(boards.id, lesson.boardId));
  revalidatePath(`/b/${board?.slug ?? ""}`);
}

/* -------------------------------------------------------------------------- */
/*  Submit homework                                                           */
/* -------------------------------------------------------------------------- */

const submitHomeworkSchema = z.object({
  lessonId: z.coerce.number().int(),
  content: z.string().min(1, "Your answer can't be empty").max(20000),
});

export async function submitHomeworkAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { characterId } = await requireSessionAndCharacter();

  const parsed = submitHomeworkSchema.safeParse({
    lessonId: formData.get("lessonId"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { lessonId, content } = parsed.data;

  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId));
  if (!lesson) return { error: "That lesson no longer exists" };

  const [existing] = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(and(eq(submissions.lessonId, lessonId), eq(submissions.characterId, characterId)));
  if (existing) {
    return { error: "You've already submitted homework for this lesson" };
  }

  await db.insert(submissions).values({
    lessonId,
    characterId,
    content,
  });

  await db.insert(xpLedger).values({
    characterId,
    amount: XP_AWARDS.homework_submission,
    reason: "homework_submission",
    note: `Submitted homework for "${lesson.title}"`,
  });

  // Graduate is earned automatically, never chosen — once a character crosses
  // the lesson-count threshold, promote them (unless they're Faculty, who
  // don't progress through years at all).
  const lessonsTaken = await getLessonsTakenCount(characterId);
  if (lessonsTaken >= GRADUATE_LESSONS_THRESHOLD) {
    const [character] = await db
      .select({ major: characters.major })
      .from(characters)
      .where(eq(characters.id, characterId));
    if (character && character.major !== FACULTY_MAJOR && character.major !== GRADUATE_MAJOR) {
      await db
        .update(characters)
        .set({ major: GRADUATE_MAJOR })
        .where(eq(characters.id, characterId));
    }
  }

  revalidatePath(`/lesson/${lessonId}`);
  redirect(`/lesson/${lessonId}`);
}

/* -------------------------------------------------------------------------- */
/*  Grade a submission — one of REQUIRED_GRADERS independent graders          */
/* -------------------------------------------------------------------------- */

const gradeSchema = z.object({
  submissionId: z.coerce.number().int(),
  tier: z.enum(GRADE_TIER_VALUES),
  feedback: z.string().max(4000).optional(),
});

export async function gradeSubmissionAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { characterId } = await requireSessionAndCharacter();

  const parsed = gradeSchema.safeParse({
    submissionId: formData.get("submissionId"),
    tier: formData.get("tier"),
    feedback: formData.get("feedback") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { submissionId, tier, feedback } = parsed.data;

  const eligible = await canGradeHomework(characterId);
  if (!eligible) {
    return { error: `You need to be level ${GRADING_LEVEL_REQUIREMENT} to grade homework` };
  }

  const [submission] = await db.select().from(submissions).where(eq(submissions.id, submissionId));
  if (!submission) return { error: "That submission no longer exists" };
  if (submission.status !== "open") return { error: "This submission is already fully graded" };
  if (submission.characterId === characterId) return { error: "You can't grade your own homework" };

  const [alreadyGraded] = await db
    .select({ id: submissionGrades.id })
    .from(submissionGrades)
    .where(
      and(
        eq(submissionGrades.submissionId, submissionId),
        eq(submissionGrades.graderCharacterId, characterId)
      )
    );
  if (alreadyGraded) return { error: "You've already graded this submission" };

  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, submission.lessonId));
  if (!lesson) return { error: "The lesson for this submission no longer exists" };

  await db.insert(submissionGrades).values({
    submissionId,
    graderCharacterId: characterId,
    tier,
    feedback,
  });

  // Every grader earns their fee + XP for the work, independent of consensus.
  await db.insert(currencyLedger).values({
    characterId,
    amount: lesson.graderFee,
    reason: "grading_payment",
    relatedSubmissionId: submissionId,
    note: `Graded a submission for "${lesson.title}"`,
  });
  await db.insert(xpLedger).values({
    characterId,
    amount: XP_AWARDS.grading,
    reason: "grading",
    relatedSubmissionId: submissionId,
    note: `Graded a submission for "${lesson.title}"`,
  });

  // Once REQUIRED_GRADERS have weighed in, compute the consensus and pay out.
  const allGrades = await db
    .select({ tier: submissionGrades.tier })
    .from(submissionGrades)
    .where(eq(submissionGrades.submissionId, submissionId));

  if (allGrades.length >= REQUIRED_GRADERS) {
    const { tier: finalTier, numeric } = computeConsensus(allGrades.map((g) => g.tier));
    const payout = Math.round(lesson.rewardMin + (lesson.rewardMax - lesson.rewardMin) * (numeric / 100));

    await db
      .update(submissions)
      .set({ status: "graded", finalTier, grade: numeric, payout, gradedAt: new Date() })
      .where(eq(submissions.id, submissionId));

    await db.insert(currencyLedger).values({
      characterId: submission.characterId,
      amount: payout,
      reason: "grading_reward",
      relatedSubmissionId: submissionId,
      note: `Graded "${finalTier}" (consensus) on "${lesson.title}"`,
    });
  }

  revalidatePath(`/lesson/${lesson.id}`);
  revalidatePath(`/lesson/${lesson.id}/grade`);
  redirect(`/lesson/${lesson.id}/grade`);
}

"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  boards,
  lessons,
  submissions,
  currencyLedger,
  xpLedger,
  characters,
  GRADING_LEVEL_REQUIREMENT,
} from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { canGradeHomework, XP_AWARDS } from "@/lib/xp";
import { isAssignedToClass } from "@/lib/class-assignments";
import { getLessonsTakenCount, GRADUATE_LESSONS_THRESHOLD } from "@/lib/year";
import { GRADUATE_MAJOR, FACULTY_MAJOR } from "@/lib/majors";
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

  // Permission: admins can post to any class; everyone else must be assigned
  // (with their active character) to this specific class board.
  const allowed = session.isAdmin || (await isAssignedToClass(characterId, board.id));
  if (!allowed) {
    return { error: "You're not assigned to teach this class" };
  }

  const [lesson] = await db
    .insert(lessons)
    .values({
      boardId: board.id,
      title,
      prompt,
      createdByUserId: session.userId,
      rewardMin,
      rewardMax,
      graderFee,
    })
    .returning({ id: lessons.id });

  revalidatePath(`/b/${boardSlug}`);
  redirect(`/lesson/${lesson.id}`);
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
/*  Claim a submission to grade                                               */
/* -------------------------------------------------------------------------- */

export async function claimSubmissionAction(formData: FormData) {
  const { characterId } = await requireSessionAndCharacter();
  const submissionId = Number(formData.get("submissionId"));
  if (!submissionId) return;

  const eligible = await canGradeHomework(characterId);
  if (!eligible) {
    // The UI already hides the claim button below the level requirement;
    // this is a server-side backstop against a crafted request.
    return;
  }

  const [submission] = await db.select().from(submissions).where(eq(submissions.id, submissionId));
  if (!submission || submission.status !== "open") return;
  if (submission.characterId === characterId) return; // can't grade your own homework

  await db
    .update(submissions)
    .set({ status: "claimed", graderCharacterId: characterId })
    .where(eq(submissions.id, submissionId));

  revalidatePath(`/lesson/${submission.lessonId}`);
}

/* -------------------------------------------------------------------------- */
/*  Grade a claimed submission                                                */
/* -------------------------------------------------------------------------- */

const gradeSchema = z.object({
  submissionId: z.coerce.number().int(),
  grade: z.coerce.number().int().min(0).max(100),
  feedback: z.string().max(4000).optional(),
});

export async function gradeSubmissionAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { characterId } = await requireSessionAndCharacter();

  const parsed = gradeSchema.safeParse({
    submissionId: formData.get("submissionId"),
    grade: formData.get("grade"),
    feedback: formData.get("feedback") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { submissionId, grade, feedback } = parsed.data;

  const [submission] = await db.select().from(submissions).where(eq(submissions.id, submissionId));
  if (!submission) return { error: "That submission no longer exists" };
  if (submission.status !== "claimed" || submission.graderCharacterId !== characterId) {
    return { error: "You don't have this submission claimed" };
  }

  const eligible = await canGradeHomework(characterId);
  if (!eligible) {
    return { error: `You need to be level ${GRADING_LEVEL_REQUIREMENT} to grade homework` };
  }

  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, submission.lessonId));
  if (!lesson) return { error: "The lesson for this submission no longer exists" };

  const payout = Math.round(lesson.rewardMin + (lesson.rewardMax - lesson.rewardMin) * (grade / 100));

  await db
    .update(submissions)
    .set({ status: "graded", grade, feedback, payout, gradedAt: new Date() })
    .where(eq(submissions.id, submissionId));

  await db.insert(currencyLedger).values([
    {
      characterId: submission.characterId,
      amount: payout,
      reason: "grading_reward",
      relatedSubmissionId: submissionId,
      note: `Graded ${grade}/100 on "${lesson.title}"`,
    },
    {
      characterId,
      amount: lesson.graderFee,
      reason: "grading_payment",
      relatedSubmissionId: submissionId,
      note: `Graded a submission for "${lesson.title}"`,
    },
  ]);

  await db.insert(xpLedger).values({
    characterId,
    amount: XP_AWARDS.grading,
    reason: "grading",
    relatedSubmissionId: submissionId,
    note: `Graded a submission for "${lesson.title}"`,
  });

  revalidatePath(`/lesson/${submission.lessonId}`);
  redirect(`/lesson/${submission.lessonId}`);
}

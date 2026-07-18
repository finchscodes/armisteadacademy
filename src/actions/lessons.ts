"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and, sum } from "drizzle-orm";
import { db } from "@/db";
import {
  boards,
  lessons,
  submissions,
  submissionGrades,
  currencyLedger,
  reputationLedger,
  classEnrollments,
  characters,
  inventory,
  GRADING_LEVEL_REQUIREMENT,
  REQUIRED_GRADERS,
} from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { canGradeHomework, XP_AWARDS, awardXp } from "@/lib/xp";
import { awardReputation, REPUTATION_AWARDS, GRADE_TIER_REPUTATION } from "@/lib/reputation";
import { isAssignedToClass } from "@/lib/class-assignments";
import { isEnrolledInClass } from "@/lib/class-enrollments";
import { GRADE_TIER_VALUES, GRADE_TIER_META, computeConsensus, computePayout, tierLabel } from "@/lib/grading";
import { createNotification } from "@/lib/notifications";
import { sanitizeRichText, richTextLength } from "@/lib/sanitize";
import { isFainted } from "@/lib/needs";
import type { ActionState } from "./auth";

/* -------------------------------------------------------------------------- */
/*  Enroll in a class — required before lessons open up                       */
/* -------------------------------------------------------------------------- */

export async function enrollInClassAction(formData: FormData) {
  const { characterId } = await requireSessionAndCharacter();
  const boardId = Number(formData.get("boardId"));
  if (!boardId) return;

  const [board] = await db
    .select({
      slug: boards.slug,
      restrictedYearMin: boards.restrictedYearMin,
      restrictedYearMax: boards.restrictedYearMax,
      requiredItemId: boards.requiredItemId,
    })
    .from(boards)
    .where(eq(boards.id, boardId));
  if (!board) return;

  if (board.restrictedYearMin || board.restrictedYearMax) {
    const [character] = await db
      .select({ currentYearNumber: characters.currentYearNumber })
      .from(characters)
      .where(eq(characters.id, characterId));
    const yearNumber = character?.currentYearNumber ?? 1;
    const belowMin = board.restrictedYearMin != null && yearNumber < board.restrictedYearMin;
    const aboveMax = board.restrictedYearMax != null && yearNumber > board.restrictedYearMax;
    if (belowMin || aboveMax) {
      redirect(`/b/${board.slug}?enrollError=${encodeURIComponent("Not the right year to enroll in this class")}`);
    }
  }

  if (board.requiredItemId) {
    const [owned] = await db
      .select({ id: inventory.id })
      .from(inventory)
      .where(and(eq(inventory.characterId, characterId), eq(inventory.itemId, board.requiredItemId)));
    if (!owned) {
      redirect(`/b/${board.slug}?enrollError=${encodeURIComponent("You need a specific item in your Arsenal to enroll")}`);
    }
  }

  await db.insert(classEnrollments).values({ characterId, boardId }).onConflictDoNothing();

  revalidatePath(`/b/${board.slug}`);
}

/* -------------------------------------------------------------------------- */
/*  Create a lesson (assigned instructors for that class, or admin)           */
/* -------------------------------------------------------------------------- */

const newLessonSchema = z.object({
  boardSlug: z.string().min(1),
  title: z.string().min(3).max(200),
  prompt: z.string().min(1).max(60000).refine((v) => richTextLength(v) > 0, "Prompt can't be empty"),
  requirements: z.string().max(20000).optional().or(z.literal("")),
  reward: z.coerce.number().int().min(0).max(10000),
  graderFee: z.coerce.number().int().min(0).max(10000),
  restrictedYearMin: z.coerce.number().int().min(1).optional(),
  restrictedYearMax: z.coerce.number().int().min(1).optional(),
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
    requirements: formData.get("requirements") || undefined,
    reward: formData.get("reward"),
    graderFee: formData.get("graderFee"),
    restrictedYearMin: formData.get("restrictedYearMin") || undefined,
    restrictedYearMax: formData.get("restrictedYearMax") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { boardSlug, title, reward, graderFee, restrictedYearMin, restrictedYearMax } = parsed.data;
  const prompt = sanitizeRichText(parsed.data.prompt);
  const requirements = parsed.data.requirements ? sanitizeRichText(parsed.data.requirements) : null;

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
      requirements,
      createdByUserId: session.userId,
      position: existingLessons.length,
      reward,
      graderFee,
      restrictedYearMin: restrictedYearMin ?? null,
      restrictedYearMax: restrictedYearMax ?? null,
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
  prompt: z.string().min(1).max(60000).refine((v) => richTextLength(v) > 0, "Prompt can't be empty"),
  requirements: z.string().max(20000).optional().or(z.literal("")),
  reward: z.coerce.number().int().min(0).max(10000),
  graderFee: z.coerce.number().int().min(0).max(10000),
  restrictedYearMin: z.coerce.number().int().min(1).optional(),
  restrictedYearMax: z.coerce.number().int().min(1).optional(),
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
    requirements: formData.get("requirements") || undefined,
    reward: formData.get("reward"),
    graderFee: formData.get("graderFee"),
    restrictedYearMin: formData.get("restrictedYearMin") || undefined,
    restrictedYearMax: formData.get("restrictedYearMax") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { lessonId, title, reward, graderFee, restrictedYearMin, restrictedYearMax } = parsed.data;
  const prompt = sanitizeRichText(parsed.data.prompt);
  const requirements = parsed.data.requirements ? sanitizeRichText(parsed.data.requirements) : null;

  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId));
  if (!lesson) return { error: "That lesson no longer exists" };

  const allowed = await requireLessonPermission(session, characterId, lesson.boardId);
  if (!allowed) return { error: "You're not assigned to teach this class" };

  await db
    .update(lessons)
    .set({
      title,
      prompt,
      requirements,
      reward,
      graderFee,
      restrictedYearMin: restrictedYearMin ?? null,
      restrictedYearMax: restrictedYearMax ?? null,
    })
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

/**
 * Set the full order for a board's lessons at once — used by drag-and-drop.
 * `orderedIds` is every lesson id in that board, in the new desired order.
 */
export async function reorderLessonsBulkAction(formData: FormData) {
  const { session, characterId } = await requireSessionAndCharacter();
  const boardId = Number(formData.get("boardId"));
  const orderedIdsRaw = formData.get("orderedIds");
  if (!boardId || typeof orderedIdsRaw !== "string") return;

  const allowed = await requireLessonPermission(session, characterId, boardId);
  if (!allowed) return;

  const orderedIds = orderedIdsRaw
    .split(",")
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n));

  // Only touch lessons that actually belong to this board — a crafted
  // request can't reorder lessons elsewhere.
  const actual = await db
    .select({ id: lessons.id })
    .from(lessons)
    .where(eq(lessons.boardId, boardId));
  const actualIds = new Set(actual.map((l) => l.id));

  let position = 0;
  for (const id of orderedIds) {
    if (!actualIds.has(id)) continue;
    await db.update(lessons).set({ position }).where(eq(lessons.id, id));
    position++;
  }

  const [board] = await db.select({ slug: boards.slug }).from(boards).where(eq(boards.id, boardId));
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

  if (await isFainted(characterId)) {
    return { error: "Too faint from hunger or thirst to do this right now — eat or drink something." };
  }

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

  const enrolled = await isEnrolledInClass(characterId, lesson.boardId);
  if (!enrolled) {
    return { error: "You need to enroll in this class before submitting homework" };
  }

  if (lesson.restrictedYearMin != null || lesson.restrictedYearMax != null) {
    const [character] = await db
      .select({ currentYearNumber: characters.currentYearNumber })
      .from(characters)
      .where(eq(characters.id, characterId));
    const yearNumber = character?.currentYearNumber ?? 1;
    const belowMin = lesson.restrictedYearMin != null && yearNumber < lesson.restrictedYearMin;
    const aboveMax = lesson.restrictedYearMax != null && yearNumber > lesson.restrictedYearMax;
    if (belowMin || aboveMax) {
      return { error: "This assignment isn't available for your year" };
    }
  }

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

  await awardXp({
    characterId,
    amount: XP_AWARDS.homework_submission,
    reason: "homework_submission",
    note: `Submitted homework for "${lesson.title}"`,
  });

  await awardReputation(
    characterId,
    REPUTATION_AWARDS.homework_submission,
    "homework_submission",
    `Submitted homework for "${lesson.title}"`
  );

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

  if (await isFainted(characterId)) {
    return { error: "Too faint from hunger or thirst to do this right now — eat or drink something." };
  }

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
  await awardXp({
    characterId,
    amount: XP_AWARDS.grading,
    reason: "grading",
    relatedSubmissionId: submissionId,
    note: `Graded a submission for "${lesson.title}"`,
  });
  await awardReputation(
    characterId,
    REPUTATION_AWARDS.grading,
    "grading",
    `Graded a submission for "${lesson.title}"`,
    submissionId
  );

  // Once REQUIRED_GRADERS have weighed in, compute the consensus and pay out.
  const allGrades = await db
    .select({ tier: submissionGrades.tier })
    .from(submissionGrades)
    .where(eq(submissionGrades.submissionId, submissionId));

  if (allGrades.length >= REQUIRED_GRADERS) {
    const { tier: finalTier, numeric } = computeConsensus(allGrades.map((g) => g.tier));
    const payout = computePayout(lesson.reward, finalTier);

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

    await createNotification(
      submission.characterId,
      "homework_graded",
      `Your homework for "${lesson.title}" was graded: ${tierLabel(finalTier)}`,
      "/grading"
    );
  }

  revalidatePath(`/lesson/${lesson.id}`);
  revalidatePath(`/lesson/${lesson.id}/grade`);
  redirect(`/lesson/${lesson.id}/grade`);
}

/* -------------------------------------------------------------------------- */
/*  Instructor grading — bypasses peer consensus entirely                     */
/*                                                                            */
/*  An Instructor or Assistant Instructor scoped to a class can grade its    */
/*  submissions at any time, and their tier IS the final grade immediately — */
/*  no waiting on REQUIRED_GRADERS peers. They can also re-grade afterward;  */
/*  each re-grade recomputes the payout and reputation bonus as a delta      */
/*  against whatever was already given, the same way the admin override does.*/
/* -------------------------------------------------------------------------- */

export async function instructorGradeSubmissionAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { characterId } = await requireSessionAndCharacter();

  if (await isFainted(characterId)) {
    return { error: "Too faint from hunger or thirst to do this right now — eat or drink something." };
  }

  const parsed = gradeSchema.safeParse({
    submissionId: formData.get("submissionId"),
    tier: formData.get("tier"),
    feedback: formData.get("feedback") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { submissionId, tier, feedback } = parsed.data;

  const [submission] = await db.select().from(submissions).where(eq(submissions.id, submissionId));
  if (!submission) return { error: "That submission no longer exists" };
  if (submission.characterId === characterId) return { error: "You can't grade your own homework" };

  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, submission.lessonId));
  if (!lesson) return { error: "The lesson for this submission no longer exists" };

  const isInstructor = await isAssignedToClass(characterId, lesson.boardId);
  if (!isInstructor) {
    return { error: "Only an Instructor or Assistant Instructor for this class can do that" };
  }

  const [existingGrade] = await db
    .select({ id: submissionGrades.id })
    .from(submissionGrades)
    .where(
      and(
        eq(submissionGrades.submissionId, submissionId),
        eq(submissionGrades.graderCharacterId, characterId)
      )
    );

  if (existingGrade) {
    await db
      .update(submissionGrades)
      .set({ tier, feedback })
      .where(eq(submissionGrades.id, existingGrade.id));
  } else {
    await db.insert(submissionGrades).values({
      submissionId,
      graderCharacterId: characterId,
      tier,
      feedback,
    });
    // Grading fee/XP/participation reputation only apply once per grader —
    // re-grading isn't "grading again", it's correcting the same review.
    await db.insert(currencyLedger).values({
      characterId,
      amount: lesson.graderFee,
      reason: "grading_payment",
      relatedSubmissionId: submissionId,
      note: `Graded a submission for "${lesson.title}"`,
    });
    await awardXp({
      characterId,
      amount: XP_AWARDS.grading,
      reason: "grading",
      relatedSubmissionId: submissionId,
      note: `Graded a submission for "${lesson.title}"`,
    });
    await awardReputation(
      characterId,
      REPUTATION_AWARDS.grading,
      "grading",
      `Graded a submission for "${lesson.title}"`,
      submissionId
    );
  }

  const numeric = GRADE_TIER_META[tier].numeric;
  const newPayout = computePayout(lesson.reward, tier);
  const oldPayout = submission.payout ?? 0;
  const moneyDelta = newPayout - oldPayout;

  await db
    .update(submissions)
    .set({ status: "graded", finalTier: tier, grade: numeric, payout: newPayout, gradedAt: new Date() })
    .where(eq(submissions.id, submissionId));

  if (moneyDelta !== 0) {
    await db.insert(currencyLedger).values({
      characterId: submission.characterId,
      amount: moneyDelta,
      reason: "grading_reward",
      relatedSubmissionId: submissionId,
      note: `Graded "${tier}" by instructor on "${lesson.title}"`,
    });
  }

  // Tier-based reputation bonus for the submitter — separate scale from
  // money, static regardless of the lesson's own reward. Delta-adjusted the
  // same way, so re-grading doesn't double-award.
  const [priorRepRow] = await db
    .select({ total: sum(reputationLedger.amount) })
    .from(reputationLedger)
    .where(
      and(eq(reputationLedger.relatedSubmissionId, submissionId), eq(reputationLedger.reason, "homework_graded"))
    );
  const priorReputation = Number(priorRepRow?.total ?? 0);
  const newReputation = GRADE_TIER_REPUTATION[tier] ?? 0;
  const reputationDelta = newReputation - priorReputation;
  if (reputationDelta !== 0) {
    await awardReputation(
      submission.characterId,
      reputationDelta,
      "homework_graded",
      `Graded "${tier}" on "${lesson.title}"`,
      submissionId
    );
  }

  await createNotification(
    submission.characterId,
    "homework_graded",
    `Your homework for "${lesson.title}" was graded: ${tierLabel(tier)}`,
    "/grading"
  );

  revalidatePath(`/lesson/${lesson.id}`);
  revalidatePath(`/lesson/${lesson.id}/grade`);
  return undefined;
}

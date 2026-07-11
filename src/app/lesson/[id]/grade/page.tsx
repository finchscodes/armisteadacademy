import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { lessons } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getGradingQueue, getAllSubmissionsForLesson } from "@/lib/lessons";
import { getCurrentUser } from "@/lib/current-user";
import { canGradeHomework } from "@/lib/xp";
import { isAssignedToClass } from "@/lib/class-assignments";
import { GRADING_LEVEL_REQUIREMENT } from "@/db/schema";
import { GradeForm } from "@/components/grade-form";
import { InstructorGradeForm } from "@/components/instructor-grade-form";
import { CharacterHoverCard } from "@/components/character-hover-card";
import { tierLabel, type GradeTier } from "@/lib/grading";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

export default async function GradingQueuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const activeCharacterId = current.activeCharacter?.id ?? null;
  if (!activeCharacterId) redirect("/characters");

  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, Number(id)));
  if (!lesson) notFound();

  const isInstructor = await isAssignedToClass(activeCharacterId, lesson.boardId);
  const eligible = isInstructor || (await canGradeHomework(activeCharacterId));
  if (!eligible) {
    redirect(`/lesson/${lesson.id}`);
  }

  if (isInstructor) {
    const allSubmissions = await getAllSubmissionsForLesson(lesson.id);
    return (
      <div className="max-w-2xl mx-auto">
        <Link href={`/lesson/${lesson.id}`} className="text-sm text-ink-400 hover:text-brass-400">
          &larr; {lesson.title}
        </Link>
        <h1 className="font-display text-3xl text-brass-400 mt-2 mb-1">Instructor grading</h1>
        <p className="text-xs text-ink-400 mb-6">
          As an instructor for this class, your grade finalizes a submission immediately — no need to
          wait on other graders. You can change it again any time.
        </p>

        {allSubmissions.length === 0 ? (
          <p className="text-sm text-ink-400">No submissions yet.</p>
        ) : (
          <div className="space-y-4">
            {allSubmissions.map((s) => (
              <div key={s.id} className="bg-ink-900 border border-ink-700 rounded-lg p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-ink-400">
                    by{" "}
                    <CharacterHoverCard characterId={s.characterId} slug={s.characterSlug} className="relative inline">
                      <Link href={`/c/${s.characterSlug}`} className="hover:text-brass-400">
                        {s.characterName}
                      </Link>
                    </CharacterHoverCard>
                  </p>
                  {s.status === "graded" && s.finalTier && (
                    <span className="text-xs text-brass-400">Current: {tierLabel(s.finalTier as GradeTier)}</span>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm text-parchment-100/90">{s.content}</p>
                <InstructorGradeForm submissionId={s.id} currentTier={(s.finalTier as GradeTier) ?? null} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // This IS the opt-in: navigating here is the only way to see anyone else's
  // submission content. The main lesson page never includes it.
  const queue = await getGradingQueue(lesson.id, activeCharacterId);

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/lesson/${lesson.id}`} className="text-sm text-ink-400 hover:text-brass-400">
        &larr; {lesson.title}
      </Link>
      <h1 className="font-display text-3xl text-brass-400 mt-2 mb-1">Grading queue</h1>
      <p className="text-xs text-ink-400 mb-6">
        Reach level {GRADING_LEVEL_REQUIREMENT}+ and grade honestly — four independent graders
        review each submission, and the final grade is their consensus.
      </p>

      {queue.length === 0 ? (
        <p className="text-sm text-ink-400">
          Nothing to grade right now. Check back once more homework comes in.
        </p>
      ) : (
        <div className="space-y-4">
          {queue.map((s) => (
            <div key={s.id} className="bg-ink-900 border border-ink-700 rounded-lg p-5">
              <p className="text-xs text-ink-400 mb-2">
                by{" "}
                <CharacterHoverCard characterId={s.characterId} slug={s.characterSlug} className="relative inline">
                  <Link href={`/c/${s.characterSlug}`} className="hover:text-brass-400">
                    {s.characterName}
                  </Link>
                </CharacterHoverCard>
              </p>
              <p className="whitespace-pre-wrap text-sm text-parchment-100/90">{s.content}</p>
              <GradeForm submissionId={s.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

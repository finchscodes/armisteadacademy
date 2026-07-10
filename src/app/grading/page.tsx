import Link from "next/link";
import { redirect } from "next/navigation";
import { getFullGradingQueue, getMyGradedSubmissions } from "@/lib/lessons";
import { getCurrentUser } from "@/lib/current-user";
import { canGradeHomework } from "@/lib/xp";
import { GRADING_LEVEL_REQUIREMENT } from "@/db/schema";
import { GradeForm } from "@/components/grade-form";
import { tierLabel, tierColor, type GradeTier } from "@/lib/grading";

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default async function GradingBinPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const activeCharacterId = current.activeCharacter?.id ?? null;
  if (!activeCharacterId) redirect("/characters");

  const eligible = await canGradeHomework(activeCharacterId);
  const [queue, myResults] = await Promise.all([
    eligible ? getFullGradingQueue(activeCharacterId) : Promise.resolve([]),
    getMyGradedSubmissions(activeCharacterId),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div>
        <h1 className="font-display text-3xl text-brass-400 mb-1">Grading</h1>
        <p className="text-xs text-ink-400">
          Grades on your own homework, and — once you reach level{" "}
          {GRADING_LEVEL_REQUIREMENT}+ — a queue of everyone else&apos;s open submissions waiting
          on a grader.
        </p>
      </div>

      {eligible && (
        <div>
          <h2 className="font-display text-lg text-parchment-100 mb-3">
            Grading bin <span className="text-ink-400 text-sm">({queue.length})</span>
          </h2>
          {queue.length === 0 ? (
            <p className="text-sm text-ink-400">
              Nothing to grade right now. Check back once more homework comes in.
            </p>
          ) : (
            <div className="space-y-4">
              {queue.map((s) => (
                <div key={s.id} className="bg-ink-900 border border-ink-700 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-ink-400">
                      by{" "}
                      <Link href={`/c/${s.characterSlug}`} className="hover:text-brass-400">
                        {s.characterName}
                      </Link>
                    </p>
                    <Link
                      href={`/b/${s.boardSlug}`}
                      className="text-[10px] uppercase tracking-wider text-ink-400 border border-ink-600 rounded px-2 py-0.5 hover:border-brass-500/50"
                    >
                      {s.boardName}
                    </Link>
                  </div>
                  <p className="text-xs text-brass-400 mb-2">{s.lessonTitle}</p>
                  <p className="whitespace-pre-wrap text-sm text-parchment-100/90">{s.content}</p>
                  <GradeForm submissionId={s.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="font-display text-lg text-parchment-100 mb-3">Your results</h2>
        {myResults.length === 0 ? (
          <p className="text-sm text-ink-400">Nothing graded yet — submit some homework first.</p>
        ) : (
          <div className="bg-ink-900 border border-ink-700 rounded-lg divide-y divide-ink-700">
            {myResults.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/lesson/${s.lessonId}`}
                    className="text-sm text-parchment-100 hover:text-brass-400"
                  >
                    {s.lessonTitle}
                  </Link>
                  <p className="text-xs text-ink-400 mt-0.5">
                    {s.boardName} &middot; {s.gradedAt ? timeAgo(s.gradedAt) : ""}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  {s.finalTier && (
                    <p className="text-sm font-medium" style={{ color: tierColor(s.finalTier as GradeTier) }}>
                      {tierLabel(s.finalTier as GradeTier)}
                    </p>
                  )}
                  <p className="text-xs text-brass-400">
                    {s.grade} &middot; {s.payout} dollars
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { getRecentGradedSubmissions } from "@/actions/admin";
import { AdminGradeEditor } from "@/components/admin-grade-editor";
import { tierLabel, tierColor, type GradeTier } from "@/lib/grading";

export default async function AdminGradingPage() {
  const submissions = await getRecentGradedSubmissions();

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-ink-400 mb-4">
        Recent graded submissions — change the final tier and the payout adjusts automatically
        (the difference is added or removed as a ledger entry, nothing is overwritten silently).
      </p>

      {submissions.length === 0 ? (
        <p className="text-sm text-ink-400">Nothing graded yet.</p>
      ) : (
        <div className="bg-ink-900 border border-ink-700 rounded-lg divide-y divide-ink-700">
          {submissions.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="min-w-0">
                <p className="text-sm text-parchment-100">
                  <Link href={`/c/${s.characterSlug}`} className="hover:text-brass-400">
                    {s.characterFirstName} {s.characterLastName}
                  </Link>
                  <span className="text-ink-400"> &middot; </span>
                  <Link href={`/lesson/${s.lessonId}`} className="text-brass-400 hover:underline">
                    {s.lessonTitle}
                  </Link>
                </p>
                <p className="text-xs text-ink-400 mt-0.5">
                  {s.boardName} &middot; {s.payout} dollars
                  {s.finalTier && (
                    <>
                      {" "}
                      &middot;{" "}
                      <span style={{ color: tierColor(s.finalTier as GradeTier) }}>
                        {tierLabel(s.finalTier as GradeTier)}
                      </span>
                    </>
                  )}
                </p>
              </div>
              {s.finalTier && (
                <AdminGradeEditor submissionId={s.id} currentTier={s.finalTier as GradeTier} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

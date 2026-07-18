import Link from "next/link";
import { getRecentGradedSubmissions } from "@/actions/admin";
import { AdminGradeEditor } from "@/components/admin-grade-editor";
import { tierLabel, tierColor, type GradeTier } from "@/lib/grading";
import { getCurrentUser } from "@/lib/current-user";
import { getAdminAccessContext } from "@/lib/admin-access";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

export default async function AdminGradingPage() {
  const current = await getCurrentUser();
  const access = await getAdminAccessContext(
    current?.activeCharacter?.id ?? null,
    Boolean(current?.session.isAdmin)
  );
  const submissions = await getRecentGradedSubmissions(
    50,
    access.isFullAdmin || access.canViewAllGrading ? undefined : access.gradingBoardIds
  );

  // Already sorted by class (board name) from the query — group consecutive
  // rows under a header per class rather than re-sorting here.
  const groups: { boardName: string; items: typeof submissions }[] = [];
  for (const s of submissions) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.boardName === s.boardName) {
      lastGroup.items.push(s);
    } else {
      groups.push({ boardName: s.boardName, items: [s] });
    }
  }

  return (
    <div className="max-w-2xl">
      {submissions.length === 0 ? (
        <p className="text-sm text-ink-400">Nothing graded yet.</p>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.boardName}>
              <h2 className="font-display text-sm text-gunmetal-400 uppercase tracking-wider mb-2">
                {group.boardName}
              </h2>
              <div className="bg-ink-900 border border-ink-700 rounded-lg divide-y divide-ink-700">
                {group.items.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-parchment-100">
                        <Link href={`/c/${s.characterSlug}`} className="hover:text-gunmetal-400">
                          {s.characterFirstName} {s.characterLastName}
                        </Link>
                        <span className="text-ink-400"> &middot; </span>
                        <Link href={`/lesson/${s.lessonId}`} className="text-gunmetal-400 hover:underline">
                          {s.lessonTitle}
                        </Link>
                      </p>
                      <p className="text-xs text-ink-400 mt-0.5">
                        {s.payout} dollars
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

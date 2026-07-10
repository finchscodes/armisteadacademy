import { getArticleBoardPermissionOverview } from "@/actions/admin";
import { ArticleBoardPermissionCard } from "@/components/article-board-permission-card";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

export default async function AdminArticleBoardsPage() {
  const boards = await getArticleBoardPermissionOverview();

  return (
    <div>
      <p className="text-sm text-ink-400 mb-4">
        Notice Board and Community Board are open to anyone with a Head Staff-and-up job by
        default. Use this to give someone else posting rights on a specific board without giving
        them a job.
      </p>

      {boards.length === 0 ? (
        <p className="text-sm text-ink-400">No article boards exist yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {boards.map((b) => (
            <ArticleBoardPermissionCard
              key={b.id}
              boardId={b.id}
              boardName={b.name}
              extraArticleJob={b.extraArticleJob}
              granted={b.granted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

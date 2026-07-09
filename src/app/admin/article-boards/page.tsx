import { getArticleBoardPermissionOverview } from "@/actions/admin";
import { ArticleBoardPermissionCard } from "@/components/article-board-permission-card";

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
              granted={b.granted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

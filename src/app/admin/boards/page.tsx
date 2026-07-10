import Link from "next/link";
import { getAllBoardsForAdmin } from "@/actions/admin";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  board: "Topic area",
  class: "Class",
  article: "Article board",
};

export default async function AdminBoardsPage() {
  const categories = await getAllBoardsForAdmin();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-end mb-4">
        <Link
          href="/admin/boards/new"
          className="shrink-0 text-sm bg-brass-500 text-ink-950 px-4 py-2 rounded-md font-medium hover:bg-brass-400 transition-colors"
        >
          + New board
        </Link>
      </div>

      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat.id}>
            <h2 className="font-display text-sm uppercase tracking-wider text-brass-400 mb-2 pb-1 border-b border-ink-700">
              {cat.name}
            </h2>
            {cat.children.length === 0 ? (
              <p className="text-xs text-ink-400 italic px-1">No boards.</p>
            ) : (
              <div className="bg-ink-900 border border-ink-700 rounded-lg divide-y divide-ink-700">
                {cat.children.map((b) => (
                  <Link
                    key={b.id}
                    href={`/admin/boards/${b.id}/edit`}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-ink-800/60 transition-colors"
                  >
                    <span className="text-sm text-parchment-100">{b.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-ink-400 border border-ink-600 rounded px-2 py-0.5">
                      {KIND_LABEL[b.kind] ?? b.kind}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

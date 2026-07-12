import Link from "next/link";
import { getAllBoardsForAdmin } from "@/actions/admin";
import { DraggableBoardCategories } from "@/components/draggable-board-categories";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

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

      <DraggableBoardCategories categories={categories} />
    </div>
  );
}

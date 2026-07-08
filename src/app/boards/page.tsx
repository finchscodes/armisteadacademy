import Link from "next/link";
import { getBoardTree, type BoardNode } from "@/lib/forum";

function BoardRow({ board }: { board: BoardNode }) {
  return (
    <Link
      href={`/b/${board.slug}`}
      className="flex items-center justify-between px-4 py-3 hover:bg-ink-800/60 transition-colors group"
    >
      <div>
        <p className="text-parchment-100 group-hover:text-brass-400 transition-colors">
          {board.name}
          {board.kind === "class" && (
            <span className="ml-2 text-[10px] uppercase tracking-wider text-claret-500 border border-claret-500/40 rounded px-1.5 py-0.5">
              Class
            </span>
          )}
        </p>
        {board.description && <p className="text-xs text-ink-400 mt-0.5">{board.description}</p>}
      </div>
      <span className="text-xs text-ink-400 shrink-0 ml-4">
        {board.threadCount} {board.threadCount === 1 ? "thread" : "threads"}
      </span>
    </Link>
  );
}

export default async function BoardsPage() {
  const tree = await getBoardTree();

  const categories = tree.filter((b) => b.kind === "category");
  const uncategorized = tree.filter((b) => b.kind !== "category");

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-4xl text-brass-400">Boards</h1>
        <p className="text-ink-400 mt-2 max-w-xl">
          Every board and lesson, all in one place.
        </p>
      </div>

      <div className="space-y-8">
        {categories.map((category) => (
          <section key={category.id}>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="font-display text-lg text-parchment-100">{category.name}</h2>
              <div className="flex-1 brass-rule" />
            </div>
            <div className="bg-ink-900 border border-ink-700 rounded-lg divide-y divide-ink-700">
              {category.children.length === 0 ? (
                <p className="px-4 py-3 text-sm text-ink-400">No boards here yet.</p>
              ) : (
                category.children.map((board) => <BoardRow key={board.id} board={board} />)
              )}
            </div>
          </section>
        ))}

        {uncategorized.length > 0 && (
          <section>
            <div className="bg-ink-900 border border-ink-700 rounded-lg divide-y divide-ink-700">
              {uncategorized.map((board) => (
                <BoardRow key={board.id} board={board} />
              ))}
            </div>
          </section>
        )}

        {tree.length === 0 && (
          <p className="text-ink-400 text-sm">
            No boards have been created yet. Run the seed script to add a starter set.
          </p>
        )}
      </div>
    </div>
  );
}

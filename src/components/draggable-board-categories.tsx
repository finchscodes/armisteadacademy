"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { reorderBoardsAction } from "@/actions/admin";
import { DraggableList } from "@/components/draggable-list";

const KIND_LABEL: Record<string, string> = {
  board: "Topic area",
  class: "Class",
  article: "Article board",
};

type Board = { id: number; name: string; kind: string };
type Category = { id: number; name: string; children: Board[] };

async function persistOrder(orderedIds: number[]) {
  const formData = new FormData();
  formData.set("orderedIds", orderedIds.join(","));
  await reorderBoardsAction(formData);
}

/**
 * Two levels of drag-to-reorder: categories among themselves, and boards
 * within a category. The category level is hand-rolled (rather than
 * nesting one DraggableList inside another) so its draggable header
 * doesn't overlap the fully-draggable board rows underneath it.
 */
export function DraggableBoardCategories({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [order, setOrder] = useState(categories);
  const [prevCategories, setPrevCategories] = useState(categories);
  const [dragId, setDragId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  if (categories !== prevCategories) {
    setPrevCategories(categories);
    setOrder(categories);
  }

  function persist(newOrder: Category[]) {
    setOrder(newOrder);
    startTransition(async () => {
      await persistOrder(newOrder.map((c) => c.id));
      router.refresh();
    });
  }

  function handleDrop(targetId: number) {
    if (dragId === null || dragId === targetId) return;
    const current = [...order];
    const fromIndex = current.findIndex((c) => c.id === dragId);
    const toIndex = current.findIndex((c) => c.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);
    persist(current);
    setDragId(null);
  }

  const canDragCategories = order.length > 1;

  return (
    <div className="space-y-6">
      {order.map((cat) => (
        <div key={cat.id}>
          <div
            draggable={canDragCategories}
            onDragStart={() => setDragId(cat.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(cat.id)}
            className={`flex items-center gap-2 mb-2 pb-1 border-b border-ink-700 ${
              canDragCategories ? "cursor-grab active:cursor-grabbing" : ""
            } ${dragId === cat.id ? "opacity-50" : ""}`}
          >
            {canDragCategories && (
              <span className="text-ink-500 select-none" data-tooltip="Drag to reorder category">
                &#8942;&#8942;
              </span>
            )}
            <h2 className="font-display text-sm uppercase tracking-wider text-gunmetal-400">{cat.name}</h2>
          </div>

          {cat.children.length === 0 ? (
            <p className="text-xs text-ink-400 italic px-1">No boards.</p>
          ) : (
            <DraggableList
              items={cat.children}
              getId={(b) => b.id}
              onReorder={persistOrder}
              canDrag={cat.children.length > 1}
              rowClassName="flex items-center gap-3 px-4 py-2.5"
              renderItem={(b) => (
                <Link
                  href={`/admin/boards/${b.id}/edit`}
                  className="flex-1 flex items-center justify-between hover:text-gunmetal-400 transition-colors min-w-0"
                >
                  <span className="text-sm text-parchment-100">{b.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-ink-400 border border-ink-600 rounded px-2 py-0.5 shrink-0 ml-3">
                    {KIND_LABEL[b.kind] ?? b.kind}
                  </span>
                </Link>
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * Generic drag-to-reorder list. Handles the drag state machine and
 * optimistic reordering; callers supply how each row renders and how a
 * new order gets persisted. Used by guide sections, lessons, and the
 * board/category admin management pages.
 */
export function DraggableList<T>({
  items,
  getId,
  onReorder,
  renderItem,
  canDrag = true,
  showIndex = false,
  className = "bg-ink-900 border border-ink-700 rounded-lg divide-y divide-ink-700",
  rowClassName = "flex items-center gap-3 px-4 py-3",
  emptyState,
}: {
  items: T[];
  getId: (item: T) => number;
  /** Persist the new order — receives ids in their new order. */
  onReorder: (orderedIds: number[]) => void | Promise<void>;
  renderItem: (item: T, index: number) => ReactNode;
  canDrag?: boolean;
  showIndex?: boolean;
  className?: string;
  rowClassName?: string;
  emptyState?: ReactNode;
}) {
  const router = useRouter();
  const [order, setOrder] = useState(items);
  const [prevItems, setPrevItems] = useState(items);
  const [dragId, setDragId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  // Stay in sync if the server sends a fresh list (item added/removed
  // elsewhere, or the page navigated to a different set of items) — adjusted
  // during render rather than an effect, per React's guidance for deriving
  // state from a changed prop.
  if (items !== prevItems) {
    setPrevItems(items);
    setOrder(items);
  }

  function persist(newOrder: T[]) {
    setOrder(newOrder);
    startTransition(async () => {
      await onReorder(newOrder.map(getId));
      router.refresh();
    });
  }

  function handleDrop(targetId: number) {
    if (dragId === null || dragId === targetId) return;
    const current = [...order];
    const fromIndex = current.findIndex((i) => getId(i) === dragId);
    const toIndex = current.findIndex((i) => getId(i) === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);
    persist(current);
    setDragId(null);
  }

  if (order.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={className}>
      {order.map((item, i) => {
        const id = getId(item);
        return (
          <div
            key={id}
            draggable={canDrag}
            onDragStart={() => setDragId(id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(id)}
            className={`${rowClassName} ${canDrag ? "cursor-grab active:cursor-grabbing" : ""} ${
              dragId === id ? "opacity-50" : ""
            }`}
          >
            {canDrag && (
              <span className="text-ink-500 select-none shrink-0" data-tooltip="Drag to reorder">
                &#8942;&#8942;
              </span>
            )}
            {showIndex && (
              <span className="text-xs text-ink-500 tabular-nums w-5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
            )}
            {renderItem(item, i)}
          </div>
        );
      })}
    </div>
  );
}

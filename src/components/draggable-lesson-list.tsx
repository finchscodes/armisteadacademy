"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { reorderLessonsBulkAction } from "@/actions/lessons";

type Lesson = { id: number; title: string; reward: number };

export function DraggableLessonList({
  boardId,
  lessons,
  canManage,
}: {
  boardId: number;
  lessons: Lesson[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [order, setOrder] = useState(lessons);
  const [dragId, setDragId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  function persist(newOrder: Lesson[]) {
    setOrder(newOrder);
    const formData = new FormData();
    formData.set("boardId", String(boardId));
    formData.set("orderedIds", newOrder.map((l) => l.id).join(","));
    startTransition(async () => {
      await reorderLessonsBulkAction(formData);
      router.refresh();
    });
  }

  function handleDrop(targetId: number) {
    if (dragId === null || dragId === targetId) return;
    const current = [...order];
    const fromIndex = current.findIndex((l) => l.id === dragId);
    const toIndex = current.findIndex((l) => l.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);
    persist(current);
    setDragId(null);
  }

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg divide-y divide-ink-700">
      {order.map((lesson) => (
        <div
          key={lesson.id}
          draggable={canManage}
          onDragStart={() => setDragId(lesson.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(lesson.id)}
          className={`flex items-center gap-2 px-4 py-3 ${
            canManage ? "cursor-grab active:cursor-grabbing" : ""
          } ${dragId === lesson.id ? "opacity-50" : ""}`}
        >
          {canManage && (
            <span className="text-ink-500 select-none" data-tooltip="Drag to reorder">
              &#8942;&#8942;
            </span>
          )}
          <Link
            href={`/lesson/${lesson.id}`}
            className="flex-1 flex items-center justify-between hover:text-brass-400 transition-colors min-w-0"
          >
            <span className="text-parchment-100">{lesson.title}</span>
            <span className="text-xs text-ink-400 shrink-0 ml-3">
              up to {lesson.reward} dollars
            </span>
          </Link>
        </div>
      ))}
    </div>
  );
}

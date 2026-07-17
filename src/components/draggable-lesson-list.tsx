"use client";

import Link from "next/link";
import { reorderLessonsBulkAction } from "@/actions/lessons";
import { DraggableList } from "@/components/draggable-list";

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
  async function handleReorder(orderedIds: number[]) {
    const formData = new FormData();
    formData.set("boardId", String(boardId));
    formData.set("orderedIds", orderedIds.join(","));
    await reorderLessonsBulkAction(formData);
  }

  return (
    <DraggableList
      items={lessons}
      getId={(l) => l.id}
      onReorder={handleReorder}
      canDrag={canManage}
      rowClassName="flex items-center gap-2 px-4 py-3"
      renderItem={(lesson) => (
        <Link
          href={`/lesson/${lesson.id}`}
          className="flex-1 flex items-center justify-between hover:text-gunmetal-400 transition-colors min-w-0"
        >
          <span className="text-parchment-100">{lesson.title}</span>
          <span className="text-xs text-ink-400 shrink-0 ml-3">up to {lesson.reward} dollars</span>
        </Link>
      )}
    />
  );
}

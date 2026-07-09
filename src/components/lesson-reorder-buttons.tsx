"use client";

import { useTransition } from "react";
import { reorderLessonAction } from "@/actions/lessons";

export function LessonReorderButtons({ lessonId }: { lessonId: number }) {
  const [pending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    const formData = new FormData();
    formData.set("lessonId", String(lessonId));
    formData.set("direction", direction);
    startTransition(() => reorderLessonAction(formData));
  }

  return (
    <span className="flex flex-col leading-none">
      <button
        type="button"
        disabled={pending}
        onClick={(e) => {
          e.preventDefault();
          move("up");
        }}
        className="text-ink-400 hover:text-brass-400 disabled:opacity-50"
        title="Move up"
      >
        &#9650;
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={(e) => {
          e.preventDefault();
          move("down");
        }}
        className="text-ink-400 hover:text-brass-400 disabled:opacity-50"
        title="Move down"
      >
        &#9660;
      </button>
    </span>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { reorderGuideSectionsAction } from "@/actions/guide";
import { DeleteGuideSectionButton } from "@/components/delete-buttons";

type Section = { id: number; title: string; slug: string };

export function DraggableGuideSectionList({ sections }: { sections: Section[] }) {
  const router = useRouter();
  const [order, setOrder] = useState(sections);
  const [dragId, setDragId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  function persist(newOrder: Section[]) {
    setOrder(newOrder);
    const formData = new FormData();
    formData.set("orderedIds", newOrder.map((s) => s.id).join(","));
    startTransition(async () => {
      await reorderGuideSectionsAction(formData);
      router.refresh();
    });
  }

  function handleDrop(targetId: number) {
    if (dragId === null || dragId === targetId) return;
    const current = [...order];
    const fromIndex = current.findIndex((s) => s.id === dragId);
    const toIndex = current.findIndex((s) => s.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);
    persist(current);
    setDragId(null);
  }

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg divide-y divide-ink-700">
      {order.map((section, i) => (
        <div
          key={section.id}
          draggable
          onDragStart={() => setDragId(section.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(section.id)}
          className={`flex items-center gap-3 px-4 py-3 cursor-grab active:cursor-grabbing ${
            dragId === section.id ? "opacity-50" : ""
          }`}
        >
          <span className="text-ink-500 select-none" title="Drag to reorder">
            &#8942;&#8942;
          </span>
          <span className="text-xs text-ink-500 tabular-nums w-5">{String(i + 1).padStart(2, "0")}</span>
          <span className="flex-1 text-parchment-100">{section.title}</span>
          <Link href={`/admin/guide/${section.id}/edit`} className="text-xs text-brass-400 hover:underline">
            Edit
          </Link>
          <DeleteGuideSectionButton sectionId={section.id} sectionTitle={section.title} />
        </div>
      ))}
    </div>
  );
}

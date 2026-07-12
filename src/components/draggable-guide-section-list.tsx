"use client";

import Link from "next/link";
import { reorderGuideSectionsAction } from "@/actions/guide";
import { DeleteGuideSectionButton } from "@/components/delete-buttons";
import { DraggableList } from "@/components/draggable-list";

type Section = { id: number; title: string; slug: string };

export function DraggableGuideSectionList({ sections }: { sections: Section[] }) {
  async function handleReorder(orderedIds: number[]) {
    const formData = new FormData();
    formData.set("orderedIds", orderedIds.join(","));
    await reorderGuideSectionsAction(formData);
  }

  return (
    <DraggableList
      items={sections}
      getId={(s) => s.id}
      onReorder={handleReorder}
      showIndex
      renderItem={(section) => (
        <>
          <span className="flex-1 text-parchment-100">{section.title}</span>
          <Link href={`/admin/guide/${section.id}/edit`} className="text-xs text-brass-400 hover:underline">
            Edit
          </Link>
          <DeleteGuideSectionButton sectionId={section.id} sectionTitle={section.title} />
        </>
      )}
    />
  );
}

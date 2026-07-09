import Link from "next/link";
import { getGuideSections } from "@/actions/guide";
import { DraggableGuideSectionList } from "@/components/draggable-guide-section-list";

export default async function AdminGuidePage() {
  const sections = await getGuideSections();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ink-400">
          Drag to reorder. This builds the public{" "}
          <Link href="/guide" className="text-brass-400 hover:underline">
            Rules &amp; Guidelines
          </Link>{" "}
          page.
        </p>
        <Link
          href="/admin/guide/new"
          className="shrink-0 text-sm bg-brass-500 text-ink-950 px-4 py-2 rounded-md font-medium hover:bg-brass-400 transition-colors"
        >
          + Add section
        </Link>
      </div>

      {sections.length === 0 ? (
        <p className="text-sm text-ink-400">No sections yet.</p>
      ) : (
        <DraggableGuideSectionList sections={sections} />
      )}
    </div>
  );
}

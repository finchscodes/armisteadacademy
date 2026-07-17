import Link from "next/link";
import { getGuideSections } from "@/actions/guide";
import { DraggableGuideSectionList } from "@/components/draggable-guide-section-list";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

export default async function AdminGuidePage() {
  const sections = await getGuideSections();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <Link href="/guide" className="text-sm text-gunmetal-400 hover:underline">
          View public page &rarr;
        </Link>
        <Link
          href="/admin/guide/new"
          className="shrink-0 text-sm bg-gunmetal-500 text-ink-950 px-4 py-2 rounded-md font-medium hover:bg-gunmetal-400 transition-colors"
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

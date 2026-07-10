import Link from "next/link";
import { NewGuideSectionForm } from "@/components/new-guide-section-form";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

export default function NewGuideSectionPage() {
  return (
    <div className="max-w-xl">
      <Link href="/admin/guide" className="text-sm text-ink-400 hover:text-brass-400">
        &larr; Guidebook sections
      </Link>
      <h1 className="font-display text-2xl text-parchment-100 mt-2 mb-6">Add section</h1>
      <NewGuideSectionForm />
    </div>
  );
}

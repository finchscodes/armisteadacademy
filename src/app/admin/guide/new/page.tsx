import Link from "next/link";
import { NewGuideSectionForm } from "@/components/new-guide-section-form";

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

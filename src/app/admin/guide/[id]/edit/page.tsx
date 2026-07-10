import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { guideSections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { EditGuideSectionForm } from "@/components/edit-guide-section-form";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

export default async function EditGuideSectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [section] = await db.select().from(guideSections).where(eq(guideSections.id, Number(id)));
  if (!section) notFound();

  return (
    <div className="max-w-xl">
      <Link href="/admin/guide" className="text-sm text-ink-400 hover:text-brass-400">
        &larr; Guidebook sections
      </Link>
      <h1 className="font-display text-2xl text-parchment-100 mt-2 mb-6">Edit section</h1>
      <EditGuideSectionForm sectionId={section.id} title={section.title} content={section.content} />
    </div>
  );
}

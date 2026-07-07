import { notFound } from "next/navigation";
import { getBoardBySlug } from "@/lib/forum";
import { NewThreadForm } from "@/components/new-thread-form";

export default async function NewThreadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getBoardBySlug(slug);
  if (!data) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-brass-400 mb-1">New thread</h1>
      <p className="text-ink-400 text-sm mb-6">Posting in {data.board.name}</p>
      <NewThreadForm boardSlug={slug} />
    </div>
  );
}

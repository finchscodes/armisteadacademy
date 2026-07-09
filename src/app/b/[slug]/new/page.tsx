import { notFound, redirect } from "next/navigation";
import { getBoardBySlug } from "@/lib/forum";
import { getCurrentUser } from "@/lib/current-user";
import { canPostArticle } from "@/lib/article-boards";
import { NewThreadForm } from "@/components/new-thread-form";

export default async function NewThreadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getBoardBySlug(slug);
  if (!data) notFound();
  // Class boards focus on lessons only — no free-form topics.
  if (data.board.kind === "class") notFound();

  if (data.board.kind === "article") {
    const current = await getCurrentUser();
    if (!current) redirect("/login");
    const allowed =
      current.session.isAdmin ||
      (current.activeCharacter
        ? await canPostArticle(current.activeCharacter.id, data.board.id)
        : false);
    if (!allowed) redirect(`/b/${slug}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-brass-400 mb-1">
        {data.board.kind === "article" ? "New article" : "New thread"}
      </h1>
      <p className="text-ink-400 text-sm mb-6">Posting in {data.board.name}</p>
      <NewThreadForm boardSlug={slug} />
    </div>
  );
}

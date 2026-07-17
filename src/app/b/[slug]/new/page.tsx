import { notFound, redirect } from "next/navigation";
import { getBoardBySlug } from "@/lib/forum";
import { getCurrentUser } from "@/lib/current-user";
import { canPostArticle } from "@/lib/article-boards";
import { NewThreadForm } from "@/components/new-thread-form";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

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
      <h1 className="font-display text-3xl text-gunmetal-400 mb-1">
        {data.board.kind === "article"
          ? "New article"
          : data.board.kind === "phone"
            ? "New conversation"
            : data.board.kind === "email"
              ? "New email"
              : "New thread"}
      </h1>
      <p className="text-ink-400 text-sm mb-6">Posting in {data.board.name}</p>
      <NewThreadForm
        boardSlug={slug}
        isArticle={data.board.kind === "article"}
        isPhone={data.board.kind === "phone"}
        isEmail={data.board.kind === "email"}
      />
    </div>
  );
}

import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getBoardBySlug } from "@/lib/forum";
import { isAssignedToClass } from "@/lib/class-assignments";
import { NewLessonForm } from "@/components/new-lesson-form";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

export default async function NewLessonPage({
  searchParams,
}: {
  searchParams: Promise<{ board?: string }>;
}) {
  const { board: boardSlug } = await searchParams;
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (!boardSlug) redirect("/");

  const data = await getBoardBySlug(boardSlug);
  if (!data) notFound();

  // Admins can post to any class; everyone else must be assigned to this class
  // with their active character.
  const allowed =
    current.session.isAdmin ||
    (current.activeCharacter
      ? await isAssignedToClass(current.activeCharacter.id, data.board.id)
      : false);
  if (!allowed) redirect(`/b/${boardSlug}`);

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display text-3xl text-brass-400 mb-1">Post a lesson</h1>
      <p className="text-ink-400 text-sm mb-6">Students will submit homework in response.</p>
      <NewLessonForm boardSlug={boardSlug} />
    </div>
  );
}

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { canPostLessons } from "@/lib/roles";
import { NewLessonForm } from "@/components/new-lesson-form";

export default async function NewLessonPage({
  searchParams,
}: {
  searchParams: Promise<{ board?: string }>;
}) {
  const { board } = await searchParams;
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (!canPostLessons(current.session.role)) {
    redirect("/");
  }
  if (!board) redirect("/");

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display text-3xl text-brass-400 mb-1">Post a lesson</h1>
      <p className="text-ink-400 text-sm mb-6">Students will submit homework in response.</p>
      <NewLessonForm boardSlug={board} />
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { lessons } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/current-user";
import { isAssignedToClass } from "@/lib/class-assignments";
import { EditLessonForm } from "@/components/edit-lesson-form";

export default async function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, Number(id)));
  if (!lesson) notFound();

  const allowed =
    current.session.isAdmin ||
    (current.activeCharacter
      ? await isAssignedToClass(current.activeCharacter.id, lesson.boardId)
      : false);
  if (!allowed) redirect(`/lesson/${lesson.id}`);

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display text-3xl text-brass-400 mb-6">Edit lesson</h1>
      <EditLessonForm
        lessonId={lesson.id}
        title={lesson.title}
        prompt={lesson.prompt}
        rewardMin={lesson.rewardMin}
        rewardMax={lesson.rewardMax}
        graderFee={lesson.graderFee}
      />
    </div>
  );
}

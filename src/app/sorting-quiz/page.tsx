import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { getSortingQuestionsWithAnswers, getSortingQuizBlurb } from "@/actions/admin";
import { SortingQuizForm } from "@/components/sorting-quiz-form";

// Sorting-quiz questions can change and this is a form users submit to —
// must render per-request, never prerendered at build time.
export const dynamic = "force-dynamic";

export default async function SortingQuizPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const activeCharacter = current.activeCharacter;
  if (!activeCharacter) redirect("/characters");

  // Already sorted — nothing left to do here.
  if (activeCharacter.hall) redirect(`/hall/${activeCharacter.hall}/welcome`);

  const [questions, blurb] = await Promise.all([getSortingQuestionsWithAnswers(), getSortingQuizBlurb()]);
  const quizUsable = questions.length > 0 && questions.every((q) => q.answers.length > 0);

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display text-3xl text-gunmetal-400 mb-1">Sorting quiz</h1>
      <p className="text-ink-400 text-sm mb-6">
        Answer honestly — {activeCharacter.firstName} will be sorted into whichever hall best
        matches their answers. You can chat and explore Armistead while your hall is pending.
      </p>

      {blurb && (
        <p className="whitespace-pre-wrap leading-relaxed text-parchment-100/90 text-sm bg-ink-900 border border-ink-700 rounded-lg p-4 mb-6">
          {blurb}
        </p>
      )}

      {quizUsable ? (
        <SortingQuizForm characterId={activeCharacter.id} questions={questions} />
      ) : (
        <div className="bg-ink-900 border border-ink-700 rounded-lg p-6 text-sm text-ink-400">
          The sorting quiz isn&apos;t set up yet. Check back soon, or ask an admin to sort you
          directly.
          <div className="mt-4">
            <Link href="/" className="text-gunmetal-400 hover:underline">
              Back to Armistead Academy
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

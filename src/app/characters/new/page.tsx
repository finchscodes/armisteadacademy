import { getSortingQuestionsWithAnswers } from "@/actions/admin";
import { NewCharacterForm } from "@/components/new-character-form";

// Sorting-quiz questions can change and this is a form users submit to —
// must render per-request, never prerendered at build time.
export const dynamic = "force-dynamic";

export default async function NewCharacterPage() {
  const questions = await getSortingQuestionsWithAnswers();

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display text-3xl text-gunmetal-400 mb-1">Create a character</h1>
      <p className="text-ink-400 text-sm mb-6">
        You can create more later. Every character starts as a 1st Year — you progress by
        taking lessons.
      </p>
      <NewCharacterForm questions={questions} />
    </div>
  );
}

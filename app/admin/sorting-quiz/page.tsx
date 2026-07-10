import { getSortingQuestionsWithAnswers } from "@/actions/admin";
import { SortingQuestionCard } from "@/components/sorting-question-card";
import { NewSortingQuestionForm } from "@/components/new-sorting-question-form";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

export default async function AdminSortingQuizPage() {
  const questions = await getSortingQuestionsWithAnswers();

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-ink-400">
        Up to 12 questions ({questions.length}/12). Each answer points to a hall — whichever hall
        gets the most matching answers is where a character gets sorted.
      </p>

      {questions.length === 0 ? (
        <p className="text-sm text-ink-400">No questions yet.</p>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <SortingQuestionCard key={q.id} question={q} index={i} />
          ))}
        </div>
      )}

      {questions.length < 12 && <NewSortingQuestionForm />}
    </div>
  );
}

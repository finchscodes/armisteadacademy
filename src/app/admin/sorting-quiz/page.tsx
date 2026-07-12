import { getSortingQuestionsWithAnswers, getSortingQuizBlurb } from "@/actions/admin";
import { SortingQuestionCard } from "@/components/sorting-question-card";
import { NewSortingQuestionForm } from "@/components/new-sorting-question-form";
import { SortingQuizBlurbForm } from "@/components/sorting-quiz-blurb-form";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

export default async function AdminSortingQuizPage() {
  const [questions, blurb] = await Promise.all([getSortingQuestionsWithAnswers(), getSortingQuizBlurb()]);

  return (
    <div className="max-w-2xl space-y-4">
      <SortingQuizBlurbForm blurb={blurb} />

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

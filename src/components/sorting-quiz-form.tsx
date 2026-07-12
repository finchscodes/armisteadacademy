"use client";

import { useActionState } from "react";
import { submitSortingQuizAction } from "@/actions/characters";

type Answer = { id: number; answerText: string; hall: string };
type Question = { id: number; questionText: string; answers: Answer[] };

export function SortingQuizForm({
  characterId,
  questions,
}: {
  characterId: number;
  questions: Question[];
}) {
  const [state, formAction, pending] = useActionState(submitSortingQuizAction, undefined);

  return (
    <form action={formAction} className="space-y-5 bg-ink-900 border border-ink-700 rounded-lg p-6">
      <input type="hidden" name="characterId" value={characterId} />

      {questions.map((q) => (
        <div key={q.id} className="border border-ink-700 rounded-lg p-4 bg-ink-800/40">
          <p className="text-sm text-parchment-100 mb-2">{q.questionText}</p>
          <div className="space-y-1.5">
            {q.answers.map((a) => (
              <label
                key={a.id}
                className="flex items-center gap-2 text-sm text-ink-200 border border-ink-600 rounded-md px-3 py-2 cursor-pointer hover:border-brass-500/50"
              >
                <input type="radio" name={`quiz_q${q.id}`} value={a.id} required />
                {a.answerText}
              </label>
            ))}
          </div>
        </div>
      ))}

      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-brass-500 text-ink-950 rounded-md py-2.5 font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Sorting..." : "Get sorted"}
      </button>
    </form>
  );
}

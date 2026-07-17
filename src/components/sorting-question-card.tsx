"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminAddSortingAnswerAction,
  adminRemoveSortingAnswerAction,
  adminRemoveSortingQuestionAction,
} from "@/actions/admin";
import { HALL_VALUES, hallLabel } from "@/lib/halls";

type Answer = { id: number; answerText: string; hall: string };
type Question = { id: number; questionText: string; answers: Answer[] };

export function SortingQuestionCard({ question, index }: { question: Question; index: number }) {
  const router = useRouter();
  const [answerText, setAnswerText] = useState("");
  const [hall, setHall] = useState<string>(HALL_VALUES[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAddAnswer() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("questionId", String(question.id));
      formData.set("answerText", answerText);
      formData.set("hall", hall);
      const result = await adminAddSortingAnswerAction(undefined, formData);
      if (result?.error) setError(result.error);
      else setAnswerText("");
      router.refresh();
    });
  }

  function handleRemoveAnswer(answerId: number) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("answerId", String(answerId));
      await adminRemoveSortingAnswerAction(formData);
      router.refresh();
    });
  }

  function handleRemoveQuestion() {
    if (!confirm("Delete this question and all its answers?")) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("questionId", String(question.id));
      await adminRemoveSortingQuestionAction(formData);
      router.refresh();
    });
  }

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-sm text-parchment-100">
          <span className="text-ink-500 mr-1.5">{index + 1}.</span>
          {question.questionText}
        </p>
        <button
          type="button"
          onClick={handleRemoveQuestion}
          disabled={pending}
          className="text-xs text-claret-500 hover:text-claret-400 transition-colors disabled:opacity-60 shrink-0"
        >
          Delete question
        </button>
      </div>

      {question.answers.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {question.answers.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between text-xs bg-ink-800 border border-ink-600 rounded px-3 py-1.5"
            >
              <span className="text-parchment-100">
                {a.answerText} <span className="text-gunmetal-400">&rarr; {hallLabel(a.hall)}</span>
              </span>
              <button
                type="button"
                onClick={() => handleRemoveAnswer(a.id)}
                disabled={pending}
                className="text-ink-400 hover:text-claret-500 transition-colors disabled:opacity-60"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          placeholder="Answer text"
          className="flex-1 min-w-[8rem] text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1.5 focus:outline-none focus:border-gunmetal-500"
        />
        <select
          value={hall}
          onChange={(e) => setHall(e.target.value)}
          className="text-xs bg-ink-800 border border-ink-600 rounded px-2 py-1.5 focus:outline-none focus:border-gunmetal-500"
        >
          {HALL_VALUES.map((h) => (
            <option key={h} value={h}>
              {hallLabel(h)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAddAnswer}
          disabled={pending || !answerText.trim()}
          className="text-xs bg-gunmetal-500 text-ink-950 px-3 py-1.5 rounded font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
        >
          Add answer
        </button>
      </div>
      {error && <p className="text-xs text-claret-500 mt-1">{error}</p>}
    </div>
  );
}

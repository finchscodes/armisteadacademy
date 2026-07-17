"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminAddExamAnswerAction,
  adminRemoveExamAnswerAction,
  adminRemoveExamQuestionAction,
  adminSetCorrectAnswerAction,
} from "@/actions/exams";

type Answer = { id: number; answerText: string; isCorrect: boolean };
type Question = { id: number; questionText: string; answers: Answer[] };

export function ExamQuestionCard({ question, index }: { question: Question; index: number }) {
  const router = useRouter();
  const [answerText, setAnswerText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAddAnswer() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("questionId", String(question.id));
      formData.set("answerText", answerText);
      formData.set("isCorrect", question.answers.length === 0 ? "true" : "false");
      const result = await adminAddExamAnswerAction(undefined, formData);
      if (result?.error) setError(result.error);
      else setAnswerText("");
      router.refresh();
    });
  }

  function handleSetCorrect(answerId: number) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("answerId", String(answerId));
      formData.set("questionId", String(question.id));
      await adminSetCorrectAnswerAction(formData);
      router.refresh();
    });
  }

  function handleRemoveAnswer(answerId: number) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("answerId", String(answerId));
      await adminRemoveExamAnswerAction(formData);
      router.refresh();
    });
  }

  function handleRemoveQuestion() {
    if (!confirm("Delete this question and all its answers?")) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("questionId", String(question.id));
      await adminRemoveExamQuestionAction(formData);
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
          className="shrink-0 text-xs text-claret-500 hover:text-claret-400 disabled:opacity-60"
        >
          Delete question
        </button>
      </div>

      <div className="space-y-1.5 mb-3">
        {question.answers.map((a) => (
          <div key={a.id} className="flex items-center gap-2">
            <input
              type="radio"
              name={`correct-${question.id}`}
              checked={a.isCorrect}
              onChange={() => handleSetCorrect(a.id)}
              disabled={pending}
              className="shrink-0"
            />
            <span className={`text-sm flex-1 ${a.isCorrect ? "text-green-400" : "text-parchment-100/90"}`}>
              {a.answerText}
            </span>
            <button
              type="button"
              onClick={() => handleRemoveAnswer(a.id)}
              disabled={pending}
              className="text-[11px] text-ink-500 hover:text-claret-500 disabled:opacity-60"
            >
              Remove
            </button>
          </div>
        ))}
        {question.answers.length === 0 && (
          <p className="text-xs text-ink-400 italic">No answer choices yet.</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          placeholder="Add an answer choice..."
          className="flex-1 min-w-0 rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm focus:outline-none focus:border-brass-500"
        />
        <button
          type="button"
          onClick={handleAddAnswer}
          disabled={pending || !answerText.trim()}
          className="shrink-0 text-xs bg-ink-800 border border-ink-600 text-parchment-100 px-3 py-1.5 rounded-md hover:border-brass-500/50 transition-colors disabled:opacity-60"
        >
          Add
        </button>
      </div>
      {error && <p className="text-xs text-claret-500 mt-1">{error}</p>}
    </div>
  );
}

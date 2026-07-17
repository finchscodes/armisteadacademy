"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitExamAttemptAction } from "@/actions/exams";

type Answer = { id: number; answerText: string };
type Question = { id: number; questionText: string; answers: Answer[] };

export function TakeExamForm({ examId, questions }: { examId: number; questions: Question[] }) {
  const router = useRouter();
  const [result, setResult] = useState<{ error?: string; success?: string } | undefined>(undefined);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    formData.set("examId", String(examId));
    const res = await submitExamAttemptAction(formData);
    setResult(res);
    setPending(false);
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {questions.map((q, i) => (
        <div key={q.id} className="bg-ink-900 border border-ink-700 rounded-lg p-4">
          <p className="text-sm text-parchment-100 mb-3">
            <span className="text-ink-500 mr-1.5">{i + 1}.</span>
            {q.questionText}
          </p>
          <div className="space-y-1.5">
            {q.answers.map((a) => (
              <label key={a.id} className="flex items-center gap-2 text-sm text-parchment-100/90 cursor-pointer">
                <input type="radio" name={`question-${q.id}`} value={a.id} required />
                {a.answerText}
              </label>
            ))}
          </div>
        </div>
      ))}

      {result?.error && <p className="text-sm text-claret-500">{result.error}</p>}
      {result?.success && <p className="text-sm text-green-400">{result.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-gunmetal-500 text-ink-950 rounded-md px-5 py-2.5 font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Submitting..." : "Submit exam"}
      </button>
    </form>
  );
}

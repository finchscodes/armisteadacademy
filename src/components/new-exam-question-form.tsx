"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminAddExamQuestionAction } from "@/actions/exams";

export function NewExamQuestionForm({ examId }: { examId: number }) {
  const router = useRouter();
  const [questionText, setQuestionText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleAdd() {
    setError(null);
    setPending(true);
    const formData = new FormData();
    formData.set("examId", String(examId));
    formData.set("questionText", questionText);
    const result = await adminAddExamQuestionAction(undefined, formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setQuestionText("");
      router.refresh();
    }
  }

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg p-4">
      <label className="block text-sm font-medium mb-1">Add a question</label>
      <textarea
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
        rows={2}
        className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm mb-2 focus:outline-none focus:border-gunmetal-500"
      />
      {error && <p className="text-xs text-claret-500 mb-2">{error}</p>}
      <button
        type="button"
        onClick={handleAdd}
        disabled={pending || !questionText.trim()}
        className="text-xs bg-gunmetal-500 text-ink-950 px-3 py-1.5 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add question"}
      </button>
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitConfessionAction } from "@/actions/confessions";
import { useToast } from "@/components/toast-provider";

const CYCLE_MS = 8000;

type Confession = { id: number; content: string };

export function ConfessionWidget({
  confessions,
  canSubmit,
}: {
  confessions: Confession[];
  canSubmit: boolean;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [index, setIndex] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (confessions.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % confessions.length);
    }, CYCLE_MS);
    return () => clearInterval(timer);
  }, [confessions.length]);

  function handleSubmit() {
    if (!content.trim()) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("content", content);
      const result = await submitConfessionAction(undefined, formData);
      if (result?.error) showToast(result.error, "error");
      else if (result?.success) {
        showToast(result.success, "success");
        setContent("");
        setShowForm(false);
      }
      router.refresh();
    });
  }

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-ink-700 flex items-center justify-between">
        <h2 className="font-ui text-xs uppercase tracking-widest text-ink-400">Confessions</h2>
        {canSubmit && (
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="text-[11px] text-gunmetal-400 hover:underline"
          >
            {showForm ? "Cancel" : "Submit"}
          </button>
        )}
      </div>
      <div className="p-4">
        <p className="text-[11px] text-ink-500 leading-snug mb-3">
          These messages should be in good faith (at most teasing if not coming from yourself),
          and not seeking to send hateful messages to one another. Messages regarding OOC matters
          or writers will be deleted.
        </p>
        {showForm ? (
          <div className="space-y-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="A rumor, a tip, something you overheard..."
              className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-xs focus:outline-none focus:border-gunmetal-500"
            />
            <p className="text-[11px] text-ink-500">
              Submitted anonymously. Reviewed by admins before it appears here.
            </p>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={pending || !content.trim()}
              className="text-xs bg-gunmetal-500 text-ink-950 px-3 py-1.5 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
            >
              {pending ? "Submitting..." : "Submit"}
            </button>
          </div>
        ) : confessions.length === 0 ? (
          <p className="text-xs text-ink-400 italic">Nothing to see here... yet.</p>
        ) : (
          <p key={confessions[index].id} className="text-xs text-parchment-100/90 italic leading-relaxed">
            &ldquo;{confessions[index].content}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}

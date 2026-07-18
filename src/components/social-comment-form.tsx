"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPostAction } from "@/actions/forum";
import { RichTextEditor } from "@/components/rich-text-editor";

export function SocialCommentForm({ threadSlug }: { threadSlug: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createPostAction(undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="bg-ink-900 border border-ink-700 rounded-lg p-4 space-y-3">
      <input type="hidden" name="threadSlug" value={threadSlug} />
      <div>
        <label className="block text-sm font-medium mb-1">Leave a comment</label>
        <RichTextEditor name="content" placeholder="Say something..." />
      </div>
      {error && <p className="text-sm text-claret-500">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-gunmetal-500 text-ink-950 rounded-md px-5 py-2.5 font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Posting..." : "Comment"}
      </button>
    </form>
  );
}

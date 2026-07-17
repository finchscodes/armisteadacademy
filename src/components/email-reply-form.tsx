"use client";

import { useActionState } from "react";
import { createPostAction } from "@/actions/forum";
import { EmailComposerFields } from "@/components/email-composer-fields";

export function EmailReplyForm({ threadSlug }: { threadSlug: string }) {
  const [state, formAction, pending] = useActionState(createPostAction, undefined);

  return (
    <form action={formAction} className="space-y-3 bg-ink-900 border border-ink-700 rounded-lg p-5">
      <input type="hidden" name="threadSlug" value={threadSlug} />
      <label className="block text-sm font-medium">Reply</label>
      <EmailComposerFields />
      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-gunmetal-500 text-ink-950 rounded-md px-5 py-2.5 font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}

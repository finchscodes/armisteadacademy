"use client";

import { useActionState } from "react";
import { sendMessageReplyAction } from "@/actions/messages";
import { RichTextEditor } from "@/components/rich-text-editor";

export function MessageReplyForm({ threadId }: { threadId: number }) {
  const [state, formAction, pending] = useActionState(sendMessageReplyAction, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="threadId" value={threadId} />
      <RichTextEditor name="content" />
      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-brass-500 text-ink-950 rounded-md px-5 py-2 font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}

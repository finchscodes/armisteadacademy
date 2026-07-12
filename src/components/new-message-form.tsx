"use client";

import { useActionState, useState } from "react";
import { createMessageThreadAction } from "@/actions/messages";
import { RecipientPicker } from "@/components/recipient-picker";
import { RichTextEditor } from "@/components/rich-text-editor";

type CharacterOption = { id: number; name: string; firstName: string; lastName: string; slug: string };

export function NewMessageForm({ initialRecipient }: { initialRecipient?: CharacterOption | null }) {
  const [state, formAction, pending] = useActionState(createMessageThreadAction, undefined);
  const [recipients, setRecipients] = useState<CharacterOption[]>(initialRecipient ? [initialRecipient] : []);

  return (
    <form action={formAction} className="space-y-4 bg-ink-900 border border-ink-700 rounded-lg p-6">
      <div>
        <label className="block text-sm font-medium mb-1">To</label>
        <RecipientPicker selected={recipients} onChange={setRecipients} name="recipientIds" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="subject">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          required
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Message</label>
        <RichTextEditor name="content" />
      </div>

      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || recipients.length === 0}
        className="bg-brass-500 text-ink-950 rounded-md px-5 py-2.5 font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}

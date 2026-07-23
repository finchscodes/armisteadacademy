"use client";

import { useActionState } from "react";
import { adminUpdatePrivacyPolicyAction } from "@/actions/admin";
import { RichTextEditor } from "@/components/rich-text-editor";

export function PrivacyPolicyForm({ content }: { content: string }) {
  const [state, formAction, pending] = useActionState(adminUpdatePrivacyPolicyAction, undefined);

  return (
    <form action={formAction} className="space-y-4 bg-ink-900 border border-ink-700 rounded-lg p-6">
      <div>
        <label className="block text-sm font-medium mb-1">Content</label>
        <RichTextEditor name="content" initialValue={content} />
      </div>
      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}
      {state?.success && <p className="text-gunmetal-400 text-sm">{state.success}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-gunmetal-500 text-ink-950 rounded-md px-5 py-2.5 font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}

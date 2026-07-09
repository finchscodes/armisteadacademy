"use client";

import { useActionState } from "react";
import { createGuideSectionAction } from "@/actions/guide";
import { RichTextEditor } from "@/components/rich-text-editor";

export function NewGuideSectionForm() {
  const [state, formAction, pending] = useActionState(createGuideSectionAction, undefined);

  return (
    <form action={formAction} className="space-y-4 bg-ink-900 border border-ink-700 rounded-lg p-6">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="title">
          Section title
        </label>
        <input
          id="title"
          name="title"
          required
          placeholder="e.g. Site Rules"
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Content</label>
        <RichTextEditor name="content" placeholder="Write the section content..." />
      </div>

      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-brass-500 text-ink-950 rounded-md px-5 py-2.5 font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add section"}
      </button>
    </form>
  );
}

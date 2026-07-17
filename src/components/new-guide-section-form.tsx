"use client";

import { useActionState, useState } from "react";
import { createGuideSectionAction } from "@/actions/guide";
import { RichTextEditor } from "@/components/rich-text-editor";
import { StyledSelect } from "@/components/styled-select";

const NONE = "__none";

export function NewGuideSectionForm({ parentOptions }: { parentOptions: { id: number; title: string }[] }) {
  const [state, formAction, pending] = useActionState(createGuideSectionAction, undefined);
  const [parentId, setParentId] = useState(NONE);

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
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-gunmetal-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Parent section (optional)</label>
        <input type="hidden" name="parentId" value={parentId === NONE ? "" : parentId} />
        <StyledSelect
          value={parentId}
          onChange={setParentId}
          options={[
            { value: NONE, label: "None — top-level section" },
            ...parentOptions.map((p) => ({ value: String(p.id), label: p.title })),
          ]}
        />
        <p className="text-[11px] text-ink-400 mt-1">
          Nests this as a sub-tab under the chosen section, shown indented beneath it in the sidebar.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Content</label>
        <RichTextEditor name="content" placeholder="Write the section content..." />
      </div>

      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-gunmetal-500 text-ink-950 rounded-md px-5 py-2.5 font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add section"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { createWallPostAction } from "@/actions/wall";
import { RichTextEditor } from "@/components/rich-text-editor";

export function WallPostForm({ wallCharacterId }: { wallCharacterId: number }) {
  const [state, formAction, pending] = useActionState(createWallPostAction, undefined);

  return (
    <form action={formAction} className="bg-ink-900 border border-ink-700 p-4 space-y-3">
      <input type="hidden" name="wallCharacterId" value={wallCharacterId} />
      <RichTextEditor name="content" placeholder="What's on your mind?" />
      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="text-sm bg-gunmetal-500 text-ink-950 px-4 py-2 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Posting..." : "Post"}
      </button>
    </form>
  );
}

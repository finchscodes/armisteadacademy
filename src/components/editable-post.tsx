"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePostAction } from "@/actions/forum";
import { RichTextEditor } from "@/components/rich-text-editor";
import { RichTextDisplay } from "@/components/rich-text-display";

export function EditablePost({
  postId,
  content,
  canEdit,
  editedAt,
}: {
  postId: number;
  content: string;
  canEdit: boolean;
  editedAt: Date | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <div>
        <div className="leading-relaxed text-parchment-100/95">
          <RichTextDisplay html={content} />
        </div>
        <div className="flex items-center gap-2 mt-1">
          {editedAt && <span className="text-[11px] text-ink-500 italic">edited</span>}
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-[11px] text-ink-400 hover:text-brass-400 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          fd.set("postId", String(postId));
          const result = await updatePostAction(undefined, fd);
          if (result?.error) {
            setError(result.error);
          } else {
            setEditing(false);
            router.refresh();
          }
        });
      }}
      className="space-y-2"
    >
      <RichTextEditor name="content" initialValue={content} />
      {error && <p className="text-claret-500 text-sm">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="text-xs bg-brass-500 text-ink-950 px-3 py-1.5 rounded-md font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs text-ink-400 hover:text-parchment-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

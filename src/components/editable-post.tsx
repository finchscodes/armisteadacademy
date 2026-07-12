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
  ooc,
  rollValue,
  rollModifier,
}: {
  postId: number;
  content: string;
  canEdit: boolean;
  editedAt: Date | null;
  /** Omit entirely for board kinds that don't support OOC (email, phone). */
  ooc?: string | null;
  /** A 1d10 roll attached to this post — always server-generated, never editable. */
  rollValue?: number | null;
  rollModifier?: number | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [showOoc, setShowOoc] = useState(Boolean(ooc));

  const supportsOoc = ooc !== undefined;

  if (!editing) {
    return (
      <div>
        <div className="leading-relaxed text-parchment-100/95">
          <RichTextDisplay html={content} />
        </div>
        {rollValue != null && (
          <div
            className="inline-flex items-center gap-1.5 bg-ink-800 border border-brass-500/40 rounded-md px-2.5 py-1 mt-2 text-xs"
            data-tooltip="Rolled automatically — can't be edited"
          >
            <span className="text-ink-400">Roll:</span>
            <span className="text-parchment-100 font-medium">
              {rollValue}
              {rollModifier ? ` ${rollModifier > 0 ? "+" : ""}${rollModifier}` : ""}
            </span>
            {rollModifier ? (
              <span className="text-brass-400 font-semibold">= {rollValue + rollModifier}</span>
            ) : null}
          </div>
        )}
        {ooc && (
          <div className="bg-ink-800/40 border border-dashed border-ink-600 rounded-lg px-3 py-2 mt-2 text-xs">
            <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">OOC</p>
            <p className="text-ink-300 whitespace-pre-wrap">{ooc}</p>
          </div>
        )}
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

      {supportsOoc && (
        <>
          <div>
            <button
              type="button"
              onClick={() => setShowOoc((v) => !v)}
              className="text-xs text-brass-400 hover:underline"
            >
              {showOoc ? "− Hide OOC" : "+ Add OOC"}
            </button>
          </div>
          {showOoc && (
            <textarea
              name="ooc"
              rows={2}
              defaultValue={ooc ?? ""}
              placeholder="Anything out-of-character — reactions, pacing, plotting notes, etc."
              className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500"
            />
          )}
        </>
      )}

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

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePostAction } from "@/actions/forum";
import { PhoneMessageComposer } from "@/components/phone-message-composer";
import { parsePhoneContent } from "@/lib/phone-messages";

export function EditablePhonePost({
  postId,
  content,
  canEdit,
  editedAt,
  side,
}: {
  postId: number;
  content: string;
  canEdit: boolean;
  editedAt: Date | null;
  /** Which side of the conversation this poster's bubbles show on. */
  side: "left" | "right";
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (editing) {
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
        className="space-y-2 bg-ink-900 border border-ink-700 rounded-lg p-4"
      >
        <PhoneMessageComposer initialValue={content} />
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

  const lines = parsePhoneContent(content);
  const bubbleColor = side === "right" ? "bg-teal-800/70 text-parchment-100" : "bg-ink-700 text-parchment-100";
  const align = side === "right" ? "items-end" : "items-start";

  return (
    <div>
      <div className={`flex flex-col gap-1.5 ${align}`}>
        {lines.map((line, i) => {
          if (line.type === "action") {
            return (
              <p key={i} className="text-xs italic text-ink-400 max-w-[85%] py-1">
                {line.text}
              </p>
            );
          }
          if (line.type === "image") {
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={line.url}
                alt="Attached"
                className="max-w-[75%] rounded-2xl border border-ink-700"
              />
            );
          }
          return (
            <p key={i} className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-snug ${bubbleColor}`}>
              {line.text}
            </p>
          );
        })}
      </div>
      <div className={`flex items-center gap-2 mt-1 ${side === "right" ? "justify-end" : "justify-start"}`}>
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

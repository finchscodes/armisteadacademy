"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { updatePostAction } from "@/actions/forum";
import { PhoneMessageComposer } from "@/components/phone-message-composer";
import { parsePhoneContent, parseCallContent } from "@/lib/phone-messages";

type Participant = { id: number; name: string; avatarUrl: string | null };

/** Renders a call narrative with "quoted dialogue" picked out in a different color. */
function CallNarrative({ text }: { text: string }) {
  const parts = text.split(/(".*?")/g);
  return (
    <>
      {parts.map((part, i): ReactNode =>
        part.startsWith('"') && part.endsWith('"') && part.length > 1 ? (
          <span key={i} className="text-brass-400">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function EditablePhonePost({
  postId,
  content,
  canEdit,
  editedAt,
  side,
  participants,
}: {
  postId: number;
  content: string;
  canEdit: boolean;
  editedAt: Date | null;
  /** Which side of the conversation this poster's bubbles show on. */
  side: "left" | "right";
  /** Other characters in this conversation — offered as call targets when editing. */
  participants: Participant[];
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
        <PhoneMessageComposer initialValue={content} participants={participants} />
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

  const call = parseCallContent(content);

  if (call) {
    const calleeName = call.calleeId ? participants.find((p) => p.id === call.calleeId)?.name : call.calleeName;
    const calleeAvatar = call.calleeId ? participants.find((p) => p.id === call.calleeId)?.avatarUrl : null;

    return (
      <div className="border border-ink-700 rounded-lg p-5 bg-ink-900/60 text-center max-w-md">
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="text-[10px] uppercase tracking-wider bg-brass-500/20 text-brass-400 border border-brass-500/40 rounded px-2 py-1">
            Calling:
          </span>
          <span className="text-sm text-ink-300 italic">{calleeName ?? "Unknown"}</span>
        </div>
        {calleeAvatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={calleeAvatar}
            alt={calleeName ?? "Callee"}
            className="w-24 h-24 rounded-full mx-auto border-2 border-ink-600 object-cover mb-4"
          />
        )}
        <p className="italic text-sm text-parchment-100/90 leading-relaxed text-left whitespace-pre-wrap">
          <CallNarrative text={call.body} />
        </p>
        <div className="flex items-center gap-2 mt-3 justify-center">
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

  const lines = parsePhoneContent(content);
  const bubbleColor = side === "right" ? "bg-brass-500/80 text-parchment-100" : "bg-ink-700 text-parchment-100";
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

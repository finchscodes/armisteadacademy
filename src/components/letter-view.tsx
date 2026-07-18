"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateLetterAction } from "@/actions/forum";
import { RichTextEditor } from "@/components/rich-text-editor";
import { RichTextDisplay } from "@/components/rich-text-display";
import { CharacterBadge } from "@/components/character-badge";
import { CharacterHoverCard } from "@/components/character-hover-card";
import { DeletePostButton } from "@/components/delete-buttons";
import { jobColor, type CharacterJob } from "@/lib/roles";

function formatLetterDate(date: Date) {
  return date.toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function LetterView({
  postId,
  content,
  editedAt,
  canEdit,
  canDelete,
  isOpeningPost,
  letterTo,
  letterFrom,
  senderCharacterId,
  senderName,
  senderSlug,
  senderAvatarUrl,
  senderJob,
  postedAt,
}: {
  postId: number;
  content: string;
  editedAt: Date | null;
  canEdit: boolean;
  canDelete: boolean;
  isOpeningPost: boolean;
  letterTo: string | null;
  letterFrom: string | null;
  /** The letter's actual author — shown separately from the free-text "from" signature, so it's always clear who really sent it. */
  senderCharacterId: number;
  senderName: string;
  senderSlug: string;
  senderAvatarUrl: string | null;
  senderJob: CharacterJob;
  postedAt: Date;
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
            const result = await updateLetterAction(undefined, fd);
            if (result?.error) {
              setError(result.error);
            } else {
              setEditing(false);
              router.refresh();
            }
          });
        }}
        className="bg-ink-900 border border-ink-700 rounded-lg p-6 space-y-3"
      >
        <div>
          <label className="block text-xs font-medium text-ink-400 mb-1" htmlFor="letterTo">
            To
          </label>
          <input
            id="letterTo"
            name="letterTo"
            defaultValue={letterTo ?? ""}
            placeholder="e.g. recipient's name"
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500 font-display"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-400 mb-1">Letter body</label>
          <RichTextEditor name="content" initialValue={content} />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-400 mb-1" htmlFor="letterFrom">
            From
          </label>
          <input
            id="letterFrom"
            name="letterFrom"
            defaultValue={letterFrom ?? ""}
            placeholder="e.g. your name"
            className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500 font-display"
          />
        </div>
        {error && <p className="text-claret-500 text-sm">{error}</p>}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="text-xs bg-gunmetal-500 text-ink-950 px-3 py-1.5 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
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

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg p-8">
      {/* Who actually wrote this, and when — separate from the stylized "to,"/"from" text below, which is free-form and can say anything. */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-ink-700 font-sans">
        <div className="flex items-center gap-2 min-w-0">
          {/* Avatar is decorative here — the hover card lives on the name. */}
          <Link href={`/c/${senderSlug}`} className="shrink-0">
            <CharacterBadge name={senderName} avatarUrl={senderAvatarUrl} size="sm" />
          </Link>
          <CharacterHoverCard characterId={senderCharacterId} slug={senderSlug} className="relative">
            <Link
              href={`/c/${senderSlug}`}
              className="text-sm hover:underline transition-colors"
              style={{ color: jobColor(senderJob) ?? "#eeeeee" }}
            >
              {senderName}
            </Link>
          </CharacterHoverCard>
          <span className="text-[11px] text-ink-400">{formatLetterDate(postedAt)}</span>
        </div>
        {canDelete && <DeletePostButton postId={postId} isOpeningPost={isOpeningPost} />}
      </div>

      <div className="font-display">
        {letterTo && <p className="font-semibold text-steel-400 mb-4">{letterTo}</p>}

        <div className="text-parchment-100/90 leading-relaxed [&_p]:mb-4 [&_p:last-child]:mb-0">
          <RichTextDisplay html={content} />
        </div>

        {letterFrom && <p className="italic text-steel-400 text-right mt-6">{letterFrom}</p>}
      </div>

      <div className="flex items-center gap-2 mt-4 justify-end font-sans">
        {editedAt && <span className="text-[11px] text-ink-500 italic">edited</span>}
        {canEdit && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[11px] text-ink-400 hover:text-gunmetal-400 transition-colors"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

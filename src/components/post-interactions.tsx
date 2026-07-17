"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  toggleReactionAction,
  addCommentAction,
} from "@/actions/post-interactions";
import { ALLOWED_REACTION_EMOJI } from "@/lib/reactions";
import type { ReactionSummary, PostCommentRow } from "@/lib/post-interactions";
import { jobColor } from "@/lib/roles";
import { CharacterBadge } from "./character-badge";
import { CharacterHoverCard } from "./character-hover-card";

export function PostInteractions({
  postId,
  reactions,
  comments,
  canInteract,
}: {
  postId: number;
  reactions: ReactionSummary[];
  comments: PostCommentRow[];
  canInteract: boolean;
}) {
  const [showComments, setShowComments] = useState(false);
  const [pending, startTransition] = useTransition();

  function react(emoji: string) {
    if (!canInteract) return;
    const formData = new FormData();
    formData.set("postId", String(postId));
    formData.set("emoji", emoji);
    startTransition(() => toggleReactionAction(formData));
  }

  function submitComment(formData: FormData) {
    startTransition(() => addCommentAction(formData));
  }

  return (
    <div className="mt-3 pt-3 border-t border-ink-700/60">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          {ALLOWED_REACTION_EMOJI.map((emoji) => {
            const summary = reactions.find((r) => r.emoji === emoji);
            const count = summary?.count ?? 0;
            const active = summary?.reactedByViewer ?? false;
            return (
              <button
                key={emoji}
                type="button"
                disabled={!canInteract || pending}
                onClick={() => react(emoji)}
                className={`text-xs px-1.5 py-0.5 rounded-full border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  active
                    ? "bg-gunmetal-500/20 border-gunmetal-500 text-gunmetal-400"
                    : "border-ink-600 hover:border-ink-400 text-parchment-100/80"
                }`}
              >
                {emoji} {count > 0 && count}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="text-xs text-ink-400 hover:text-gunmetal-400 transition-colors"
        >
          {comments.length > 0 ? `Comments (${comments.length})` : "Comment"}
        </button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-2.5">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2 items-start">
              <CharacterHoverCard
                characterId={c.characterId}
                slug={c.characterSlug}
                className="relative shrink-0"
              >
                <Link href={`/c/${c.characterSlug}`} className="shrink-0 block">
                  <CharacterBadge name={c.characterName} avatarUrl={c.characterAvatarUrl} size="sm" />
                </Link>
              </CharacterHoverCard>
              <div className="bg-ink-800/60 rounded-lg px-3 py-1.5 flex-1 min-w-0">
                <CharacterHoverCard characterId={c.characterId} slug={c.characterSlug}>
                  <Link
                    href={`/c/${c.characterSlug}`}
                    className="text-xs font-medium hover:underline"
                    style={{ color: jobColor(c.characterJob) ?? "#f6efdc" }}
                  >
                    {c.characterFirstName} {c.characterLastName}
                  </Link>
                </CharacterHoverCard>
                <p className="text-sm text-parchment-100/90">{c.content}</p>
              </div>
            </div>
          ))}

          {canInteract && (
            <form
              action={(fd) => {
                submitComment(fd);
                (document.getElementById(`comment-input-${postId}`) as HTMLInputElement).value = "";
              }}
              className="flex gap-2"
            >
              <input type="hidden" name="postId" value={postId} />
              <input
                id={`comment-input-${postId}`}
                name="content"
                required
                maxLength={1000}
                placeholder="Write a comment..."
                autoComplete="off"
                className="flex-1 min-w-0 rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm focus:outline-none focus:border-gunmetal-500"
              />
              <button
                type="submit"
                disabled={pending}
                className="text-xs bg-gunmetal-500 text-ink-950 px-3 py-1.5 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
              >
                Post
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

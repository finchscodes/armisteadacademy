"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { addCommentAction, deleteCommentAction } from "@/actions/post-interactions";
import type { PostCommentRow } from "@/lib/post-interactions";
import { jobColor } from "@/lib/roles";
import { ChatBubbleIcon } from "@/components/nav-icons";
import { CharacterBadge } from "./character-badge";
import { CharacterHoverCard } from "./character-hover-card";

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

/**
 * A single comment thread for the whole topic — used by phone and email
 * boards, whose content (a conversation, or a letter) doesn't break down
 * into individually-commentable posts the way a normal topic's replies do.
 * Technically stored against the opening post.
 */
export function TopicCommentSection({
  postId,
  comments,
  canInteract,
  canModerateComments = false,
}: {
  postId: number;
  comments: PostCommentRow[];
  canInteract: boolean;
  canModerateComments?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [commentValue, setCommentValue] = useState("");

  function submitComment(formData: FormData) {
    startTransition(() => addCommentAction(formData));
    setCommentValue("");
  }

  function deleteComment(commentId: number) {
    if (!confirm("Delete this comment?")) return;
    const formData = new FormData();
    formData.set("commentId", String(commentId));
    startTransition(() => deleteCommentAction(formData));
  }

  return (
    <div className="mt-8 border border-ink-700 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-ink-700 bg-ink-900/60">
        <span className="flex items-center gap-1.5 text-sm font-medium text-parchment-100/80">
          <ChatBubbleIcon className="w-4 h-4" />
          Comments ({comments.length})
        </span>
      </div>

      <div className="p-4 space-y-4">
        {canInteract && (
          <form
            action={(fd) => {
              fd.set("content", commentValue);
              submitComment(fd);
            }}
            className="flex gap-2 items-center"
          >
            <input type="hidden" name="postId" value={postId} />
            <input
              value={commentValue}
              onChange={(e) => setCommentValue(e.target.value)}
              required
              maxLength={1000}
              placeholder="Write a comment..."
              autoComplete="off"
              className="flex-1 rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-gunmetal-500"
            />
            <button
              type="submit"
              disabled={pending || !commentValue.trim()}
              className="text-xs bg-gunmetal-500 text-ink-950 px-3 py-2 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60 shrink-0"
            >
              Post
            </button>
          </form>
        )}

        {comments.length === 0 ? (
          <p className="text-sm text-ink-400 italic">No comments yet.</p>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2.5 items-start group">
                <CharacterHoverCard
                  characterId={c.characterId}
                  slug={c.characterSlug}
                  className="relative shrink-0"
                >
                  <Link href={`/c/${c.characterSlug}`} className="shrink-0 block">
                    <CharacterBadge name={c.characterName} avatarUrl={c.characterAvatarUrl} size="sm" />
                  </Link>
                </CharacterHoverCard>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <CharacterHoverCard characterId={c.characterId} slug={c.characterSlug}>
                      <Link
                        href={`/c/${c.characterSlug}`}
                        className="font-medium hover:underline"
                        style={{ color: jobColor(c.characterJob) ?? "#f6efdc" }}
                      >
                        {c.characterFirstName} {c.characterLastName}
                      </Link>
                    </CharacterHoverCard>{" "}
                    <span className="text-parchment-100/90">{c.content}</span>
                  </p>
                  <p className="text-xs text-ink-400 mt-0.5">{timeAgo(c.createdAt)}</p>
                </div>
                {canModerateComments && (
                  <button
                    type="button"
                    onClick={() => deleteComment(c.id)}
                    disabled={pending}
                    className="text-xs text-ink-500 hover:text-claret-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 disabled:opacity-60"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

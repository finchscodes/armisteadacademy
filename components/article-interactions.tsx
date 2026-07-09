"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toggleReactionAction, addCommentAction } from "@/actions/post-interactions";
import type { ReactionSummary, PostCommentRow } from "@/lib/post-interactions";
import { jobColor, type CharacterJob } from "@/lib/roles";
import { CharacterBadge } from "./character-badge";

const LIKE_EMOJI = "❤️";

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

export function ArticleInteractions({
  postId,
  reactions,
  comments,
  canInteract,
  posterName,
  posterSlug,
  posterJob,
  postedAt,
}: {
  postId: number;
  reactions: ReactionSummary[];
  comments: PostCommentRow[];
  canInteract: boolean;
  posterName: string;
  posterSlug: string;
  posterJob: CharacterJob;
  postedAt: Date;
}) {
  const [pending, startTransition] = useTransition();
  const [commentValue, setCommentValue] = useState("");

  const likeSummary = reactions.find((r) => r.emoji === LIKE_EMOJI);
  const likeCount = likeSummary?.count ?? 0;
  const liked = likeSummary?.reactedByViewer ?? false;

  function toggleLike() {
    if (!canInteract) return;
    const formData = new FormData();
    formData.set("postId", String(postId));
    formData.set("emoji", LIKE_EMOJI);
    startTransition(() => toggleReactionAction(formData));
  }

  function submitComment(formData: FormData) {
    startTransition(() => addCommentAction(formData));
    setCommentValue("");
  }

  return (
    <div className="mt-4 border border-ink-700 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-700 bg-ink-900/60">
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={!canInteract || pending}
            onClick={toggleLike}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              liked ? "text-claret-500" : "text-parchment-100/80 hover:text-claret-500"
            }`}
          >
            <span>{liked ? "❤️" : "🤍"}</span>
            Likes ({likeCount})
          </button>
          <span className="flex items-center gap-1.5 text-sm font-medium text-parchment-100/80">
            💬 Comments ({comments.length})
          </span>
        </div>
        <p className="text-xs text-ink-400">
          &#128340; {timeAgo(postedAt)} &middot; From:{" "}
          <Link
            href={`/c/${posterSlug}`}
            className="hover:underline"
            style={{ color: jobColor(posterJob) ?? "#d9b64a" }}
          >
            {posterName}
          </Link>
        </p>
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
              className="flex-1 rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:border-brass-500"
            />
            <button
              type="submit"
              disabled={pending || !commentValue.trim()}
              className="text-xs bg-brass-500 text-ink-950 px-3 py-2 rounded-md font-medium hover:bg-brass-400 transition-colors disabled:opacity-60 shrink-0"
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
              <div key={c.id} className="flex gap-2.5 items-start">
                <Link href={`/c/${c.characterSlug}`} className="shrink-0">
                  <CharacterBadge name={c.characterName} avatarUrl={c.characterAvatarUrl} size="sm" />
                </Link>
                <div className="min-w-0">
                  <p className="text-sm">
                    <Link
                      href={`/c/${c.characterSlug}`}
                      className="font-medium hover:underline"
                      style={{ color: jobColor(c.characterJob) ?? "#f6efdc" }}
                    >
                      {c.characterFirstName} {c.characterLastName}
                    </Link>{" "}
                    <span className="text-parchment-100/90">{c.content}</span>
                  </p>
                  <p className="text-xs text-ink-400 mt-0.5">{timeAgo(c.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

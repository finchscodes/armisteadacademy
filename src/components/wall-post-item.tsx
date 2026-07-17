"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  deleteWallPostAction,
  pinWallPostAction,
  toggleWallLikeAction,
  addWallCommentAction,
  deleteWallCommentAction,
} from "@/actions/wall";
import { CharacterBadge } from "@/components/character-badge";
import { CharacterHoverCard } from "@/components/character-hover-card";
import { RichTextDisplay } from "@/components/rich-text-display";
import { HeartIcon, ChatBubbleIcon } from "@/components/nav-icons";
import { jobColor } from "@/lib/roles";
import type { WallLikeSummary, WallCommentRow } from "@/lib/wall";

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

export function WallPostItem({
  post,
  like,
  comments,
  isWallOwner,
  isPoster,
  canInteract,
  canModerate,
  wallOwner,
}: {
  post: {
    id: number;
    content: string;
    isPinned: boolean;
    createdAt: Date;
    posterCharacterId: number;
    posterName: string;
    posterFirstName: string;
    posterLastName: string;
    posterSlug: string;
    posterAvatarUrl: string | null;
    posterJob: string;
  };
  like: WallLikeSummary;
  comments: WallCommentRow[];
  isWallOwner: boolean;
  isPoster: boolean;
  canInteract: boolean;
  canModerate: boolean;
  /** Only set on the homepage's sitewide feed — shows "→ [name]'s wall" since it isn't otherwise obvious whose wall this is. */
  wallOwner?: { name: string; slug: string };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showComments, setShowComments] = useState(false);
  const [commentValue, setCommentValue] = useState("");

  function handleDelete() {
    if (!confirm("Delete this wall post?")) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("postId", String(post.id));
      await deleteWallPostAction(formData);
      router.refresh();
    });
  }

  function handlePin() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("postId", String(post.id));
      await pinWallPostAction(formData);
      router.refresh();
    });
  }

  function handleLike() {
    if (!canInteract) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("wallPostId", String(post.id));
      await toggleWallLikeAction(formData);
      router.refresh();
    });
  }

  function handleComment(formData: FormData) {
    startTransition(async () => {
      await addWallCommentAction(formData);
      setCommentValue("");
      router.refresh();
    });
  }

  function handleDeleteComment(commentId: number) {
    if (!confirm("Delete this comment?")) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("commentId", String(commentId));
      await deleteWallCommentAction(formData);
      router.refresh();
    });
  }

  const canDelete = isWallOwner || canModerate || isPoster;

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href={`/c/${post.posterSlug}`} className="shrink-0">
            <CharacterBadge name={post.posterName} avatarUrl={post.posterAvatarUrl} size="sm" />
          </Link>
          <div className="min-w-0">
            <CharacterHoverCard characterId={post.posterCharacterId} slug={post.posterSlug} className="relative block">
              <Link
                href={`/c/${post.posterSlug}`}
                className="text-sm font-medium hover:underline"
                style={{ color: jobColor(post.posterJob as never) ?? "#f6efdc" }}
              >
                {post.posterFirstName} {post.posterLastName}
              </Link>
            </CharacterHoverCard>
            <p className="text-[11px] text-ink-400">
              {timeAgo(post.createdAt)}
              {wallOwner && (
                <>
                  <span className="text-ink-500"> &rarr; </span>
                  <Link href={`/c/${wallOwner.slug}`} className="hover:text-gunmetal-400 transition-colors">
                    {wallOwner.name}&apos;s wall
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {post.isPinned && <span className="text-[10px] uppercase tracking-wider text-gunmetal-400">Pinned</span>}
          {isWallOwner && (
            <button
              type="button"
              onClick={handlePin}
              disabled={pending}
              className="text-ink-400 hover:text-gunmetal-400 disabled:opacity-50"
              data-tooltip={post.isPinned ? "Unpin" : "Pin to top"}
            >
              📌
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="text-ink-400 hover:text-claret-500 disabled:opacity-50"
              data-tooltip="Delete"
            >
              &times;
            </button>
          )}
        </div>
      </div>
      <RichTextDisplay html={post.content} className="text-sm text-parchment-100/90" />

      <div className="mt-3 pt-3 border-t border-ink-700/60 flex items-center gap-4">
        <button
          type="button"
          disabled={!canInteract || pending}
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            like.likedByViewer ? "text-claret-500" : "text-parchment-100/70 hover:text-claret-500"
          }`}
        >
          <HeartIcon className="w-3.5 h-3.5" filled={like.likedByViewer} />
          {like.count > 0 ? like.count : "Like"}
        </button>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-parchment-100/70 hover:text-gunmetal-400 transition-colors"
        >
          <ChatBubbleIcon className="w-3.5 h-3.5" />
          {comments.length > 0 ? `Comments (${comments.length})` : "Comment"}
        </button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-2.5">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2 items-start group">
              <CharacterHoverCard characterId={c.characterId} slug={c.characterSlug} className="relative shrink-0">
                <Link href={`/c/${c.characterSlug}`} className="shrink-0 block">
                  <CharacterBadge name={c.characterName} avatarUrl={c.characterAvatarUrl} size="sm" />
                </Link>
              </CharacterHoverCard>
              <div className="bg-ink-800/60 rounded-lg px-3 py-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <CharacterHoverCard characterId={c.characterId} slug={c.characterSlug}>
                    <Link
                      href={`/c/${c.characterSlug}`}
                      className="text-xs font-medium hover:underline"
                      style={{ color: jobColor(c.characterJob) ?? "#f6efdc" }}
                    >
                      {c.characterFirstName} {c.characterLastName}
                    </Link>
                  </CharacterHoverCard>
                  {(canModerate || isWallOwner) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(c.id)}
                      disabled={pending}
                      className="text-[11px] text-ink-500 hover:text-claret-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-sm text-parchment-100/90">{c.content}</p>
              </div>
            </div>
          ))}

          {canInteract && (
            <form
              action={(fd) => {
                fd.set("content", commentValue);
                handleComment(fd);
              }}
              className="flex gap-2"
            >
              <input type="hidden" name="wallPostId" value={post.id} />
              <input
                value={commentValue}
                onChange={(e) => setCommentValue(e.target.value)}
                required
                maxLength={1000}
                placeholder="Write a comment..."
                autoComplete="off"
                className="flex-1 min-w-0 rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm focus:outline-none focus:border-gunmetal-500"
              />
              <button
                type="submit"
                disabled={pending || !commentValue.trim()}
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

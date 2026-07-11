"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteWallPostAction, pinWallPostAction } from "@/actions/wall";
import { CharacterBadge } from "@/components/character-badge";
import { CharacterHoverCard } from "@/components/character-hover-card";
import { RichTextDisplay } from "@/components/rich-text-display";
import { jobColor } from "@/lib/roles";

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
  isWallOwner,
  isPoster,
  canModerate,
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
  isWallOwner: boolean;
  isPoster: boolean;
  canModerate: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

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
            <p className="text-[11px] text-ink-400">{timeAgo(post.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {post.isPinned && <span className="text-[10px] uppercase tracking-wider text-brass-400">Pinned</span>}
          {isWallOwner && (
            <button
              type="button"
              onClick={handlePin}
              disabled={pending}
              className="text-ink-400 hover:text-brass-400 disabled:opacity-50"
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
    </div>
  );
}

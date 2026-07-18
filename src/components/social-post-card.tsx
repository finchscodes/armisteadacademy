import Link from "next/link";
import { CharacterBadge } from "@/components/character-badge";
import { CharacterHoverCard } from "@/components/character-hover-card";
import { RichTextDisplay } from "@/components/rich-text-display";
import { DeletePostButton } from "@/components/delete-buttons";
import { SocialLikeButton } from "@/components/social-like-button";
import { jobColor, type CharacterJob } from "@/lib/roles";
import type { ReactionSummary } from "@/lib/post-interactions";

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

export function SocialPostCard({
  postId,
  characterName,
  characterSlug,
  characterAvatarUrl,
  characterId,
  characterJob,
  imageUrl,
  content,
  createdAt,
  canDelete,
  reactions,
  canInteract,
}: {
  postId: number;
  characterName: string;
  characterSlug: string;
  characterAvatarUrl: string | null;
  characterId: number;
  characterJob: CharacterJob;
  imageUrl: string | null;
  content: string;
  createdAt: Date;
  canDelete: boolean;
  reactions: ReactionSummary[];
  canInteract: boolean;
}) {
  const likeReaction = reactions.find((r) => r.emoji === "\u2764\ufe0f");

  return (
    <article
      id={`post-${postId}`}
      className="bg-ink-900 border border-ink-700 rounded-lg overflow-hidden mb-4 max-w-md mx-auto scroll-mt-16"
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Link href={`/c/${characterSlug}`}>
            <CharacterBadge name={characterName} avatarUrl={characterAvatarUrl} size="sm" />
          </Link>
          <CharacterHoverCard characterId={characterId} slug={characterSlug} className="relative inline-block">
            <Link
              href={`/c/${characterSlug}`}
              className="text-sm font-medium hover:underline"
              style={{ color: jobColor(characterJob) ?? undefined }}
            >
              {characterName}
            </Link>
          </CharacterHoverCard>
        </div>
        {canDelete && <DeletePostButton postId={postId} isOpeningPost={false} />}
      </div>

      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="w-full max-h-[500px] object-cover bg-ink-950" />
      )}

      <div className="px-3 py-2.5">
        <SocialLikeButton
          postId={postId}
          count={likeReaction?.count ?? 0}
          likedByViewer={likeReaction?.reactedByViewer ?? false}
          canInteract={canInteract}
        />
        {content && (
          <div className="text-sm mt-2">
            <span className="font-medium mr-1.5">{characterName}</span>
            <RichTextDisplay html={content} className="inline" />
          </div>
        )}
        <p className="text-[11px] text-ink-500 mt-1 uppercase tracking-wide">{timeAgo(createdAt)}</p>
      </div>
    </article>
  );
}

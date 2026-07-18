import Link from "next/link";
import { CharacterBadge } from "@/components/character-badge";
import { CharacterHoverCard } from "@/components/character-hover-card";
import { RichTextDisplay } from "@/components/rich-text-display";
import { DeletePostButton } from "@/components/delete-buttons";
import { jobColor, type CharacterJob } from "@/lib/roles";

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return date.toLocaleDateString();
}

export function SocialCommentCard({
  postId,
  characterName,
  characterSlug,
  characterAvatarUrl,
  characterId,
  characterJob,
  content,
  createdAt,
  canDelete,
}: {
  postId: number;
  characterName: string;
  characterSlug: string;
  characterAvatarUrl: string | null;
  characterId: number;
  characterJob: CharacterJob;
  content: string;
  createdAt: Date;
  canDelete: boolean;
}) {
  return (
    <div id={`post-${postId}`} className="bg-ink-900 border border-ink-700 rounded-lg p-3 flex gap-3 scroll-mt-16">
      <Link href={`/c/${characterSlug}`} className="shrink-0">
        <CharacterBadge name={characterName} avatarUrl={characterAvatarUrl} size="sm" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <CharacterHoverCard characterId={characterId} slug={characterSlug} className="relative inline-block">
            <Link
              href={`/c/${characterSlug}`}
              className="font-medium hover:underline"
              style={{ color: jobColor(characterJob) ?? undefined }}
            >
              {characterName}
            </Link>
          </CharacterHoverCard>{" "}
          <span className="text-ink-500 text-xs">{timeAgo(createdAt)}</span>
          {"  "}
          {content && <RichTextDisplay html={content} className="inline" />}
        </p>
      </div>
      {canDelete && <DeletePostButton postId={postId} isOpeningPost={false} />}
    </div>
  );
}

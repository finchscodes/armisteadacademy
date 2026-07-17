import Link from "next/link";
import { CharacterBadge } from "./character-badge";
import { CharacterHoverCard } from "./character-hover-card";
import { jobColor, type CharacterJob } from "@/lib/roles";

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

export type FeedItem = {
  id: number;
  excerpt: string;
  createdAt: Date;
  characterId: number;
  characterName: string;
  characterSlug: string;
  characterFirstName: string;
  characterLastName: string;
  characterJob: CharacterJob;
  characterAvatarUrl: string | null;
  threadTitle: string;
  threadSlug: string;
  boardName: string;
  boardSlug: string;
};

export function FeedItemCard({ item }: { item: FeedItem }) {
  return (
    <article className="bg-ink-900 border border-ink-700 rounded-lg p-4 flex gap-3">
      <CharacterHoverCard characterId={item.characterId} slug={item.characterSlug} className="relative shrink-0">
        <Link href={`/c/${item.characterSlug}`} className="shrink-0 block">
          <CharacterBadge name={item.characterName} avatarUrl={item.characterAvatarUrl} />
        </Link>
      </CharacterHoverCard>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <CharacterHoverCard characterId={item.characterId} slug={item.characterSlug}>
            <Link
              href={`/c/${item.characterSlug}`}
              className="text-parchment-100 font-medium hover:underline"
              style={{ color: jobColor(item.characterJob) ?? undefined }}
            >
              {item.characterFirstName} {item.characterLastName}
            </Link>
          </CharacterHoverCard>
          <span className="text-ink-400"> posted in </span>
          <Link href={`/t/${item.threadSlug}`} className="text-gunmetal-400 hover:underline">
            {item.threadTitle}
          </Link>
        </p>
        <p className="text-xs text-ink-400 mt-0.5">
          {item.boardName} &middot; {timeAgo(item.createdAt)}
        </p>
        <p className="text-sm text-parchment-100/90 mt-2 whitespace-pre-wrap">{item.excerpt}</p>
      </div>
    </article>
  );
}

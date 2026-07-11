import Link from "next/link";
import { getRecentWallActivity } from "@/lib/wall";
import { CharacterBadge } from "@/components/character-badge";
import { CharacterHoverCard } from "@/components/character-hover-card";
import { stripToPlainText } from "@/lib/sanitize";

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

export async function HomeWallFeed() {
  const activity = await getRecentWallActivity(50);
  if (activity.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="font-display text-sm text-brass-400 uppercase tracking-wider">Wall activity</h2>
        <div className="flex-1 brass-rule" />
      </div>
      <div className="space-y-2">
        {activity.map((a) => {
          if (!a.poster || !a.wallOwner) return null;
          const isSelfPost = a.poster.id === a.wallOwner.id;
          return (
            <div key={a.id} className="bg-ink-900 border border-ink-700 p-3">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <CharacterHoverCard characterId={a.poster.id} slug={a.poster.slug} className="relative shrink-0">
                  <Link href={`/c/${a.poster.slug}`}>
                    <CharacterBadge name={a.poster.name} avatarUrl={a.poster.avatarUrl} size="sm" />
                  </Link>
                </CharacterHoverCard>
                <p className="text-xs">
                  <Link href={`/c/${a.poster.slug}`} className="text-parchment-100 hover:text-brass-400">
                    {a.poster.firstName} {a.poster.lastName}
                  </Link>
                  {!isSelfPost && (
                    <>
                      <span className="text-ink-400"> &rarr; </span>
                      <Link href={`/c/${a.wallOwner.slug}`} className="text-parchment-100 hover:text-brass-400">
                        {a.wallOwner.firstName} {a.wallOwner.lastName}
                      </Link>
                    </>
                  )}
                  {isSelfPost && <span className="text-ink-400"> posted on their own wall</span>}
                  <span className="text-ink-500"> &middot; {timeAgo(a.createdAt)}</span>
                </p>
              </div>
              <Link href={`/c/${a.wallOwner.slug}`} className="block text-xs text-parchment-100/80 line-clamp-2">
                {stripToPlainText(a.content)}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

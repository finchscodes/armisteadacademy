import Link from "next/link";
import { db } from "@/db";
import { boards } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { getOnlineCharactersDetailed } from "@/lib/online-status";
import { getRecentTopics } from "@/lib/feed";
import { CharacterBadge } from "@/components/character-badge";
import { CharacterHoverCard } from "@/components/character-hover-card";
import { jobColor } from "@/lib/roles";

const COMMUNICATION_SLUGS = ["text-messages", "social-media", "emails-letters", "phone-calls"];

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

export default async function SocialPage() {
  const [commBoards, online, topics] = await Promise.all([
    db.select().from(boards).where(inArray(boards.slug, COMMUNICATION_SLUGS)),
    getOnlineCharactersDetailed(),
    getRecentTopics(6),
  ]);

  const boardsInOrder = COMMUNICATION_SLUGS.map((slug) =>
    commBoards.find((b) => b.slug === slug)
  ).filter((b): b is NonNullable<typeof b> => Boolean(b));

  return (
    <div>
      <h1 className="font-display text-3xl text-brass-400 mb-1">Social Media</h1>
      <p className="text-ink-400 text-sm mb-6">
        Where Armistead keeps in touch — and who&apos;s around right now.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {boardsInOrder.map((b) => (
          <Link
            key={b.id}
            href={`/b/${b.slug}`}
            className="bg-ink-900 border border-ink-700 rounded-lg p-4 text-center hover:border-brass-500/50 transition-colors"
          >
            <p className="font-display text-parchment-100">{b.name}</p>
          </Link>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="font-display text-lg text-parchment-100 mb-3">Recent activity</h2>
        {topics.length === 0 ? (
          <p className="text-sm text-ink-400">Nothing posted yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topics.map((t) => (
              <Link
                key={t.threadId}
                href={`/t/${t.threadSlug}`}
                className="bg-ink-900 border border-ink-700 rounded-lg p-4 hover:border-brass-500/50 transition-colors"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <CharacterHoverCard
                    characterId={t.characterId}
                    slug={t.characterSlug}
                    className="relative shrink-0"
                  >
                    <CharacterBadge name={t.characterName} avatarUrl={t.characterAvatarUrl} size="sm" />
                  </CharacterHoverCard>
                  <div className="min-w-0">
                    <p className="text-sm truncate">
                      <span style={{ color: jobColor(t.characterJob) ?? undefined }}>
                        {t.characterFirstName} {t.characterLastName}
                      </span>
                      <span className="text-ink-400"> posted in </span>
                      <span className="text-brass-400">{t.threadTitle}</span>
                    </p>
                    <p className="text-xs text-ink-400">
                      {t.boardName} &middot; {timeAgo(t.postCreatedAt)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-parchment-100/80 line-clamp-3">{t.excerpt}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-display text-lg text-parchment-100 mb-3">
          Online now <span className="text-ink-400 text-sm">({online.length})</span>
        </h2>
        {online.length === 0 ? (
          <p className="text-sm text-ink-400">Nobody&apos;s around right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {online.map((c) => (
              <Link
                key={c.id}
                href={`/c/${c.slug}`}
                className="bg-ink-900 border border-ink-700 rounded-lg p-4 flex items-center gap-3 hover:border-brass-500/50 transition-colors"
              >
                <CharacterHoverCard characterId={c.id} slug={c.slug} className="relative shrink-0">
                  <CharacterBadge name={c.name} avatarUrl={c.avatarUrl} size="sm" />
                </CharacterHoverCard>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-parchment-100 truncate">
                    {c.firstName} {c.lastName}
                  </p>
                  <p className="text-xs text-ink-400">
                    Age {c.age} &middot; {c.year}
                  </p>
                </div>
                <p className="text-xs text-brass-400 shrink-0">{c.major}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

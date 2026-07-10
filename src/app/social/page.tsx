import Link from "next/link";
import { db } from "@/db";
import { boards } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { getOnlineCharactersDetailed } from "@/lib/online-status";
import { getRecentFeedPosts } from "@/lib/feed";
import { CharacterBadge } from "@/components/character-badge";
import { CharacterHoverCard } from "@/components/character-hover-card";
import { FeedItemCard } from "@/components/feed-item";

const COMMUNICATION_SLUGS = ["text-messages", "social-media", "emails-letters", "phone-calls"];

export default async function SocialPage() {
  const [commBoards, online, feed] = await Promise.all([
    db.select().from(boards).where(inArray(boards.slug, COMMUNICATION_SLUGS)),
    getOnlineCharactersDetailed(),
    getRecentFeedPosts(15),
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

      <div className="max-w-2xl space-y-8">
        <div>
          <h2 className="font-display text-lg text-parchment-100 mb-3">Recent activity</h2>
          {feed.length === 0 ? (
            <p className="text-sm text-ink-400">Nothing posted yet.</p>
          ) : (
            <div className="space-y-3">
              {feed.map((item) => (
                <FeedItemCard key={item.id} item={item} />
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
            <div className="bg-ink-900 border border-ink-700 rounded-lg divide-y divide-ink-700">
              {online.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                  <CharacterHoverCard characterId={c.id} slug={c.slug} className="relative shrink-0">
                    <Link href={`/c/${c.slug}`}>
                      <CharacterBadge name={c.name} avatarUrl={c.avatarUrl} size="sm" />
                    </Link>
                  </CharacterHoverCard>
                  <div className="min-w-0 flex-1">
                    <Link href={`/c/${c.slug}`} className="text-sm text-parchment-100 hover:text-brass-400">
                      {c.firstName} {c.lastName}
                    </Link>
                    <p className="text-xs text-ink-400">
                      Age {c.age} &middot; {c.year}
                    </p>
                  </div>
                  <p className="text-xs text-brass-400 shrink-0">{c.major}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

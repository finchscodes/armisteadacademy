import Link from "next/link";

// Shows live online/recent-activity data — must render per-request, never
// prerendered at build time (which would hit the database during the build
// itself, and previously caused the Vercel build to hang/time out).
export const dynamic = "force-dynamic";

import { getOnlineCharactersDetailed } from "@/lib/online-status";
import { getRecentTopics } from "@/lib/feed";
import { getMajorCounts } from "@/lib/reputation";
import { CharacterBadge } from "@/components/character-badge";
import { CharacterHoverCard } from "@/components/character-hover-card";
import { jobColor } from "@/lib/roles";
import { getMajorColor } from "@/lib/majors";

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
  const [online, topics, majorCounts] = await Promise.all([
    getOnlineCharactersDetailed(),
    getRecentTopics(6),
    getMajorCounts(),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl text-brass-400 mb-1">Social Media</h1>
      <div className="flex items-center justify-between mb-6">
        <p className="text-ink-400 text-sm">
          Where Armistead keeps in touch — and who&apos;s around right now.
        </p>
        <Link
          href="/members"
          className="shrink-0 text-sm bg-ink-900 border border-ink-700 text-parchment-100 px-4 py-2 rounded-md hover:border-brass-500/50 transition-colors"
        >
          Member List
        </Link>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto">
        {majorCounts.map((m) => (
          <div
            key={m.major}
            className="bg-ink-900 border border-ink-700 rounded-lg p-2.5 flex-1 min-w-[90px] text-center"
          >
            <p
              className="text-[10px] leading-tight line-clamp-2"
              style={{ color: getMajorColor(m.major) ?? undefined }}
            >
              {m.major}
            </p>
            <p className="text-base font-display text-brass-400 mt-1">{m.count}</p>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="font-display text-lg text-parchment-100 mb-3">Recent activity</h2>
        {topics.length === 0 ? (
          <p className="text-sm text-ink-400">Nothing posted yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topics.map((t) => (
              <div
                key={t.threadId}
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
                      <Link href={`/t/${t.threadSlug}`} className="text-brass-400 hover:underline">
                        {t.threadTitle}
                      </Link>
                    </p>
                    <p className="text-xs text-ink-400">
                      {t.boardName} &middot; {timeAgo(t.postCreatedAt)}
                    </p>
                  </div>
                </div>
                <Link href={`/t/${t.threadSlug}`} className="block text-xs text-parchment-100/80 line-clamp-3">
                  {t.excerpt}
                </Link>
              </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {online.map((c) => (
              <div
                key={c.id}
                className="bg-ink-900 border border-ink-700 rounded-lg p-4 hover:border-brass-500/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CharacterHoverCard characterId={c.id} slug={c.slug} className="relative shrink-0">
                    <CharacterBadge name={c.name} avatarUrl={c.avatarUrl} size="sm" />
                  </CharacterHoverCard>
                  <div className="min-w-0">
                    <Link href={`/c/${c.slug}`} className="text-sm text-parchment-100 hover:text-brass-400 block truncate">
                      {c.firstName} {c.lastName}
                    </Link>
                    <p className="text-xs text-ink-400">
                      Age {c.age} &middot; {c.year}
                    </p>
                  </div>
                </div>
                <p className="text-xs mt-2 leading-snug" style={{ color: getMajorColor(c.major) ?? undefined }}>
                  {c.major}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { getRecentChatMessages } from "@/actions/chat";
import { getOnlineCharacters } from "@/lib/online-status";
import { characterHasAnyJob } from "@/lib/character-jobs";
import { MANAGEMENT_JOBS } from "@/lib/roles";
import { CollapsibleChat } from "@/components/collapsible-chat";
import { CharacterBadge } from "@/components/character-badge";
import { CharacterHoverCard } from "@/components/character-hover-card";
import { AnnouncementWidget } from "@/components/announcement-widget";
import { NewsWidget } from "@/components/news-widget";
import { SpotlightWidget } from "@/components/spotlight-widget";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [current, chatMessages, online] = await Promise.all([
    getCurrentUser(),
    getRecentChatMessages(50),
    getOnlineCharacters(),
  ]);

  const canChat = Boolean(current?.activeCharacter);
  const canPingAll = current
    ? current.session.isAdmin ||
      (current.activeCharacter
        ? await characterHasAnyJob(current.activeCharacter.id, MANAGEMENT_JOBS)
        : false)
    : false;
  const initialChatMessages = chatMessages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      <div className="w-full lg:w-72 shrink-0 space-y-6">
        <AnnouncementWidget />
        <SpotlightWidget />
        <NewsWidget />
      </div>

      <div className="flex-1 min-w-0 space-y-6">
        {!current && (
          <div className="bg-ink-900 border border-ink-700 rounded-lg p-6">
            <h1 className="font-display text-2xl text-brass-400 mb-1">Armistead Academy</h1>
            <p className="text-ink-400 text-sm mb-4">
              A spy academy roleplay: forums, lessons, and an in-world economy.
            </p>
            <div className="flex gap-3">
              <Link
                href="/register"
                className="text-sm bg-brass-500 text-ink-950 px-4 py-2 rounded-md font-medium hover:bg-brass-400 transition-colors"
              >
                Join
              </Link>
              <Link
                href="/login"
                className="text-sm text-ink-200 hover:text-brass-400 px-4 py-2"
              >
                Log in
              </Link>
            </div>
            <p className="text-xs text-ink-400 mt-4 pt-4 border-t border-ink-700">
              New here? Read the{" "}
              <Link href="/guide" className="text-brass-400 hover:underline">
                Rules &amp; Guidelines
              </Link>{" "}
              first — it covers what to expect before you create a character.
            </p>
          </div>
        )}
        {current && !current.activeCharacter && (
          <div className="bg-ink-900 border border-ink-700 rounded-lg p-5">
            <p className="text-parchment-100">You don&apos;t have a character yet.</p>
            <Link href="/characters/new" className="text-sm text-brass-400 hover:underline">
              Create one to start posting &rarr;
            </Link>
          </div>
        )}

        <div>
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/social"
              className="font-display text-sm text-brass-400 hover:underline uppercase tracking-wider"
            >
              Online
            </Link>
            <div className="flex-1 brass-rule" />
            <span className="text-xs text-ink-400">{online.length}</span>
          </div>
          {online.length === 0 ? (
            <p className="text-xs text-ink-400 italic">Nobody&apos;s around right now.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {online.slice(0, 20).map((c) => (
                <CharacterHoverCard key={c.id} characterId={c.id} slug={c.slug} className="relative">
                  <Link href={`/c/${c.slug}`}>
                    <CharacterBadge name={c.name} avatarUrl={c.avatarUrl} size="sm" />
                  </Link>
                </CharacterHoverCard>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-auto lg:sticky lg:top-14">
        <CollapsibleChat
          initialMessages={initialChatMessages}
          initialOnline={online}
          canChat={canChat}
          canPingAll={canPingAll}
          myCharacterId={current?.activeCharacter?.id ?? null}
          myFirstName={current?.activeCharacter?.firstName ?? null}
          myLastName={current?.activeCharacter?.lastName ?? null}
        />
      </div>
    </div>
  );
}

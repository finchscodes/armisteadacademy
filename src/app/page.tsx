import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { AnnouncementWidget } from "@/components/announcement-widget";
import { NewsWidget } from "@/components/news-widget";
import { SpotlightWidget } from "@/components/spotlight-widget";
import { NewestMemberWidget } from "@/components/newest-member-widget";
import { SiteLinksWidget } from "@/components/site-links-widget";
import { HomeWallFeed } from "@/components/home-wall-feed";
import { GameTimeWidget } from "@/components/game-time-widget";
import { ConfessionWidget } from "@/components/confession-widget";
import { getApprovedConfessions } from "@/lib/confessions";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const current = await getCurrentUser();

  let confessions: { id: number; content: string }[] = [];
  try {
    confessions = await getApprovedConfessions();
  } catch (err) {
    console.error("ConfessionWidget failed to load:", err);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      <div className="w-full lg:w-72 shrink-0 space-y-6">
        <ConfessionWidget confessions={confessions} canSubmit={Boolean(current?.activeCharacter)} />
        <GameTimeWidget />
        <AnnouncementWidget />
        <SpotlightWidget />
        <NewsWidget />
        <NewestMemberWidget />
        <SiteLinksWidget />
      </div>

      <div className="flex-1 w-full min-w-0 space-y-6">
        {!current && (
          <div className="bg-ink-900 border border-ink-700 rounded-lg p-6">
            <h1 className="font-display text-2xl text-gunmetal-400 mb-1">Armistead Academy</h1>
            <p className="text-ink-400 text-sm mb-4">
              A spy academy roleplay: forums, lessons, and an in-world economy.
            </p>
            <div className="flex gap-3">
              <Link
                href="/register"
                className="text-sm bg-gunmetal-500 text-ink-950 px-4 py-2 rounded-md font-medium hover:bg-gunmetal-400 transition-colors"
              >
                Join
              </Link>
              <Link
                href="/login"
                className="text-sm text-ink-200 hover:text-gunmetal-400 px-4 py-2"
              >
                Log in
              </Link>
            </div>
            <p className="text-xs text-ink-400 mt-4 pt-4 border-t border-ink-700">
              New here? Read the{" "}
              <Link href="/guide" className="text-gunmetal-400 hover:underline">
                Rules &amp; Guidelines
              </Link>{" "}
              first — it covers what to expect before you create a character.
            </p>
          </div>
        )}
        {current && !current.activeCharacter && (
          <div className="bg-ink-900 border border-ink-700 rounded-lg p-5">
            <p className="text-parchment-100">You don&apos;t have a character yet.</p>
            <Link href="/characters/new" className="text-sm text-gunmetal-400 hover:underline">
              Create one to start posting &rarr;
            </Link>
          </div>
        )}

        <HomeWallFeed />
      </div>
    </div>
  );
}

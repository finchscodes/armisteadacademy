import { getHomeAnnouncement, getSpotlightEntries } from "@/actions/admin";
import { AnnouncementForm } from "@/components/announcement-form";
import { SpotlightForm } from "@/components/spotlight-form";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

export default async function AdminHomeBoardPage() {
  const [announcement, spotlight] = await Promise.all([
    getHomeAnnouncement(),
    getSpotlightEntries(),
  ]);

  return (
    <div className="max-w-xl space-y-10">
      <div>
        <h2 className="font-display text-lg text-parchment-100 mb-1">Announcement</h2>
        <p className="text-xs text-ink-400 mb-3">
          Shown at the top of the homepage&apos;s left column. Weather shows automatically
          alongside it — nothing to configure.
        </p>
        <AnnouncementForm title={announcement?.title ?? "Welcome!"} content={announcement?.content ?? ""} />
      </div>

      <div>
        <h2 className="font-display text-lg text-parchment-100 mb-1">Spotlight of the Week</h2>
        <p className="text-xs text-ink-400 mb-3">
          Up to two characters, featured on every homepage with a short blurb on why.
        </p>
        <SpotlightForm entries={spotlight} />
      </div>

      <div>
        <h2 className="font-display text-lg text-parchment-100 mb-1">News</h2>
        <p className="text-xs text-ink-400">
          Updates on its own — it&apos;s just the most recent posts across every article board
          (Notice Board, Armistead Weekly, etc). Nothing to manage here.
        </p>
      </div>
    </div>
  );
}

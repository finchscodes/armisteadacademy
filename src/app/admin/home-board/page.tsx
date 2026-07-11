import { getHomeAnnouncement, getSpotlightEntries, getSiteLinks } from "@/actions/admin";
import { AnnouncementForm } from "@/components/announcement-form";
import { SpotlightForm } from "@/components/spotlight-form";
import { SiteLinksForm } from "@/components/site-links-form";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

export default async function AdminHomeBoardPage() {
  const [announcement, spotlight, links] = await Promise.all([
    getHomeAnnouncement(),
    getSpotlightEntries(),
    getSiteLinks(),
  ]);

  return (
    <div className="max-w-xl space-y-10">
      <div>
        <h2 className="font-display text-lg text-parchment-100 mb-3">Announcement</h2>
        <AnnouncementForm title={announcement?.title ?? "Welcome!"} content={announcement?.content ?? ""} />
      </div>

      <div>
        <h2 className="font-display text-lg text-parchment-100 mb-3">Spotlight of the Week</h2>
        <SpotlightForm entries={spotlight} />
      </div>

      <div>
        <h2 className="font-display text-lg text-parchment-100 mb-3">Link buttons</h2>
        <SiteLinksForm links={links} />
      </div>
    </div>
  );
}

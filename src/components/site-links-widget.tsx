import { getSiteLinks } from "@/actions/admin";

export async function SiteLinksWidget() {
  const links = await getSiteLinks();
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => (
        <a
          key={l.id}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center text-xs bg-ink-900 border border-ink-700 text-parchment-100 px-3 py-2 hover:border-brass-500/50 transition-colors"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}

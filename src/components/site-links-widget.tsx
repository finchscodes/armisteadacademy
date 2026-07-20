import { getSiteLinks } from "@/actions/admin";

export async function SiteLinksWidget() {
  let links;
  try {
    links = await getSiteLinks();
  } catch (err) {
    console.error("SiteLinksWidget failed to load:", err);
    return null;
  }
  if (links.length === 0) return null;

  const isOdd = links.length % 2 !== 0;

  return (
    <div className="grid grid-cols-2 gap-2">
      {links.map((l, i) => {
        const isLastOdd = isOdd && i === links.length - 1;
        return (
          <a
            key={l.id}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-center bg-ink-900 border border-ink-700 rounded-md text-parchment-100 px-3 py-2 hover:border-gunmetal-500/50 hover:text-gunmetal-400 transition-colors font-ui text-[11px] font-bold uppercase tracking-wider ${
              isLastOdd ? "col-span-2" : ""
            }`}
          >
            {l.label}
          </a>
        );
      })}
    </div>
  );
}

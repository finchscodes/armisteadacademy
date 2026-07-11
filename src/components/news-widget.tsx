import Link from "next/link";
import { getRecentNews } from "@/lib/news";

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export async function NewsWidget() {
  const news = await getRecentNews(6);

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-ink-700">
        <h2 className="font-ui text-xs uppercase tracking-widest text-ink-400">News</h2>
      </div>
      <div className="p-4">
        {news.length === 0 ? (
          <p className="text-sm text-ink-400 italic">Nothing posted yet.</p>
        ) : (
          <div className="space-y-3">
            {news.map((n) => (
              <Link key={n.id} href={`/t/${n.slug}`} className="block group">
                <p className="text-sm font-medium text-parchment-100 group-hover:text-brass-400 transition-colors">
                  {n.boardName} | {n.title}
                </p>
                <p className="text-[11px] text-ink-400">
                  {timeAgo(n.createdAt)} &middot; {n.boardName}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

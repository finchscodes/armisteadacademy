import { getHomeAnnouncement } from "@/actions/admin";
import { getCurrentWeather } from "@/lib/weather";
import { RichTextDisplay } from "@/components/rich-text-display";

export async function AnnouncementWidget() {
  let announcement, weather;
  try {
    [announcement, weather] = await Promise.all([getHomeAnnouncement(), getCurrentWeather()]);
  } catch (err) {
    console.error("AnnouncementWidget failed to load:", err);
    return null;
  }

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-ink-700 flex items-center justify-between">
        <h2 className="font-ui text-xs uppercase tracking-widest text-ink-400">
          {announcement?.title ?? "Welcome!"}
        </h2>
        {weather && (
          <span className="text-xs font-mono text-parchment-100/90 flex items-center gap-1 shrink-0 ml-3">
            <span>{weather.icon}</span>
            {weather.temperatureF}&deg;F
          </span>
        )}
      </div>
      <div className="p-4">
        {announcement?.content ? (
          <RichTextDisplay html={announcement.content} className="text-sm text-parchment-100/90" />
        ) : (
          <p className="text-sm text-ink-400 italic">Nothing posted yet.</p>
        )}
      </div>
    </div>
  );
}

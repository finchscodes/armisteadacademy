import { getHomeAnnouncement } from "@/actions/admin";
import { getCurrentWeather } from "@/lib/weather";
import { RichTextDisplay } from "@/components/rich-text-display";

export async function AnnouncementWidget() {
  const [announcement, weather] = await Promise.all([getHomeAnnouncement(), getCurrentWeather()]);

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-claret-700 to-claret-600 px-4 py-2.5 flex items-center justify-between">
        <h2 className="font-display text-parchment-100">
          {announcement?.title ?? "Welcome!"}
        </h2>
        {weather && (
          <span className="text-xs text-parchment-100/90 flex items-center gap-1 shrink-0 ml-3">
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

// A fixed reference location for the homepage weather widget. Change these
// coordinates if you'd like the widget to reflect somewhere else.
const LOCATION = { name: "Mill Creek, WA", latitude: 47.86, longitude: -122.2 };

// WMO weather codes -> a short label + emoji. Not exhaustive, but covers the
// common cases; unknown codes fall back to a generic label.
const WEATHER_CODES: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mostly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Foggy", icon: "🌫️" },
  48: { label: "Foggy", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Heavy drizzle", icon: "🌧️" },
  61: { label: "Light rain", icon: "🌧️" },
  63: { label: "Rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  71: { label: "Light snow", icon: "🌨️" },
  73: { label: "Snow", icon: "🌨️" },
  75: { label: "Heavy snow", icon: "❄️" },
  80: { label: "Rain showers", icon: "🌦️" },
  81: { label: "Rain showers", icon: "🌦️" },
  82: { label: "Violent showers", icon: "⛈️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm", icon: "⛈️" },
  99: { label: "Thunderstorm", icon: "⛈️" },
};

export type WeatherSnapshot = {
  locationName: string;
  temperatureF: number;
  label: string;
  icon: string;
};

/** Best-effort — returns null on any failure so the widget can just hide itself. */
export async function getCurrentWeather(): Promise<WeatherSnapshot | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LOCATION.latitude}&longitude=${LOCATION.longitude}&current_weather=true&temperature_unit=fahrenheit`;
    const res = await fetch(url, { next: { revalidate: 1800 } }); // cache 30 min
    if (!res.ok) return null;
    const data = await res.json();
    const code = data?.current_weather?.weathercode;
    const temp = data?.current_weather?.temperature;
    if (typeof temp !== "number") return null;

    const meta = WEATHER_CODES[code] ?? { label: "Weather", icon: "🌡️" };
    return {
      locationName: LOCATION.name,
      temperatureF: Math.round(temp),
      label: meta.label,
      icon: meta.icon,
    };
  } catch {
    return null;
  }
}

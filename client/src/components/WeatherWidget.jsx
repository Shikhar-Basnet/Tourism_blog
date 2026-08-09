import { useQuery } from "@tanstack/react-query";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, Droplets, Wind } from "lucide-react";
import { fetchWeather } from "../services/weatherService.js";

const CODE_MAP = {
  0: { label: "Clear sky", Icon: Sun },
  1: { label: "Mostly clear", Icon: Sun },
  2: { label: "Partly cloudy", Icon: Cloud },
  3: { label: "Overcast", Icon: Cloud },
  45: { label: "Fog", Icon: CloudFog },
  48: { label: "Rime fog", Icon: CloudFog },
  51: { label: "Light drizzle", Icon: CloudRain },
  53: { label: "Drizzle", Icon: CloudRain },
  55: { label: "Dense drizzle", Icon: CloudRain },
  61: { label: "Light rain", Icon: CloudRain },
  63: { label: "Rain", Icon: CloudRain },
  65: { label: "Heavy rain", Icon: CloudRain },
  71: { label: "Light snow", Icon: CloudSnow },
  73: { label: "Snow", Icon: CloudSnow },
  75: { label: "Heavy snow", Icon: CloudSnow },
  80: { label: "Rain showers", Icon: CloudRain },
  95: { label: "Thunderstorm", Icon: CloudLightning },
};
const describe = (code) => CODE_MAP[code] || { label: "Weather", Icon: Cloud };

export default function WeatherWidget({ lat, lng }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["weather", lat, lng],
    queryFn: () => fetchWeather(lat, lng),
    enabled: lat != null && lng != null,
    staleTime: 1000 * 60 * 15, // weather doesn't change minute to minute
  });

  if (lat == null || lng == null) return null;

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
        <div className="h-20 animate-pulse rounded bg-sky-50" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl bg-white p-5 text-sm text-gray-600 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
        Weather is unavailable right now.
      </div>
    );
  }

  const current = data.current;
  const { label, Icon } = describe(current.weather_code);

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
      {/* Warm sky-blue gradient header for the current conditions */}
      <div className="flex items-center justify-between bg-gradient-to-br from-sky-400 to-blue-600 p-5 text-white">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-sky-100">Current weather</p>
          <p className="mt-1 text-4xl font-normal">{Math.round(current.temperature_2m)}°C</p>
          <p className="text-sm text-sky-50">{label}</p>
        </div>
        <Icon size={44} className="text-white drop-shadow" />
      </div>

      <div className="flex gap-3 p-4">
        <span className="flex flex-1 items-center justify-center gap-1.5 rounded bg-cyan-50 px-3 py-2 text-xs font-medium text-cyan-700">
          <Droplets size={14} /> {current.relative_humidity_2m}% humidity
        </span>
        <span className="flex flex-1 items-center justify-center gap-1.5 rounded bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
          <Wind size={14} /> {Math.round(current.wind_speed_10m)} km/h
        </span>
      </div>

      {data.daily && (
        <div className="grid grid-cols-5 gap-2 border-t border-gray-100 p-4">
          {data.daily.time.slice(0, 5).map((date, i) => {
            const { Icon: DayIcon } = describe(data.daily.weather_code[i]);
            return (
              <div key={date} className="flex flex-col items-center gap-1 rounded bg-gray-50 py-2 text-center">
                <span className="text-[11px] text-gray-600">
                  {new Date(date).toLocaleDateString(undefined, { weekday: "short" })}
                </span>
                <DayIcon size={16} className="text-blue-500" />
                <span className="text-[11px] font-medium text-gray-900">
                  {Math.round(data.daily.temperature_2m_max[i])}°/{Math.round(data.daily.temperature_2m_min[i])}°
                </span>
              </div>
            );
          })}
        </div>
      )}

      <p className="px-4 pb-3 text-right text-[10px] text-gray-400">via Open-Meteo</p>
    </div>
  );
}
import axios from "axios";

const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

export const fetchWeather = async (lat, lng) => {
  const { data } = await axios.get(WEATHER_API, {
    params: {
      latitude: lat,
      longitude: lng,
      current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
      daily: "weather_code,temperature_2m_max,temperature_2m_min",
      timezone: "auto",
      forecast_days: 5,
    },
  });
  return data;
};
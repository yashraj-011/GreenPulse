// services/realtimeWeather.js
import axios from "axios";

export async function getRealtimeWeather() {
  try {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=28.6&longitude=77.2&hourly=temperature_2m,relativehumidity_2m,windspeed_10m";
    const resp = await axios.get(url);

    const h = resp.data.hourly;

    return {
      temp: h.temperature_2m[0],
      humidity: h.relativehumidity_2m[0],
      wind: h.windspeed_10m[0]
    };
  } catch (err) {
    console.error("Open-Meteo error:", err.message);
    return { temp: 25, humidity: 40, wind: 2 };
  }
}

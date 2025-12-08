// services/openweatherPollution.js
import axios from "axios";

const { OPENWEATHER_KEY } = process.env;

export async function getOpenWeatherPollution() {
  try {
    const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=28.6&lon=77.2&appid=${OPENWEATHER_KEY}`;
    const resp = await axios.get(url);

    const item = resp.data.list[0];
    const c = item.components;

    return {
      pm25: c.pm2_5,
      pm10: c.pm10,
      no: c.no,
      no2: c.no2,
      o3: c.o3,
      so2: c.so2,
      co: c.co,
      nh3: c.nh3,
      aqi_index: item.main.aqi
    };
  } catch (err) {
    console.error("OpenWeather error:", err.message);
    return null;
  }
}

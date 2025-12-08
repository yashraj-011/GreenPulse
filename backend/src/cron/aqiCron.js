// src/cron/aqiCron.js
import cron from "node-cron";
import axios from "axios";
import prisma from "../config/prisma.js";

// Replace with your AQICN Token
const AQICN_TOKEN = process.env.AQICN_TOKEN;

// List of stations you want to save automatically
const STATIONS = [
  { city: "Delhi", name: "Punjabi Bagh", api: "delhi/punjabi-bagh" },
  { city: "Delhi", name: "Anand Vihar", api: "delhi/anand-vihar" },
  { city: "Delhi", name: "Mandir Marg", api: "delhi/mandir-marg" },
  // add more...
];

async function fetchAQI(stationApi) {
  try {
    const url = `https://api.waqi.info/feed/${stationApi}/?token=${AQICN_TOKEN}`;
    const res = await axios.get(url);

    if (!res.data || res.data.status !== "ok") return null;

    const aqi = res.data.data.aqi;
    const category =
      aqi <= 50
        ? "Good"
        : aqi <= 100
        ? "Moderate"
        : aqi <= 200
        ? "Poor"
        : aqi <= 300
        ? "Very Poor"
        : "Severe";

    return { aqi, category };
  } catch (err) {
    console.error("AQI Fetch Error:", err.message);
    return null;
  }
}

async function saveAQI(city, stationName, value, category) {
  try {
    await prisma.aqiData.create({
      data: {
        city,
        stationName,
        aqiValue: value,
        category
      }
    });

    console.log(`✅ Saved AQI for ${stationName}: ${value}`);
  } catch (err) {
    console.error("AQI Save Error:", err.message);
  }
}

// -------------------------------------------
// CRON JOB — Runs Every 10 Minutes
// -------------------------------------------
export function startAqiCron() {
  console.log("🔄 Starting Auto AQI Cron (every 10 min)");

  cron.schedule("*/10 * * * *", async () => {
    console.log("⏳ Fetching and saving AQI...");

    for (const s of STATIONS) {
      const result = await fetchAQI(s.api);

      if (result) {
        await saveAQI(s.city, s.name, result.aqi, result.category);
      } else {
        console.log(`⚠ Could not fetch AQI for ${s.name}`);
      }
    }

    console.log("✔ AQI cron cycle complete.");
  });
}

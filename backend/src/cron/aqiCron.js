// src/cron/aqiCron.js
import cron from "node-cron";
import axios from "axios";
import prisma from "../config/prisma.js";

// Replace with your AQICN Token
const AQICN_TOKEN = process.env.AQICN_TOKEN;

// List of stations you want to save automatically - expanded to cover more Delhi stations
const STATIONS = [
  // High priority stations with reliable AQICN feeds
  { city: "Delhi", name: "Punjabi Bagh", api: "delhi/punjabi-bagh" },
  { city: "Delhi", name: "Anand Vihar", api: "delhi/anand-vihar" },
  { city: "Delhi", name: "Mandir Marg", api: "delhi/mandir-marg" },
  { city: "Delhi", name: "R K Puram", api: "delhi/r-k-puram" },
  { city: "Delhi", name: "ITO", api: "delhi/ito" },
  { city: "Delhi", name: "DTU", api: "delhi/dtu" },
  { city: "Delhi", name: "IHBAS Dilshad Garden", api: "delhi/dilshad-garden" },
  { city: "Delhi", name: "Shadipur", api: "delhi/shadipur" },
  { city: "Delhi", name: "Sirifort", api: "delhi/sirifort" },
  { city: "Delhi", name: "Lodhi Road", api: "delhi/lodhi-road" },
  { city: "Delhi", name: "NSIT Dwarka", api: "delhi/dwarka-sector-8" },
  { city: "Delhi", name: "Rohini", api: "delhi/rohini" },
  { city: "Delhi", name: "Najafgarh", api: "delhi/najafgarh" },
  { city: "Delhi", name: "Ashok Vihar", api: "delhi/ashok-vihar" },
  { city: "Delhi", name: "Jahangirpuri", api: "delhi/jahangirpuri" },
  { city: "Delhi", name: "Wazirpur", api: "delhi/wazirpur" },
  { city: "Delhi", name: "Mundka", api: "delhi/mundka" },
  { city: "Delhi", name: "Bawana", api: "delhi/bawana" },
  { city: "Delhi", name: "Patparganj", api: "delhi/patparganj" },
  { city: "Delhi", name: "Vivek Vihar", api: "delhi/vivek-vihar" },
  // Add fallback generic Delhi stations for broader coverage
  { city: "Delhi", name: "Pusa", api: "delhi/pusa-imd" },
  { city: "Delhi", name: "IGI Airport", api: "delhi/igi-airport" },
  { city: "Delhi", name: "North Campus DU", api: "delhi/north-campus" },
  { city: "Delhi", name: "Burari Crossing", api: "delhi/burari" },
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
// MANUAL TRIGGER FUNCTION (for immediate refresh)
// -------------------------------------------
export async function triggerAqiRefresh() {
  console.log("🔄 Manual AQI refresh triggered");

  const results = [];
  for (const s of STATIONS) {
    const result = await fetchAQI(s.api);

    if (result) {
      await saveAQI(s.city, s.name, result.aqi, result.category);
      results.push({ station: s.name, aqi: result.aqi, category: result.category });
    } else {
      console.log(`⚠ Could not fetch AQI for ${s.name}`);
      results.push({ station: s.name, error: "Failed to fetch" });
    }
  }

  console.log(`✔ Manual refresh complete. Updated ${results.filter(r => !r.error).length}/${results.length} stations.`);
  return results;
}

// -------------------------------------------
// CRON JOB — Runs Every 10 Minutes
// -------------------------------------------
export function startAqiCron() {
  console.log("🔄 Starting Auto AQI Cron (every 10 min)");

  // Run immediately on startup
  setTimeout(async () => {
    console.log("🚀 Running initial AQI fetch on startup...");
    await triggerAqiRefresh();
  }, 5000); // Wait 5 seconds for server to fully start

  cron.schedule("*/10 * * * *", async () => {
    console.log("⏳ Scheduled AQI fetch...");
    await triggerAqiRefresh();
  });
}

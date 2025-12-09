// backend/src/services/featureBuilder.js

import { getOpenWeatherPollution } from "./openweatherPollution.js";
import { getAQICN } from "./aqicn.js";
import { getAQICNDetailed } from "./aqicnDetailed.js";
import { getRealtimeWeather } from "./realtimeWeather.js";
import { getRealtimeFires } from "./realtimeFires.js";
import { getFeatureNames } from "./featureSchema.js";
import { stations39 } from "../db/stations39.js";

// -------------------------------------------
// CACHE FOR AQICN DETAILED
// -------------------------------------------
const _cache = { aqicnDetailed: null };

const CACHE_TTL_MS =
  (process.env.AQICN_CACHE_MINUTES
    ? Number(process.env.AQICN_CACHE_MINUTES)
    : 10) *
  60 *
  1000;

// -------------------------------------------
// Cached AQICN Detailed
// -------------------------------------------
async function getCachedAQICNDetailed(opts = {}) {
  const now = Date.now();

  if (_cache.aqicnDetailed && now - _cache.aqicnDetailed.ts < CACHE_TTL_MS)
    return _cache.aqicnDetailed.value;

  try {
    const val = await getAQICNDetailed(opts);
    _cache.aqicnDetailed = { value: val, ts: Date.now() };
    return val;
  } catch (err) {
    console.error("getAQICNDetailed error:", err.message);
    return null;
  }
}

// -------------------------------------------
// Improved Fuzzy Station Matching
// -------------------------------------------
function pickStationFromAQICN(aqicn, stationName, referenceLat = null, referenceLon = null) {
  if (!aqicn || !Array.isArray(aqicn.stations)) {
    console.log("⚠️ No AQICN stations available, using requested station name:", stationName);
    return null;
  }

  const target = stationName.toLowerCase().replace(/delhi|india|,/g, "").trim();
  console.log("🔍 Looking for AQICN station matching:", target, "(from:", stationName + ")");
  console.log("📊 Available AQICN stations:", aqicn.stations.map(s => s.name).slice(0, 5).join(", "), "...");

  let exactMatch = null;
  let bestFuzzy = null;
  let bestScore = 0;

  for (const st of aqicn.stations) {
    const raw = (st.name || "").toLowerCase();
    const clean = raw.replace(/delhi|india|,/g, "").trim();

    // Try exact match first
    if (clean === target) {
      console.log("✅ EXACT AQICN match found:", st.name);
      exactMatch = st;
      break;
    }

    // Fuzzy matching as fallback
    if (clean.includes(target) || target.includes(clean) || raw.includes(target)) {
      const score = clean.length;
      if (score > bestScore) {
        bestFuzzy = st;
        bestScore = score;
      }
    }
  }

  const result = exactMatch || bestFuzzy;

  if (result) {
    console.log("🎯 AQICN Station Selected:", result.name, "AQI:", result.aqi);
    return result;
  }

  console.log("❌ No fuzzy match found, trying nearest station...");

  // Fallback → Nearest station
  if (!referenceLat || !referenceLon) {
    console.log("❌ No reference coordinates for nearest station fallback");
    return null;
  }

  const dist = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  let nearest = null;
  let minDist = Infinity;

  for (const st of aqicn.stations) {
    if (!st.lat || !st.lon) continue;

    const d = dist(referenceLat, referenceLon, st.lat, st.lon);
    if (d < minDist) {
      minDist = d;
      nearest = st;
    }
  }

  if (nearest) {
    console.log("📍 Using nearest AQICN station:", nearest.name, `(${minDist.toFixed(1)}km away)`);
  } else {
    console.log("❌ No nearest station found");
  }

  return nearest;
}

// -------------------------------------------
// MAIN FUNCTION
// -------------------------------------------
export async function buildFeatureVector(stationName = null) {
  console.log(
    "⚡ Building Feature Vector →",
    stationName ? `${stationName}` : "(city)"
  );

  // -------------------------------------------
  // FIX: Compute reference lat/lon ONLY here
  // -------------------------------------------
  let refLat = null;
  let refLon = null;

  if (stationName) {
    const refStation = stations39.find((s) => s.name === stationName);
    refLat = refStation?.lat || null;
    refLon = refStation?.lon || null;
  }

  // Parallel API calls
  const results = await Promise.allSettled([
    getOpenWeatherPollution(),
    getAQICN(),
    getRealtimeWeather(),
    getRealtimeFires(),
    getFeatureNames(),
  ]);

  const extract = (r) => (r.status === "fulfilled" ? r.value : null);

  const ow = extract(results[0]);
  const aqicnBasic = extract(results[1]);
  const weatherFallback = extract(results[2]) || {
    temp: 25,
    humidity: 40,
    wind: 2,
  };
  const fires = extract(results[3]) || { fire_count: 0 };

  // Fallback feature list when FastAPI is not available
  const FALLBACK_FEATURES = [
    "aqi", "pm25", "pm10", "no2", "o3", "so2", "co", "nh3",
    "temp", "humidity", "wind_speed", "fire_count", "station_code"
  ];

  const featureNames = extract(results[4]) || FALLBACK_FEATURES;
  console.log(`📋 Using ${featureNames.length} features:`, featureNames.length > 10 ? 'Full feature set' : featureNames);

  // -------------------------------------------
  // AQICN DATA → Detailed fallback to basic
  // -------------------------------------------
  let aqicn = null;

  const detailed = await getCachedAQICNDetailed({
    bounds: {
      minLat: 28.4,
      minLon: 76.8,
      maxLat: 28.9,
      maxLon: 77.4,
    },
    concurrency: 5,
  });

  if (detailed) {
    aqicn = {
      source: "aqicn",
      city_aqi: detailed.city_aqi,
      stations: detailed.stations || [],
      diagnostics: detailed.diagnostics || {},
    };
  } else {
    aqicn = aqicnBasic || {
      city_aqi: null,
      stations: [],
      diagnostics: {},
    };
  }

  // -------------------------------------------
  // MATCH STATION
  // -------------------------------------------
  let stationInfo = null;

  if (stationName) {
    stationInfo = pickStationFromAQICN(aqicn, stationName, refLat, refLon);

    if (stationInfo) {
      console.log("🎯 AQICN Station Matched:", stationInfo.name, "AQI:", stationInfo.aqi);
    } else {
      console.log("❌ No AQICN station match → using city AQI only");
    }
  }

  const stComp = stationInfo?.components || {};

  const exactAQI =
    stationInfo?.aqi ??
    aqicn.city_aqi ??
    0;

  const rt = {
    pm25: stComp.pm25 ?? stComp.p2 ?? ow?.pm25 ?? null,
    pm10: stComp.pm10 ?? stComp.p1 ?? ow?.pm10 ?? null,
    no2: ow?.no2 ?? null,
    o3: ow?.o3 ?? null,
    so2: ow?.so2 ?? null,
    co: ow?.co ?? null,
    nh3: ow?.nh3 ?? 5,
    aqi: exactAQI,
    temp: ow?.temp ?? weatherFallback.temp,
    humidity: ow?.humidity ?? weatherFallback.humidity,
    wind: ow?.wind ?? weatherFallback.wind,
    fire_count: fires.fire_count ?? 0,
    station_name: stationInfo?.name || stationName || null,
  };

  console.log("📊 Final station resolution:");
  console.log("  - Requested station:", stationName);
  console.log("  - AQICN matched station:", stationInfo?.name || "None");
  console.log("  - Final station_name in rt:", rt.station_name);

  const modelInput = {};

  featureNames.forEach((f) => {
    const key = f.toLowerCase();

    if (key.includes("pm25")) modelInput[f] = rt.pm25 ?? 0;
    else if (key.includes("pm10")) modelInput[f] = rt.pm10 ?? 0;
    else if (key.includes("no2")) modelInput[f] = rt.no2 ?? 0;
    else if (key === "no") modelInput[f] = rt.no2 ?? 0;
    else if (key.includes("o3")) modelInput[f] = rt.o3 ?? 0;
    else if (key.includes("so2")) modelInput[f] = rt.so2 ?? 0;
    else if (key.startsWith("co")) modelInput[f] = rt.co ?? 0;
    else if (key.includes("nh3")) modelInput[f] = rt.nh3 ?? 0;
    else if (key.includes("aqi")) modelInput[f] = exactAQI;
    else if (key.includes("fire")) modelInput[f] = rt.fire_count ?? 0;
    else if (key.includes("temp")) modelInput[f] = rt.temp ?? 0;
    else if (key.includes("hum")) modelInput[f] = rt.humidity ?? 0;
    else if (key.includes("wind")) modelInput[f] = rt.wind ?? 0;
    else if (key.includes("blh")) modelInput[f] = 300;
    else modelInput[f] = 0;
  });

  console.log("✔ Feature Vector READY.");

  return { modelInput, rt, aqicn };
}

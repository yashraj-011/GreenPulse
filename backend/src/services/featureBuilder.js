// backend/src/services/featureBuilder.js

import { getOpenWeatherPollution } from "./openweatherPollution.js";
import { getAQICN } from "./aqicn.js";
// import { getAQICNDetailed } from "./aqicnDetailed.js"; // Disabled for original compatibility
import { getRealtimeWeather } from "./realtimeWeather.js";
import { getRealtimeFires } from "./realtimeFires.js";
import { getFeatureNames } from "./featureSchema.js";
import { stations39 } from "../db/stations39.js";

// Cache disabled - using simple method for original compatibility

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
  // AQI DATA - Use Simple Method (Matching Original)
  // Always use basic AQICN method for compatibility with original
  // -------------------------------------------
  let aqicn = null;

  // Use simple method (same as Parth's original)
  const basicAqicn = aqicnBasic || {
    city_aqi: null,
    stations: [],
    diagnostics: { method: "basic_aqicn_only" },
  };

  aqicn = {
    source: "aqicn_basic_compatible",
    city_aqi: basicAqicn.city_aqi,
    stations: basicAqicn.stations || [],
    diagnostics: basicAqicn.diagnostics || { method: "basic_fallback" },
  };

  console.log("🔄 Using simple AQI method for original compatibility");
  console.log("📊 Basic AQICN city AQI:", aqicn.city_aqi);

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

  // Enhanced AQI debugging
  console.log("📊 AQI Resolution Details:");
  console.log("  - Requested station:", stationName);
  console.log("  - AQICN matched station:", stationInfo?.name || "None");
  console.log("  - Station AQI:", stationInfo?.aqi || "N/A");
  console.log("  - City median AQI:", aqicn.city_aqi || "N/A");
  console.log("  - Final AQI used:", exactAQI);
  console.log("  - AQI source:", aqicn.source || "unknown");

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

  // -------------------------------------------
  // ENHANCED FEATURE MAPPING FOR 57-FEATURE MODEL
  // -------------------------------------------
  const modelInput = {};

  featureNames.forEach((f) => {
    const key = f.toLowerCase();

    // Core pollutants (exact matches from training)
    if (key.includes("pm25") || key.includes("pm2.5")) {
      modelInput[f] = rt.pm25 ?? 0;
    } else if (key.includes("pm10")) {
      modelInput[f] = rt.pm10 ?? 0;
    } else if (key.includes("no2")) {
      modelInput[f] = rt.no2 ?? 0;
    } else if (key === "no") {
      modelInput[f] = rt.no2 ?? 0;
    } else if (key.includes("o3")) {
      modelInput[f] = rt.o3 ?? 0;
    } else if (key.includes("so2")) {
      modelInput[f] = rt.so2 ?? 0;
    } else if (key.startsWith("co")) {
      modelInput[f] = rt.co ?? 0;
    } else if (key.includes("nh3")) {
      modelInput[f] = rt.nh3 ?? 0;
    } else if (key.includes("benzene")) {
      // Benzene not available from current APIs - use correlation approximation
      // From training data, benzene often correlates with PM2.5/PM10
      modelInput[f] = Math.max((rt.pm25 ?? 0) * 0.1, (rt.pm10 ?? 0) * 0.05);

    // AQI features (current and lag approximations)
    } else if (key === "aqi") {
      modelInput[f] = exactAQI;
    } else if (key === "aqi_lag1") {
      // Approximate yesterday's AQI - assume slightly lower than current
      modelInput[f] = exactAQI * 0.95;
    } else if (key === "aqi_lag3") {
      // 3 days ago - more variation
      modelInput[f] = exactAQI * 0.9;
    } else if (key === "aqi_lag7") {
      // 7 days ago - seasonal pattern
      modelInput[f] = exactAQI * 0.85;
    } else if (key === "aqi_roll3d") {
      // 3-day rolling average - smooth current value
      modelInput[f] = exactAQI * 0.97;
    } else if (key === "aqi_roll7d") {
      // 7-day rolling average - more smoothed
      modelInput[f] = exactAQI * 0.92;

    // Weather features
    } else if (key.includes("temp")) {
      modelInput[f] = rt.temp ?? 25;
    } else if (key.includes("hum")) {
      modelInput[f] = rt.humidity ?? 40;
    } else if (key.includes("wind")) {
      modelInput[f] = rt.wind ?? 2;
    } else if (key.includes("blh") || key.includes("boundary")) {
      // Dynamic BLH based on weather conditions instead of hardcoded 300
      // BLH correlates with temperature and wind
      const temp = rt.temp ?? 25;
      const wind = rt.wind ?? 2;
      modelInput[f] = Math.max(200, Math.min(1500, 200 + temp * 15 + wind * 50));

    // Fire features (current and lag approximations)
    } else if (key === "fire_count") {
      modelInput[f] = rt.fire_count ?? 0;
    } else if (key === "fire_3_day_sum") {
      // Approximate 3-day fire accumulation
      modelInput[f] = (rt.fire_count ?? 0) * 2.5;
    } else if (key === "fire_7_day_sum") {
      // Approximate 7-day fire accumulation
      modelInput[f] = (rt.fire_count ?? 0) * 4.5;
    } else if (key === "fire_count_lag1") {
      // Yesterday's fire count
      modelInput[f] = (rt.fire_count ?? 0) * 0.8;
    } else if (key === "fire_count_lag3") {
      // 3 days ago fire count
      modelInput[f] = (rt.fire_count ?? 0) * 0.6;
    } else if (key === "fire_count_lag7") {
      // 7 days ago fire count
      modelInput[f] = (rt.fire_count ?? 0) * 0.4;
    } else if (key === "fire_count_roll7d") {
      // 7-day rolling average of fires
      modelInput[f] = (rt.fire_count ?? 0) * 0.7;

    // Station code (will be injected by FastAPI)
    } else if (key.includes("station_code")) {
      modelInput[f] = 0; // FastAPI will override this

    // Default for any other features
    } else {
      console.warn(`⚠️ Unknown feature '${f}' - setting to 0`);
      modelInput[f] = 0;
    }
  });

  console.log("✔ Feature Vector READY with enhanced mapping.");
  console.log(`📊 Generated ${Object.keys(modelInput).length} features for model`);

  return { modelInput, rt, aqicn };
}

// backend/services/aqicn.js
import axios from "axios";

const { AQICN_TOKEN } = process.env;

// ---------------------------------------------
// 1) Fetch AQI for a SINGLE station
// ---------------------------------------------
export async function fetchAQI(stationName) {
  try {
    const url = `https://api.waqi.info/feed/${encodeURIComponent(
      stationName
    )}/?token=${AQICN_TOKEN}`;

    const res = await axios.get(url, { timeout: 6000 });

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

    return {
      aqi,
      category,
      station: stationName,
      stations: [
        {
          name: stationName,
          aqi: aqi,
          category,
        },
      ],
    };
  } catch (e) {
    console.log("[AQICN] error:", e.message);
    return null;
  }
}

// ---------------------------------------------
// 2) Fetch MULTIPLE stations (used in safe route)
// ---------------------------------------------
export async function fetchMultipleAQI(stations) {
  const promises = stations.map((s) => fetchAQI(s.name));
  const results = await Promise.all(promises);

  return results.filter((r) => r !== null);
}

// ---------------------------------------------
// 3) getAQICN → REQUIRED BY featureBuilder.js
// Returns *city-level* AQI instead of station
// ---------------------------------------------
export async function getAQICN() {
  try {
    // using Delhi bounds method (simple version)
    const url = `https://api.waqi.info/map/bounds/?token=${AQICN_TOKEN}&latlng=28.4,76.8,28.9,77.4`;

    const resp = await axios.get(url);

    if (!resp.data || resp.data.status !== "ok") {
      console.warn("AQICN bounds failed – returning null");
      return {
        city_aqi: null,
        stations: [],
        diagnostics: {},
      };
    }

    const list = resp.data.data || [];
    const aqiValues = list
      .map((s) => Number(s.aqi))
      .filter((v) => Number.isFinite(v));

    const median = (arr) => {
      if (!arr.length) return null;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
    };

    const cityAQI = median(aqiValues);

    return {
      city_aqi: cityAQI ?? null,
      stations: list.map((s) => ({
        name: s.station?.name || s.name || "Unknown",
        aqi: Number(s.aqi),
        lat: s.lat,
        lon: s.lon,
      })),
      diagnostics: {
        median_aqi: cityAQI,
        max_aqi: Math.max(...aqiValues),
        min_aqi: Math.min(...aqiValues),
        count: aqiValues.length,
      },
    };
  } catch (err) {
    console.error("getAQICN error:", err.message);
    return {
      city_aqi: null,
      stations: [],
      diagnostics: {},
    };
  }
}

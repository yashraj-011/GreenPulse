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

// ---------------------------------------------
// 4) getStationAQI → Station-specific AQI (NEW)
// Returns specific station AQI using same method as frontend
// ---------------------------------------------
export async function getStationAQI(stationName) {
  try {
    // Station API mapping (same as frontend)
    const STATION_API_MAPPING = {
      "CRRI Mathura Road": "delhi/crri-mathura-road",
      "Burari Crossing": "delhi/burari",
      "North Campus DU": "delhi/north-campus",
      "IGI Airport (T3)": "delhi/igi-airport",
      "Pusa": "delhi/pusa-imd",
      "Aya Nagar": "delhi/aya-nagar",
      "Lodhi Road": "delhi/lodhi-road",
      "Shadipur": "delhi/shadipur",
      "IHBAS Dilshad Garden": "delhi/dilshad-garden",
      "NSIT Dwarka": "delhi/dwarka-sector-8",
      "ITO": "delhi/ito",
      "DTU": "delhi/dtu",
      "Sirifort": "delhi/sirifort",
      "Mandir Marg": "delhi/mandir-marg",
      "R K Puram": "delhi/r-k-puram",
      "Punjabi Bagh": "delhi/punjabi-bagh",
      "Ashok Vihar": "delhi/ashok-vihar",
      "Dr. Karni Singh Shooting Range": "delhi/shooting-range",
      "Dwarka Sector 8": "delhi/dwarka-sector-8",
      "Jahangirpuri": "delhi/jahangirpuri",
      "Jawaharlal Nehru Stadium": "delhi/jln-stadium",
      "Major Dhyan Chand Stadium": "delhi/major-dhyan-chand",
      "Narela": "delhi/narela",
      "Najafgarh": "delhi/najafgarh",
      "Okhla Phase-2": "delhi/okhla",
      "Nehru Nagar": "delhi/nehru-nagar",
      "Rohini": "delhi/rohini",
      "Patparganj": "delhi/patparganj",
      "Sonia Vihar": "delhi/sonia-vihar",
      "Wazirpur": "delhi/wazirpur",
      "Vivek Vihar": "delhi/vivek-vihar",
      "Bawana": "delhi/bawana",
      "Mundka": "delhi/mundka",
      "Sri Aurobindo Marg": "delhi/sri-aurobindo-marg",
      "Anand Vihar": "delhi/anand-vihar",
      "Alipur": "delhi/alipur",
      "Chandni Chowk": "delhi/chandni-chowk",
      "Lodhi Road (IITM)": "delhi/lodhi-road-iitm"
    };

    const apiEndpoint = STATION_API_MAPPING[stationName];

    if (!apiEndpoint) {
      console.warn(`❌ No API mapping found for station: ${stationName}`);
      return null;
    }

    const url = `https://api.waqi.info/feed/${apiEndpoint}/?token=${AQICN_TOKEN}`;
    const resp = await axios.get(url, { timeout: 6000 });

    if (!resp.data || resp.data.status !== "ok") {
      console.warn(`❌ AQICN station API failed for ${stationName}`);
      return null;
    }

    const aqi = resp.data.data.aqi;
    const pollutants = resp.data.data.iaqi || {};

    console.log(`✅ Station-specific AQI for ${stationName}: ${aqi}`);

    return {
      station_name: stationName,
      api_endpoint: apiEndpoint,
      aqi: Number(aqi),
      pollutants: pollutants,
      source: "AQICN Station-Specific",
      timestamp: new Date().toISOString()
    };

  } catch (err) {
    console.error(`getStationAQI error for ${stationName}:`, err.message);
    return null;
  }
}

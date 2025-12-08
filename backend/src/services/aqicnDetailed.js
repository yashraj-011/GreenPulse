// backend/services/aqicnDetailed.js
import axios from "axios";

// simple sleep
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Delhi center for distance weighting (change if you want different center)
const DELHI_CENTER = { lat: 28.6139, lon: 77.2090 };

// Configure concurrency & timeouts
const CONCURRENCY = 5;        // number of parallel /feed calls
const PER_UID_DELAY = 150;    // ms delay between batches to be kind to API
const AQICN_TOKEN = process.env.AQICN_TOKEN;

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = v => (v * Math.PI)/180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/* --- AQI helpers: EPA breakpoints for PM2.5 and PM10 --- */
/* Returns integer AQI or null */
export function pm25ToAQI(pm25) {
  if (pm25 === null || pm25 === undefined || isNaN(pm25)) return null;
  const c = Number(pm25);
  const breakpoints = [
    { cLow: 0.0,   cHigh: 12.0,  iLow: 0,   iHigh: 50 },
    { cLow: 12.1,  cHigh: 35.4,  iLow: 51,  iHigh: 100 },
    { cLow: 35.5,  cHigh: 55.4,  iLow: 101, iHigh: 150 },
    { cLow: 55.5,  cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
    { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 }
  ];
  for (const bp of breakpoints) {
    if (c >= bp.cLow && c <= bp.cHigh) {
      const aqi = ((bp.iHigh - bp.iLow)/(bp.cHigh - bp.cLow)) * (c - bp.cLow) + bp.iLow;
      return Math.round(aqi);
    }
  }
  return 500;
}

export function pm10ToAQI(pm10) {
  if (pm10 === null || pm10 === undefined || isNaN(pm10)) return null;
  const c = Number(pm10);
  const breakpoints = [
    { cLow: 0,   cHigh: 54,   iLow: 0,   iHigh: 50 },
    { cLow: 55,  cHigh: 154,  iLow: 51,  iHigh: 100 },
    { cLow: 155, cHigh: 254,  iLow: 101, iHigh: 150 },
    { cLow: 255, cHigh: 354,  iLow: 151, iHigh: 200 },
    { cLow: 355, cHigh: 424,  iLow: 201, iHigh: 300 },
    { cLow: 425, cHigh: 504,  iLow: 301, iHigh: 400 },
    { cLow: 505, cHigh: 604,  iLow: 401, iHigh: 500 }
  ];
  for (const bp of breakpoints) {
    if (c >= bp.cLow && c <= bp.cHigh) {
      const aqi = ((bp.iHigh - bp.iLow)/(bp.cHigh - bp.cLow)) * (c - bp.cLow) + bp.iLow;
      return Math.round(aqi);
    }
  }
  return 500;
}

/* Other pollutant conversions (NO2, O3, SO2, CO) should be added if you want full coverage.
   For now we compute station AQI primarily from PM2.5 and PM10 (dominant sources in Delhi).
*/

/* Fetch map/bounds to get station list (same as before) */
async function fetchBoundsStations(bounds) {
  const { minLat, minLon, maxLat, maxLon } = bounds;
  const url = `https://api.waqi.info/map/bounds/?token=${AQICN_TOKEN}&latlng=${minLat},${minLon},${maxLat},${maxLon}`;
  const resp = await axios.get(url, { timeout: 10000 });
  if (!resp.data || resp.data.status !== "ok" || !Array.isArray(resp.data.data)) {
    throw new Error("Invalid bounds response from AQICN");
  }
  return resp.data.data;
}

/* Fetch per-station feed using uid, returns iaqi components or null on fail */
async function fetchStationFeed(uid) {
  try {
    // feed by uid: use /feed/@{uid}/
    const url = `https://api.waqi.info/feed/@${uid}/?token=${AQICN_TOKEN}`;
    const resp = await axios.get(url, { timeout: 10000 });
    if (!resp.data || resp.data.status !== "ok" || !resp.data.data) return null;
    return resp.data.data; // contains iaqi object
  } catch (err) {
    // non-fatal
    return null;
  }
}

/* Batch fetch with concurrency */
async function fetchFeedsInBatches(uids, concurrency = CONCURRENCY) {
  const results = [];
  for (let i = 0; i < uids.length; i += concurrency) {
    const batch = uids.slice(i, i + concurrency);
    const promises = batch.map(uid => fetchStationFeed(uid));
    const settled = await Promise.allSettled(promises);
    settled.forEach((s, idx) => {
      const uid = batch[idx];
      if (s.status === "fulfilled" && s.value) {
        results.push({ uid, data: s.value });
      } else {
        results.push({ uid, data: null });
      }
    });
    // be polite
    await sleep(PER_UID_DELAY);
  }
  return results;
}

/* Compute station AQI from iaqi components */
function computeStationAqiFromIaQi(stationFeed) {
  // stationFeed.data.iaqi keys: pm25, pm10, no2, o3, so2, co, etc with {v: value}
  if (!stationFeed || !stationFeed.iaqi) return null;
  const iaqi = stationFeed.iaqi;
  const vals = {};

  vals.pm25 = iaqi.pm25?.v ?? null;
  vals.pm10 = iaqi.pm10?.v ?? null;
  // parse other components if you add conversions (no2, o3, so2, co)
  // compute pollutant AQIs:
  const aqiList = [];
  const pm25A = pm25ToAQI(vals.pm25);
  if (pm25A) aqiList.push(pm25A);
  const pm10A = pm10ToAQI(vals.pm10);
  if (pm10A) aqiList.push(pm10A);

  if (aqiList.length === 0) return null;
  // station AQI is max pollutant AQI
  const stationAqi = Math.max(...aqiList);
  return { stationAqi, components: vals };
}

/* Main exported function */
export async function getAQICNDetailed({
  bounds = { minLat: 28.40, minLon: 76.80, maxLat: 28.90, maxLon: 77.40 },
  concurrency = CONCURRENCY,
  weightByDistance = true
} = {}) {
  if (!AQICN_TOKEN) throw new Error("AQICN_TOKEN missing");

  // 1) fetch bounds
  const stations = await fetchBoundsStations(bounds);

  // extract uids
  const uids = stations.map(s => s.uid).filter(Boolean);

  // 2) fetch per-station feeds in batches
  const feeds = await fetchFeedsInBatches(uids, concurrency);

  // 3) compute per-station AQI + metadata
  const stationResults = [];
  for (const item of feeds) {
    const { uid, data } = item;
    const rawStation = stations.find(s => s.uid === uid);
    const stationMeta = {
      uid,
      name: rawStation?.station?.name ?? null,
      lat: rawStation?.station?.geo?.[0] ?? rawStation?.lat ?? null,
      lon: rawStation?.station?.geo?.[1] ?? rawStation?.lon ?? null,
      time: data?.time?.iso ?? rawStation?.station?.time ?? null
    };

    const comp = computeStationAqiFromIaQi(data);
    stationResults.push({
      ...stationMeta,
      aqi: comp?.stationAqi ?? null,
      components: comp?.components ?? null
    });
  }

  // filter valid
  const valid = stationResults.filter(s => Number.isFinite(s.aqi));
  if (valid.length === 0) {
    return { city_aqi: null, stations: stationResults, diagnostics: null };
  }

  // 4) aggregations: median, weighted mean, mean, max
  const aqiValues = valid.map(s => s.aqi).sort((a,b)=>a-b);
  const n = aqiValues.length;
  const median = (n % 2 === 1) ? aqiValues[(n-1)/2] : (aqiValues[n/2 -1] + aqiValues[n/2]) / 2;
  const mean = aqiValues.reduce((s,v)=>s+v,0)/n;
  const max = Math.max(...aqiValues);

  // distance-weighted mean
  let weightedMean = mean;
  if (weightByDistance) {
    const weights = [];
    let totalW = 0;
    for (const s of valid) {
      const d = haversineKm(s.lat ?? DELHI_CENTER.lat, s.lon ?? DELHI_CENTER.lon, DELHI_CENTER.lat, DELHI_CENTER.lon) || 1;
      const w = 1 / (d + 0.5); // add 0.5 km floor to avoid huge weight near zero distance
      weights.push(w);
      totalW += w;
    }
    const weightedSum = valid.reduce((acc, s, i) => acc + (s.aqi * weights[i]), 0);
    weightedMean = weightedSum / totalW;
  }

  // Round outputs
  const diagnostics = {
    station_count: stations.length,
    valid_count: valid.length,
    median_aqi: Math.round(median),
    mean_aqi: Math.round(mean),
    weighted_mean_aqi: Math.round(weightedMean),
    max_aqi: max
  };

  // choose default aggregator: median (but return diagnostics so caller can pick)
  return {
    city_aqi: Math.round(median),
    diagnostics,
    stations: stationResults
  };
}

// utils/aqicnSanitize.js
export function sanitizeAndAggregateAqi(stationsRaw, {
  staleMinutes = 60,
  excludeOutliers = true,
  outlierTrimPercent = 0.05,
  capAt = 1000
} = {}) {
  if (!Array.isArray(stationsRaw)) return null;

  const now = Date.now();
  const validStations = [];

  for (const s of stationsRaw) {
    // coerce numeric aqi
    const aqiNum = (typeof s.aqi === "string") ? (s.aqi === "-" ? null : Number(s.aqi)) : Number(s.aqi);
    if (!isFinite(aqiNum)) continue;

    // parse time if present
    const timeStr = s.station?.time ?? s.time ?? null;
    let ts = null;
    if (timeStr) {
      const d = new Date(timeStr);
      if (!isNaN(d)) ts = d.getTime();
    }

    // drop stale if we have a timestamp
    if (ts && ((now - ts) / 60000) > staleMinutes) continue;

    validStations.push({
      uid: s.uid,
      name: s.station?.name ?? null,
      lat: Array.isArray(s.station?.geo) ? s.station.geo[0] : (s.lat ?? null),
      lon: Array.isArray(s.station?.geo) ? s.station.geo[1] : (s.lon ?? null),
      aqi: Math.min(aqiNum, capAt),
      time: ts
    });
  }

  if (validStations.length === 0) {
    return {
      station_count: stationsRaw.length,
      valid_count: 0,
      city_aqi: null,
      median_aqi: null,
      mean_aqi: null,
      max_aqi: null,
      min_aqi: null,
      excluded_count: stationsRaw.length,
      excluded_values: [],
      stations: []
    };
  }

  const aqiValues = validStations.map(s => s.aqi).sort((a,b)=>a-b);
  const n = aqiValues.length;

  // median
  const median = (n % 2 === 1) ? aqiValues[(n-1)/2] : (aqiValues[n/2 -1] + aqiValues[n/2]) / 2;

  // trimmed mean (optional)
  let useValues = aqiValues;
  let excluded = [];
  if (excludeOutliers && n >= 10) {
    const trim = Math.floor(n * outlierTrimPercent);
    excluded = aqiValues.slice(0, trim).concat(aqiValues.slice(n - trim));
    useValues = aqiValues.slice(trim, n - trim);
  }

  const mean = useValues.reduce((s,v)=>s+v,0) / useValues.length;
  const max = Math.max(...aqiValues);
  const min = Math.min(...aqiValues);

  // choose aggregator: median recommended for robustness
  const cityAqi = Math.round(median);

  return {
    station_count: stationsRaw.length,
    valid_count: validStations.length,
    city_aqi: cityAqi,
    median_aqi: median,
    mean_aqi: mean,
    max_aqi: max,
    min_aqi: min,
    percentiles: {
      p10: aqiValues[Math.floor(0.1*(n-1))],
      p25: aqiValues[Math.floor(0.25*(n-1))],
      p75: aqiValues[Math.floor(0.75*(n-1))],
      p90: aqiValues[Math.floor(0.9*(n-1))]
    },
    excluded_count: stationsRaw.length - validStations.length,
    excluded_values: excluded,
    stations: validStations
  };
}

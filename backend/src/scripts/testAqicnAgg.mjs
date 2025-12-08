// backend/scripts/testAqicnAgg.mjs
import dotenv from "dotenv";
dotenv.config();

function toNumber(a) {
  if (typeof a === "string") {
    if (a === "-" || a.trim() === "") return null;
    const n = Number(a);
    return Number.isFinite(n) ? n : null;
  }
  return Number.isFinite(a) ? a : null;
}

function median(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a,b)=>a-b);
  const n = s.length;
  return n % 2 ? s[(n-1)/2] : (s[n/2 - 1] + s[n/2]) / 2;
}

function mean(arr) {
  if (!arr.length) return null;
  return arr.reduce((s,v)=>s+v,0) / arr.length;
}

function trimmedMean(arr, trimPct=0.05) {
  if (arr.length < 3) return mean(arr);
  const s = [...arr].sort((a,b)=>a-b);
  const n = s.length;
  const trim = Math.floor(n * trimPct);
  const use = s.slice(trim, n - trim);
  return mean(use);
}

function analyzeStations(stationsRaw) {
  const now = Date.now();
  const parsed = stationsRaw
    .map(s => {
      const aqi = toNumber(s.aqi);
      const timeStr = s.station?.time ?? s.time ?? null;
      const ts = timeStr ? (new Date(timeStr)).getTime() : null;
      return { uid: s.uid, name: s.station?.name, aqi, ts, raw: s };
    })
    .filter(s => s.aqi !== null && Number.isFinite(s.aqi));

  const aqiValues = parsed.map(p => p.aqi);

  const diagnostics = {
    totalStations: stationsRaw.length,
    validStations: parsed.length,
    list: parsed.map(p => ({ uid: p.uid, name: p.name, aqi: p.aqi, time: p.ts ? new Date(p.ts).toISOString() : null })),
    median: median(aqiValues),
    mean: mean(aqiValues),
    trimmedMean_5pct: trimmedMean(aqiValues, 0.05),
    trimmedMean_10pct: trimmedMean(aqiValues, 0.10),
    max: Math.max(...aqiValues),
    min: Math.min(...aqiValues),
    pctAbove200: (aqiValues.filter(v=>v>200).length / aqiValues.length) * 100
  };

  return diagnostics;
}

// ---------- USAGE ----------
(async () => {
  // Option A: fetch live from AQICN bounds (uncomment to use)
  // import axios from "axios";
  // const resp = await axios.get(`https://api.waqi.info/map/bounds/?token=${process.env.AQICN_TOKEN}&latlng=28.40,76.80,28.90,77.40`);
  // const stationsRaw = resp.data.data;

  // Option B: paste your station array here (replace ... with the station objects)
  const stationsRaw = [
    {"aqi":"191","uid":10117,"station":{"name":"Shaheed Sukhdev ...","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"190","uid":11267,"station":{"name":"Pooth Khurd ...","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"279","uid":12465,"station":{"name":"Sector-116, Noida","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"168","uid":8685,"station":{"name":"Vikas Sadan Gurgaon","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"269","uid":8179,"station":{"name":"Shadipur","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"359","uid":10119,"station":{"name":"National Institute of Malaria Research","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"159","uid":2554,"station":{"name":"Mandir Marg","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"197","uid":11856,"station":{"name":"Vasundhara, Ghaziabad","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"203","uid":10707,"station":{"name":"Sri Auribindo Marg","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"196","uid":10123,"station":{"name":"CRRI Mathura Road","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"219","uid":10112,"station":{"name":"PGDAV College","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"247","uid":2556,"station":{"name":"R.K. Puram","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"186","uid":10122,"station":{"name":"Lodhi Road","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"194","uid":3715,"station":{"name":"ITO","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"198","uid":12452,"station":{"name":"Loni, Ghaziabad","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"179","uid":12435,"station":{"name":"Indirapuram","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"198","uid":11300,"station":{"name":"NISE Gwal Pahari","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"203","uid":10110,"station":{"name":"Dr. Karni Singh Shooting Range","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"227","uid":11863,"station":{"name":"Sector - 125, Noida","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"173","uid":9290,"station":{"name":"DTU","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"187","uid":10125,"station":{"name":"Burari Crossing","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"204","uid":12816,"station":{"name":"Sector-51, Gurugram","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"218","uid":10116,"station":{"name":"DITE Okhla","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"209","uid":10126,"station":{"name":"Aya Nagar","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"169","uid":10113,"station":{"name":"ITI Jahangirpuri","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"11","uid":12814,"station":{"name":"Sector 30, Faridabad","time":"2025-11-27T15:30:00+09:00"}},
    {"aqi":"180","uid":10704,"station":{"name":"Mother Dairy Plant","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"165","uid":11865,"station":{"name":"Sector - 62, Noida","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"195","uid":12466,"station":{"name":"Sector-1, Noida","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"183","uid":10114,"station":{"name":"Delhi Institute of Tool Engineering","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"106","uid":12447,"station":{"name":"Arya Nagar, Bahadurgarh","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"169","uid":10121,"station":{"name":"Sonia Vihar Water Treatment Plant","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"201","uid":2555,"station":{"name":"Punjabi Bagh","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"178","uid":10706,"station":{"name":"Narela","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"202","uid":10120,"station":{"name":"Bramprakash Ayurvedic Hospital","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"188","uid":12890,"station":{"name":"Teri Gram","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"172","uid":2553,"station":{"name":"Anand Vihar","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"732","uid":10705,"station":{"name":"Jawaharlal Nehru Stadium","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"177","uid":10118,"station":{"name":"ITI Shahdra","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"167","uid":11266,"station":{"name":"Alipur","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"174","uid":10111,"station":{"name":"Major Dhyan Chand National Stadium","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"199","uid":10124,"station":{"name":"Pusa","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"184","uid":10115,"station":{"name":"Satyawati College","time":"2025-11-27T21:30:00+09:00"}},
    {"aqi":"203","uid":10708,"station":{"name":"Mundka","time":"2025-11-27T21:30:00+09:00"}}
  ];

  const diag = analyzeStations(stationsRaw);
  console.log("Diagnostics:\n", JSON.stringify(diag, null, 2));
})();

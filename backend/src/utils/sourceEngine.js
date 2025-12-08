// src/api/utils/sourceEngine.js

export async function buildSourceBreakdown(realtime, prisma, stationName) {
  const {
    pm25 = 0,
    pm10 = 0,
    no2 = 0,
    so2 = 0,
    co = 0,
    fire_count = 0,
    wind = 0,
  } = realtime || {};

  // 🔹 1) Base scientific heuristic (SHAP-inspired)
  let trafficScore = 0.4 * pm25 + 1.2 * no2 + 0.8 * co;
  let stubbleScore = 15 * fire_count;
  let dustScore = 0.9 * pm10;
  let industryScore = 0.5 * so2 + 0.3 * pm25 + 0.2 * no2;
  let garbageScore = 0.3 * pm25 + 0.3 * co;

  // 🔹 2) Wind dispersion effect
  const windFactor = wind > 5 ? 0.8 : 1.0;
  trafficScore *= windFactor;
  dustScore *= windFactor;
  garbageScore *= windFactor;

  // 🔹 3) TOTAL scoring
  let total =
    trafficScore + stubbleScore + dustScore + industryScore + garbageScore;

  if (!total || total <= 0) {
    return {
      traffic: 20,
      stubble: 20,
      dust: 20,
      industry: 20,
      garbage: 20,
    };
  }

  const pct = (v) => Math.round((v / total) * 100);

  return {
    traffic: pct(trafficScore),
    stubble: pct(stubbleScore),
    dust: pct(dustScore),
    industry: pct(industryScore),
    garbage: pct(garbageScore),
  };
}

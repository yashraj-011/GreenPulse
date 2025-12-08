// Sample N evenly spaced points along polyline
export function samplePolyline(points, n) {
  if (points.length <= n) return points;
  const step = Math.floor(points.length / n);
  const sampled = [];
  for (let i = 0; i < points.length; i += step) {
    sampled.push(points[i]);
  }
  return sampled;
}

// Compute exposure
export function computeExposure(points) {
  let exposure = 0;
  let totalAQI = 0;

  for (let p of points) {
    totalAQI += p.aqi;
    exposure += p.aqi; // simple but effective
  }

  return {
    totalDistKm: points.length * 0.15, // approx
    exposure,
    avgAQI: totalAQI / points.length,
  };
}

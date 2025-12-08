import express from "express";
import { decodePolyline } from "../../utils/polylineDecode.js";
import { samplePolyline, computeExposure } from "../../utils/exposureCalc.js";
import { stations39 } from "../../db/stations39.js"; // your file

const router = express.Router();

// Haversine Distance
function dist(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Find nearest AQI station from your 39 Delhi stations
function nearestAqiStation(lat, lon) {
  let nearest = null;
  let minD = Infinity;

  for (const st of stations39) {
    const d = dist(lat, lon, st.lat, st.lon);
    if (d < minD) {
      minD = d;
      nearest = st;
    }
  }

  return nearest;
}

// Route risk category
function getRisk(exposure) {
  if (exposure < 1500) return "Low";
  if (exposure < 3500) return "Moderate";
  return "High";
}

router.post("/safe-route", async (req, res) => {
  try {
    const { origin, destination } = req.body;
    if (!origin || !destination)
      return res.json({ success: false, error: "origin & destination required" });

    const gUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=driving&alternatives=true&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    const gRes = await fetch(gUrl);
    const gJson = await gRes.json();

    if (gJson.status !== "OK") {
      return res.json({
        success: false,
        error: "Google Directions error: " + gJson.status,
      });
    }

    const processed = await Promise.all(
      gJson.routes.map(async (route, idx) => {
        const leg = route.legs[0];
        const decoded = decodePolyline(route.overview_polyline.points);

        // sample 40 points
        const pts = samplePolyline(decoded, 40);

        // attach AQI from nearest station
        const ptsWithAQI = pts.map((p) => {
          const st = nearestAqiStation(p.lat, p.lng);
          return { ...p, aqi: st?.aqi || 120 };
        });

        const { totalDistKm, exposure, avgAQI } = computeExposure(ptsWithAQI);

        return {
          id: idx,
          summary: route.summary || `Route ${idx + 1}`,
          distanceMeters: leg.distance.value,
          durationSeconds: leg.duration.value,
          aqiExposure: Math.round(exposure),
          avgAQI: Math.round(avgAQI),
          risk: getRisk(exposure),
          points: decoded,
        };
      })
    );

    processed.sort((a, b) => a.aqiExposure - b.aqiExposure);

    return res.json({
      success: true,
      bestRoute: processed[0],
      alternatives: processed.slice(1),
    });
  } catch (e) {
    console.log("Safe Route Error:", e);
    return res.json({ success: false, error: "Internal error" });
  }
});

export default router;

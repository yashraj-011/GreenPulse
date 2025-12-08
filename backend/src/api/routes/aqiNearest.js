import express from "express";
import prisma from "../../config/prisma.js";

const router = express.Router();

function distance(lat1, lon1, lat2, lon2) {
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

router.get("/nearest-aqi", async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "lat and lng are required"
      });
    }

    // Fetch latest 1 AQI row per station
    const rows = await prisma.aqiData.findMany({
      orderBy: { createdAt: "desc" },
      take: 2000
    });

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "AQI database is empty"
      });
    }

    let nearest = null;
    let minDist = Infinity;

    for (const row of rows) {
      const d = distance(
        parseFloat(lat),
        parseFloat(lng),
        row.lat || 0,
        row.lon || 0
      );

      if (d < minDist) {
        minDist = d;
        nearest = row;
      }
    }

    return res.json({ success: true, station: nearest });
  } catch (err) {
    console.error("nearest-aqi error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

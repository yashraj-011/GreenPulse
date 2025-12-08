import express from "express";
import prisma from "../../config/prisma.js";
import axios from "axios";

const router = express.Router();

// Fix: Allow GET on both /api/aqi and /api/aqi/
router.get(["/", ""], async (req, res) => {
  try {
    const all = await prisma.aqiData.findMany({
      orderBy: { createdAt: "desc" },
      take: 200
    });
    res.json({ success: true, data: all });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Live AQI endpoint - fetch directly from AQICN API
router.get("/live/:stationApi", async (req, res) => {
  try {
    const { stationApi } = req.params;
    const AQICN_TOKEN = process.env.AQICN_TOKEN;

    if (!AQICN_TOKEN) {
      return res.status(500).json({
        success: false,
        error: "AQICN_TOKEN not configured"
      });
    }

    // Fetch from AQICN API
    const url = `https://api.waqi.info/feed/${stationApi}/?token=${AQICN_TOKEN}`;
    const response = await axios.get(url);

    if (!response.data || response.data.status !== "ok") {
      return res.status(404).json({
        success: false,
        error: "Station not found or API error"
      });
    }

    const aqi = response.data.data.aqi;
    const category = aqi <= 50 ? "Good"
      : aqi <= 100 ? "Moderate"
      : aqi <= 200 ? "Poor"
      : aqi <= 300 ? "Very Poor"
      : "Severe";

    res.json({
      success: true,
      data: {
        aqi,
        category,
        timestamp: new Date().toISOString(),
        station: stationApi
      }
    });

  } catch (error) {
    console.error("Live AQI fetch error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch live AQI data"
    });
  }
});

// Debug endpoint to check AQI data status
router.get("/status", async (req, res) => {
  try {
    const count = await prisma.aqiData.count();
    const latest = await prisma.aqiData.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        stationName: true,
        aqiValue: true,
        category: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      totalRecords: count,
      latestEntries: latest,
      message: count === 0 ? "No AQI data in database." : `Found ${count} AQI records in database`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save AQI
router.post("/save", async (req, res) => {
  try {
    const { city, stationName, value, category } = req.body;

    const row = await prisma.aqiData.create({
      data: { city, stationName, aqiValue: value, category }
    });

    res.json({ success: true, row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

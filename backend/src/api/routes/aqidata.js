import express from "express";
import prisma from "../../config/prisma.js";
import { triggerAqiRefresh } from "../../cron/aqiCron.js";

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

// Manual refresh endpoint to trigger immediate AQI data fetch
router.post("/refresh", async (req, res) => {
  try {
    console.log("🔄 Manual AQI refresh requested via API");
    const results = await triggerAqiRefresh();

    res.json({
      success: true,
      message: "AQI data refresh completed",
      results: results,
      updated: results.filter(r => !r.error).length,
      total: results.length
    });
  } catch (err) {
    console.error("Manual AQI refresh failed:", err);
    res.status(500).json({
      success: false,
      message: "AQI refresh failed",
      error: err.message
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
      message: count === 0 ? "No AQI data found. Use POST /api/aqi/refresh to fetch data." : `Found ${count} AQI records`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
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
